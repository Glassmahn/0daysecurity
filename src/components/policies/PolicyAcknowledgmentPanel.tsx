import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { CheckCircle, Loader2, FileText, User } from 'lucide-react';
import { toast } from 'sonner';

interface PolicyAcknowledgmentPanelProps {
  policyId?: string;
}

export function PolicyAcknowledgmentPanel({ policyId }: PolicyAcknowledgmentPanelProps) {
  const session = useAuth();
  const user = session?.user;
  const [policies, setPolicies] = useState<any[]>([]);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [acknowledgments, setAcknowledgments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;

    if (policyId) {
      const pid = policyId;
      async function loadForPolicy() {
        const { data: pol } = await supabase
          .from('policies')
          .select('id, title, version, status')
          .eq('id', pid)
          .maybeSingle();

        const { data: acks } = await supabase
          .from('policy_acknowledgments')
          .select('*, user:user_id (display_name, email)')
          .eq('policy_id', pid);

        if (cancelled) return;
        setPolicies(pol ? [pol] : []);
        setAcknowledgments(acks ?? []);
        const acked = new Set((acks ?? []).map((a: any) => a.user_id));
        if (acked.has(userId)) setAcknowledged(new Set([pid]));
        setLoading(false);
      }
      loadForPolicy();
    } else {
      async function loadForUser() {
        const [{ data: pols }, { data: acks }] = await Promise.all([
          supabase.from('policies').select('id, title, version, status').eq('status', 'published'),
          supabase.from('policy_acknowledgments').select('policy_id, status').eq('user_id', userId),
        ]);

        if (cancelled) return;

        const acked = new Set<string>((acks ?? []).map((a: any) => a.policy_id));
        setPolicies(pols ?? []);
        setAcknowledged(acked);
        setLoading(false);
      }
      loadForUser();
    }

    return () => { cancelled = true; };
  }, [user, policyId]);

  async function handleAcknowledge(policyId: string) {
    if (!user) { toast.error('Not authenticated'); return; }
    setAcknowledging(policyId);
    const { error } = await supabase
      .from('policy_acknowledgments')
      .insert({
        policy_id: policyId,
        user_id: user.id,
        status: 'acknowledged',
      });
    if (error) {
      toast.error('Failed to acknowledge policy');
    } else {
      setAcknowledged(prev => new Set(prev).add(policyId));
      toast.success('Policy acknowledged');
    }
    setAcknowledging(null);
  }

  if (loading) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Policy Acknowledgments</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (policyId) {
    const policy = policies[0];
    if (!policy) return <p className="text-sm text-muted-foreground text-center py-6">Policy not found</p>;

    const isAcked = acknowledged.has(policy.id);

    return (
      <div className="space-y-4">
        {/* Current user's acknowledgment status */}
        <div className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${isAcked ? 'border-status-passing/20 bg-status-passing/5' : 'border-border/60'}`}>
          <div className="flex items-center gap-3">
            <FileText className={`h-5 w-5 ${isAcked ? 'text-status-passing' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-sm font-medium text-foreground">{policy.title}</p>
              <p className="text-xs text-muted-foreground">v{policy.version ?? '1.0'}</p>
            </div>
          </div>
          {isAcked ? (
            <span className="flex items-center gap-1 text-xs text-status-passing font-medium">
              <CheckCircle className="h-3.5 w-3.5" /> Acknowledged
            </span>
          ) : (
            <button
              onClick={() => handleAcknowledge(policy.id)}
              disabled={acknowledging === policy.id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {acknowledging === policy.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Acknowledge
            </button>
          )}
        </div>

        {/* All acknowledgments list */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">All Acknowledgments ({acknowledgments.length})</h4>
          {acknowledgments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No one has acknowledged this policy yet.</p>
          ) : (
            <div className="space-y-2">
              {acknowledgments.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {(a.user as any)?.display_name ?? a.user_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Acknowledged {new Date(a.acknowledged_at ?? a.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {a.version_acknowledged ? ` · v${a.version_acknowledged}` : ''}
                    </p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-status-passing shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const pending = policies.filter(p => !acknowledged.has(p.id));

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Policy Acknowledgments</h3>
        <span className="text-xs text-muted-foreground">{policies.length - pending.length}/{policies.length} acknowledged</span>
      </div>
      {policies.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No published policies</p>
      ) : (
        <div className="space-y-2">
          {policies.map(p => {
            const isAcked = acknowledged.has(p.id);
            return (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isAcked ? 'border-status-passing/20 bg-status-passing/5' : 'border-border/60 hover:border-primary/30'}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`h-4 w-4 shrink-0 ${isAcked ? 'text-status-passing' : 'text-muted-foreground'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">v{p.version ?? '1.0'}</p>
                  </div>
                </div>
                {isAcked ? (
                  <span className="flex items-center gap-1 text-xs text-status-passing font-medium shrink-0">
                    <CheckCircle className="h-3.5 w-3.5" /> Acknowledged
                  </span>
                ) : (
                  <button
                    onClick={() => handleAcknowledge(p.id)}
                    disabled={acknowledging === p.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {acknowledging === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Acknowledge
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
