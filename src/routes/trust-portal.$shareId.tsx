import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Globe, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/trust-portal/$shareId')({
  component: SharedPortalView,
});

function SharedPortalView() {
  const { shareId } = Route.useParams();
  const [share, setShare] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complianceData, setComplianceData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: shareData, error: shareError } = await supabase
        .from('trust_portal_shares')
        .select('id, name, status, expires_at, access_count, frameworks, last_accessed_at')
        .eq('token', shareId)
        .single();

      if (shareError || !shareData) {
        setError('This share link is invalid or has expired.');
        setLoading(false);
        return;
      }

      if (shareData.status !== 'active') {
        setError('This share link is no longer active.');
        setLoading(false);
        return;
      }

      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        setError('This share link has expired.');
        setLoading(false);
        return;
      }

      // Track access
      await (supabase as any)
        .from('trust_portal_shares')
        .update({
          last_accessed_at: new Date().toISOString(),
          access_count: (shareData.access_count ?? 0) + 1,
        })
        .eq('id', shareData.id);

      setShare(shareData);

      // Load compliance data for the selected frameworks
      if (shareData.frameworks?.length) {
        const { data: frameworks } = await supabase
          .from('frameworks')
          .select('id, name, score, passing_controls, total_controls')
          .in('name', shareData.frameworks);

        const { data: snapshots } = await supabase
          .from('compliance_snapshots')
          .select('id, snapshot_date, framework, score_pct, implemented, total_controls')
          .in('framework', shareData.frameworks)
          .order('snapshot_date', { ascending: false })
          .limit(shareData.frameworks.length * 30);

        setComplianceData({ frameworks, snapshots });
      }

      setLoading(false);
    }
    load();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading compliance data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Link Not Available</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, contact the sender and ask them to re-share the link.
          </p>
        </div>
      </div>
    );
  }

  const latestSnapshots: any[] = complianceData?.snapshots
    ? Object.values(
        (complianceData.snapshots as any[]).reduce((acc: Record<string, any>, s: any) => {
          if (!acc[s.framework] || s.snapshot_date > acc[s.framework].snapshot_date) acc[s.framework] = s;
          return acc;
        }, {} as Record<string, any>),
      )
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ZeroDay Security</h1>
              <p className="text-xs text-muted-foreground">Compliance Status Portal</p>
            </div>
          </div>
          {share?.name && (
            <p className="text-sm text-muted-foreground mt-2">{share.name}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Framework scores */}
        {complianceData?.frameworks?.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Compliance Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(complianceData.frameworks as any[]).map((fw: any) => {
                const snap = latestSnapshots.find((s: any) => s.framework === fw.name);
                const score = snap?.score_pct ?? fw.score ?? 0;
                const passing = snap?.implemented ?? fw.passing_controls ?? 0;
                const total = snap?.total_controls ?? fw.total_controls ?? 1;
                return (
                  <div key={fw.id} className="bg-card border border-border/60 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{fw.name}</h3>
                      <span className={`text-lg font-bold ${score >= 80 ? 'text-status-passing' : score >= 50 ? 'text-status-in-progress' : 'text-status-failing'}`}>
                        {score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-status-passing' : score >= 50 ? 'bg-status-in-progress' : 'bg-status-failing'}`}
                        style={{ width: `${score}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{passing} of {total} controls passing</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Readme / placeholder */}
        <section className="bg-card border border-border/60 rounded-xl p-8 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Trust Center</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            This portal provides real-time compliance status for ZeroDay Security.
            Contact the sender for additional details or specific evidence packages.
          </p>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
          Powered by ZeroDay Security · Compliance data updated in real-time
        </div>
      </div>
    </div>
  );
}
