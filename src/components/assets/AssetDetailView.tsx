import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import {
  ArrowLeft, Server, Database, Cloud, Monitor, Network, HardDrive,
  Shield, AlertTriangle, Bug, Scan,
  Calendar, User, Loader2, FileText
} from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  server: Server,
  database: Database,
  cloud_resource: Cloud,
  saas_app: Monitor,
  device: Network,
  data_store: HardDrive,
};

const typeStyles: Record<string, string> = {
  server: 'bg-chart-1/15 text-chart-1',
  database: 'bg-chart-5/15 text-chart-5',
  cloud_resource: 'bg-chart-3/15 text-chart-3',
  saas_app: 'bg-chart-4/15 text-chart-4',
  device: 'bg-primary/15 text-primary',
  data_store: 'bg-chart-2/15 text-chart-2',
};

const classificationStyles: Record<string, string> = {
  public: 'bg-muted text-muted-foreground',
  internal: 'bg-status-in-progress/15 text-status-in-progress',
  confidential: 'bg-status-warning/15 text-status-warning',
  restricted: 'bg-severity-high/15 text-severity-high',
  pii: 'bg-severity-critical/15 text-severity-critical',
};

function riskColor(score: number) {
  if (score >= 80) return 'text-severity-critical';
  if (score >= 60) return 'text-severity-high';
  if (score >= 40) return 'text-severity-medium';
  return 'text-status-passing';
}

function riskBg(score: number) {
  if (score >= 80) return 'bg-severity-critical';
  if (score >= 60) return 'bg-severity-high';
  if (score >= 40) return 'bg-severity-medium';
  return 'bg-status-passing';
}

interface AssetDetailViewProps {
  assetId: string;
}

export function AssetDetailView({ assetId }: AssetDetailViewProps) {
  const [asset, setAsset] = useState<Tables<'assets'> | null>(null);
  const [controls, setControls] = useState<Tables<'controls'>[]>([]);
  const [risks, setRisks] = useState<Tables<'risks'>[]>([]);
  const [controlsLoading, setControlsLoading] = useState(false);
  const [risksLoading, setRisksLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vulns' | 'compliance' | 'controls' | 'risks' | 'scans'>('controls');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('assets')
          .select('*')
          .eq('id', assetId)
          .maybeSingle();
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setAsset(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load asset');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [assetId]);

  useEffect(() => {
    if (!asset) return;
    let cancelled = false;
    setControlsLoading(true);
    supabase.from('controls').select('*').eq('category', asset.type ?? '').limit(20).then(({ data }) => {
      if (!cancelled) setControls((data ?? []) as Tables<'controls'>[]);
      setControlsLoading(false);
    });
    return () => { cancelled = true; };
  }, [asset]);

  useEffect(() => {
    if (!asset) return;
    let cancelled = false;
    setRisksLoading(true);
    supabase.from('risks').select('*').eq('category', asset.type ?? '').limit(20).then(({ data }) => {
      if (!cancelled) setRisks((data ?? []) as Tables<'risks'>[]);
      setRisksLoading(false);
    });
    return () => { cancelled = true; };
  }, [asset]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-severity-critical" />
        <p className="text-sm text-severity-critical">{error}</p>
        <Link to="/assets" className="text-primary hover:underline text-sm">← Back to Assets</Link>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Server className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Asset not found</h2>
        <Link to="/assets" className="text-primary hover:underline text-sm">← Back to Assets</Link>
      </div>
    );
  }

  const TypeIcon = typeIcons[asset.type ?? ''] ?? Server;
  const criticalityScore = asset.criticality === 'critical' ? 80 : asset.criticality === 'high' ? 60 : asset.criticality === 'medium' ? 40 : 20;

  const tabs = [
    { key: 'controls' as const, label: 'Linked Controls', count: controls.length },
    { key: 'risks' as const, label: 'Linked Risks', count: risks.length },
    { key: 'vulns' as const, label: 'Vulnerabilities', count: 0 },
    { key: 'compliance' as const, label: 'Compliance', count: null },
    { key: 'scans' as const, label: 'Scan History', count: 0 },
  ];

  const ctrlStatusStyles: Record<string, string> = {
    implemented: 'bg-status-passing/15 text-status-passing',
    in_progress: 'bg-status-warning/15 text-status-warning',
    failing: 'bg-status-critical/15 text-status-critical',
    not_started: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/assets">
          <button className="mt-1 p-1 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${typeStyles[asset.type ?? ''] || 'bg-muted text-muted-foreground'}`}>
              {(asset.type ?? 'unknown').replace(/_/g, ' ')}
            </span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
              asset.status === 'active' ? 'bg-status-passing/15 text-status-passing' : 'bg-muted text-muted-foreground'
            }`}>{asset.status}</span>
            {asset.data_classification && (
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${classificationStyles[asset.data_classification] || 'bg-muted text-muted-foreground'}`}>
                {asset.data_classification}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{asset.location ?? 'Unknown location'}</span>
          </div>
          <h1 className="text-lg font-bold text-foreground font-mono">{asset.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Owner: <strong className="text-foreground">{asset.owner_id ?? 'Unassigned'}</strong></span>
            {asset.ip_address && <span className="flex items-center gap-1">IP: <strong className="text-foreground font-mono">{asset.ip_address}</strong></span>}
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Created: <strong className="text-foreground">{new Date(asset.created_at).toLocaleDateString('en-CA')}</strong></span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Criticality</div>
          <div className={`text-2xl font-bold ${riskColor(criticalityScore)}`}>{asset.criticality ?? 'unknown'}</div>
          <div className="mt-2">
            <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${riskBg(criticalityScore)}`} style={{ width: `${criticalityScore}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Type</div>
          <div className="text-2xl font-bold text-foreground capitalize">{(asset.type ?? 'unknown').replace(/_/g, ' ')}</div>
          <div className="text-xs text-muted-foreground mt-1">{asset.location ?? '—'}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Classification</div>
          <div className={`text-lg font-bold capitalize ${asset.data_classification ? riskColor(asset.data_classification === 'restricted' || asset.data_classification === 'pii' ? 80 : asset.data_classification === 'confidential' ? 60 : asset.data_classification === 'internal' ? 40 : 20) : 'text-muted-foreground'}`}>
            {asset.data_classification ?? '—'}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Data sensitivity level</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</div>
          <div className={`text-lg font-bold capitalize ${asset.status === 'active' ? 'text-status-passing' : 'text-muted-foreground'}`}>
            {asset.status}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Updated {new Date(asset.updated_at).toLocaleDateString('en-CA')}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary rounded-md p-0.5 overflow-x-auto" role="tablist">
        {tabs.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}{t.count !== null ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* Linked Controls tab */}
      {activeTab === 'controls' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" /> Linked Controls ({controls.length})
            </h3>
          </div>
          {controlsLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
          ) : controls.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No controls linked to this asset type. Assign controls from the Controls page.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {controls.map(c => (
                <Link key={c.id} to="/controls/$controlId" params={{ controlId: c.id }}>
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-surface transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                      <span className="text-sm text-foreground truncate">{c.title}</span>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${ctrlStatusStyles[c.status] ?? ''}`}>{c.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked Risks tab */}
      {activeTab === 'risks' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> Linked Risks ({risks.length})
            </h3>
          </div>
          {risksLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
          ) : risks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No risks linked to this asset type.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {risks.map(r => (
                <Link key={r.id} to="/risk-register/$riskId" params={{ riskId: r.id }}>
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-surface transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-foreground truncate">{r.title}</span>
                      <span className="text-xs text-muted-foreground">{r.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Score: {r.risk_score ?? '—'}</span>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.status === 'open' ? 'bg-status-failing/15 text-status-failing' : r.status === 'mitigated' ? 'bg-status-passing/15 text-status-passing' : 'bg-muted text-muted-foreground'}`}>{r.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'vulns' && (
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <Bug className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Vulnerability data is not yet available for this asset.</p>
            <p className="text-xs text-muted-foreground">Integrate a vulnerability scanner to populate this section.</p>
          </div>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" /> Compliance Status
          </h3>
          <div className="flex flex-col items-center justify-center text-center gap-3 py-8">
            <Shield className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Compliance data is not yet available.</p>
            <p className="text-xs text-muted-foreground">Link this asset to controls to track compliance.</p>
          </div>
        </div>
      )}

      {activeTab === 'scans' && (
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <Scan className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No scan results available.</p>
            <p className="text-xs text-muted-foreground">Connect a scanning tool to see results here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
