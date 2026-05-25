import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, FileText, Image, Settings, PenTool, ScrollText, CloudDownload,
  Zap, Clock, CheckCircle2, XCircle, AlertTriangle, Shield, Calendar,
  RefreshCw, ExternalLink, User, Timer, History
} from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  screenshot: Image, document: FileText, api_pull: CloudDownload,
  config_export: Settings, attestation: PenTool, log: ScrollText,
  report: FileText, certificate: FileText, scan_result: FileText,
  policy_doc: FileText, training_record: FileText, access_review: FileText,
  change_record: ScrollText, vendor_doc: FileText, audit_report: FileText,
  risk_assessment: FileText, incident_report: FileText, other: FileText,
};

const typeLabels: Record<string, string> = {
  screenshot: 'Screenshot', document: 'Document', api_pull: 'API Pull',
  config_export: 'Config Export', attestation: 'Attestation', log: 'Log',
  report: 'Report', certificate: 'Certificate', scan_result: 'Scan Result',
  policy_doc: 'Policy Doc', training_record: 'Training Record',
  access_review: 'Access Review', change_record: 'Change Record',
  vendor_doc: 'Vendor Doc', audit_report: 'Audit Report',
  risk_assessment: 'Risk Assessment', incident_report: 'Incident Report',
  other: 'Other',
};

const statusConfig: Record<string, { style: string; icon: React.ElementType; label: string; bg: string }> = {
  valid: { style: 'text-status-passing', icon: CheckCircle2, label: 'Valid', bg: 'bg-status-passing/15 text-status-passing' },
  pending_review: { style: 'text-status-in-progress', icon: Clock, label: 'Pending Review', bg: 'bg-status-in-progress/15 text-status-in-progress' },
  expired: { style: 'text-severity-critical', icon: XCircle, label: 'Expired', bg: 'bg-status-failing/15 text-status-failing' },
  rejected: { style: 'text-muted-foreground', icon: AlertTriangle, label: 'Rejected', bg: 'bg-muted text-muted-foreground' },
};

const controlStatusStyle: Record<string, string> = {
  implemented: 'text-status-passing',
  partially_implemented: 'text-status-in-progress',
  failing: 'text-severity-critical',
  not_implemented: 'text-muted-foreground',
  not_started: 'text-muted-foreground',
  not_applicable: 'text-muted-foreground',
};

function getControlPct(status: string): number {
  const map: Record<string, number> = {
    implemented: 100, partially_implemented: 50, not_started: 0,
    failing: 25, not_applicable: 100, not_implemented: 0,
  };
  return map[status] ?? 0;
}

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getValidityDays(collected: string | null, expires: string | null) {
  if (!collected || !expires) return { total: null, elapsed: null, pct: null };
  const start = new Date(collected).getTime();
  const end = new Date(expires).getTime();
  const now = Date.now();
  const total = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const elapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
  return { total, elapsed, pct: Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) };
}

interface EvidenceRow {
  id: string; title: string; type: string; status: string;
  source: string | null; collected_at: string | null; expires_at: string | null;
  file_url: string | null; control_id: string | null; created_at: string;
  control: { code: string; title: string; status: string; category: string | null; framework_id: string | null } | null;
}

interface EvidenceDetailViewProps {
  evidenceId: string;
}

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function EvidenceDetailView({ evidenceId }: EvidenceDetailViewProps) {
  const [evidence, setEvidence] = useState<EvidenceRow | null>(null);
  const [related, setRelated] = useState<EvidenceRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'controls' | 'expiration' | 'automation'>('history');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase.from('evidence').select(`*, control:control_id (code, title, status, category, framework_id)`).eq('id', evidenceId).maybeSingle().then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) { setError(err.message); setLoading(false); return; }
      if (!data) { setError('Evidence not found'); setLoading(false); return; }
      const ev = data as unknown as EvidenceRow;
      setEvidence(ev);

      supabase.from('audit_logs').select('id, action, entity_type, entity_id, user_id, details, created_at').eq('entity_type', 'evidence').eq('entity_id', evidenceId).order('created_at', { ascending: false }).then(({ data: auditData }: any) => {
        if (!cancelled) setAuditLogs((auditData ?? []) as unknown as AuditEntry[]);
      });

      if (ev.control_id) {
        supabase.from('evidence').select(`*, control:control_id (code, title, status, category, framework_id)`).eq('control_id', ev.control_id).neq('id', evidenceId).then(({ data: rel }) => {
          if (!cancelled) { setRelated((rel ?? []) as unknown as EvidenceRow[]); setLoading(false); }
        });
      } else {
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [evidenceId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading…</div>;
  }

  if (error || !evidence) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Evidence not found</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link to="/evidence" className="text-primary hover:underline text-sm">{'← Back to Evidence'}</Link>
      </div>
    );
  }

  const sc = statusConfig[evidence.status] ?? statusConfig.valid;
  const StatusIcon = sc.icon;
  const TypeIcon = typeIcons[evidence.type] ?? FileText;
  const isAutoCollected = evidence.source === 'auto';

  const actionLabels: Record<string, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    view: 'Viewed',
    export: 'Exported',
    revert: 'Reverted',
  };

  const auditEvents = auditLogs.map(log => ({
    date: log.created_at,
    action: actionLabels[log.action] ?? log.action,
    actor: log.user_id ?? 'System',
    method: 'manual' as const,
    notes: log.details ? JSON.stringify(log.details).slice(0, 120) : `${log.action} evidence`,
    id: log.id,
  }));

  const history = [
    { date: evidence.collected_at ?? evidence.created_at, action: 'Collected' as const, actor: isAutoCollected ? 'System' : 'Manual Upload', method: (isAutoCollected ? 'auto' as const : 'manual' as const), notes: `Evidence collected from ${evidence.source ?? 'unknown source'}`, id: 'collection' },
    ...auditEvents,
  ];

  const linkedControl = evidence.control;
  const daysUntilExpiry = getDaysUntil(evidence.expires_at);
  const validity = getValidityDays(evidence.collected_at, evidence.expires_at);

  const tabs = [
    { key: 'history' as const, label: 'Collection History', count: history.length },
    { key: 'controls' as const, label: 'Linked Control', count: (linkedControl ? 1 : 0) + related.length },
    { key: 'expiration' as const, label: 'Expiration', count: null },
    { key: 'automation' as const, label: 'Auto-Collection', count: null },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/evidence">
          <button className="mt-1 p-1 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{evidence.id.slice(0, 8).toUpperCase()}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.bg}`}>
              <StatusIcon className="h-3 w-3" />
              {sc.label}
            </span>
            {isAutoCollected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-chart-1/15 text-chart-1">
                <Zap className="h-3 w-3" /> Auto
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-foreground">{evidence.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><TypeIcon className="h-3.5 w-3.5" /> {typeLabels[evidence.type] ?? evidence.type}</span>
            {linkedControl && (
              <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {linkedControl.code} — {linkedControl.title}</span>
            )}
            <span className="flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" /> {evidence.source ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</div>
          <div className={`text-lg font-bold flex items-center gap-1.5 ${sc.style}`}>
            <StatusIcon className="h-5 w-5" /> {sc.label}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Collected</div>
          <div className="text-lg font-bold text-foreground">{evidence.collected_at ? new Date(evidence.collected_at).toLocaleDateString() : '—'}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Expires</div>
          <div className={`text-lg font-bold ${!evidence.expires_at ? 'text-muted-foreground' : daysUntilExpiry !== null && daysUntilExpiry <= 0 ? 'text-severity-critical' : daysUntilExpiry !== null && daysUntilExpiry <= 14 ? 'text-status-warning' : 'text-foreground'}`}>
            {evidence.expires_at ? new Date(evidence.expires_at).toLocaleDateString() : 'Never'}
          </div>
          {evidence.expires_at && daysUntilExpiry !== null && (
            <div className={`text-xs mt-0.5 ${daysUntilExpiry <= 0 ? 'text-severity-critical' : daysUntilExpiry <= 14 ? 'text-status-warning' : 'text-muted-foreground'}`}>
              {daysUntilExpiry <= 0 ? `Expired ${Math.abs(daysUntilExpiry)}d ago` : `${daysUntilExpiry}d remaining`}
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Collections</div>
          <div className="text-lg font-bold text-foreground">{history.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">historical record{history.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Expiration bar */}
      {evidence.expires_at && validity.total !== null && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Validity Window</span>
            <span className="text-xs text-muted-foreground">{validity.elapsed}d of {validity.total}d elapsed ({validity.pct}%)</span>
          </div>
          <div className="relative">
            <Progress
              value={validity.pct ?? 0}
              className={`h-2 ${(validity.pct ?? 0) >= 90 ? '[&>div]:bg-severity-critical' : (validity.pct ?? 0) >= 75 ? '[&>div]:bg-status-warning' : ''}`}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>{new Date(evidence.collected_at!).toLocaleDateString()}</span>
            <span>{new Date(evidence.expires_at).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary rounded-md p-0.5 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}{t.count !== null ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* Collection History */}
      {activeTab === 'history' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" /> Collection History
          </h3>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-0">
              {history.map((h) => (
                <div key={h.id} className="relative pl-8 pb-5 last:pb-0">
                  <div className={`absolute left-1.5 top-1 h-3 w-3 rounded-full border-2 ${h.id === 'collection' ? 'bg-primary border-primary' : 'bg-card border-border'}`} />
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground">{new Date(h.date).toLocaleDateString()}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${h.action === 'Collected' ? 'bg-status-passing/15 text-status-passing' : 'bg-muted text-muted-foreground'}`}>
                      {h.action}
                    </span>
                    {h.method === 'auto' && <Zap className="h-3 w-3 text-chart-1" />}
                  </div>
                  <p className="text-sm text-foreground">{h.notes}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <User className="h-3 w-3" /> {h.actor}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {auditLogs.length === 0 && (
            <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
              No additional audit log entries found for this evidence item.
            </p>
          )}
        </div>
      )}

      {/* Linked Controls */}
      {activeTab === 'controls' && (
        <div className="space-y-4">
          {linkedControl && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" /> Primary Control
              </h3>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{linkedControl.code}</span>
                    <span className="font-medium text-sm text-foreground">{linkedControl.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {linkedControl.category && <span>{linkedControl.category}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Progress value={getControlPct(linkedControl.status)} className="h-1.5 w-20" />
                    <span className="text-xs text-muted-foreground">{getControlPct(linkedControl.status)}%</span>
                  </div>
                  <span className={`text-xs font-medium capitalize ${controlStatusStyle[linkedControl.status]}`}>
                    {linkedControl.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!linkedControl && evidence.control_id && (
            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-sm text-muted-foreground">Control details not available. The linked control may have been deleted.</p>
            </div>
          )}

          {!linkedControl && !evidence.control_id && (
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="text-center py-8">
                <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No Control Linked</p>
                <p className="text-xs text-muted-foreground">This evidence is not associated with any control.</p>
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Related Evidence for {linkedControl?.code ?? evidence.control_id?.slice(0, 8)} ({related.length})
              </h3>
              <div className="space-y-2">
                {related.map(re => {
                  const rsc = statusConfig[re.status] ?? statusConfig.valid;
                  const RStatusIcon = rsc.icon;
                  return (
                    <Link key={re.id} to="/evidence/$evidenceId" params={{ evidenceId: re.id }}>
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-surface transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          {re.source === 'auto' && <Zap className="h-3 w-3 text-chart-1" />}
                          <span className="text-sm text-foreground">{re.title}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${rsc.bg}`}>
                          <RStatusIcon className="h-3 w-3" /> {rsc.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expiration Tracking */}
      {activeTab === 'expiration' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" /> Expiration Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Collection Date</div>
                <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> {evidence.collected_at ? new Date(evidence.collected_at).toLocaleDateString() : '—'}
                </div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Expiration Date</div>
                <div className={`text-sm font-bold flex items-center gap-1.5 ${!evidence.expires_at ? 'text-muted-foreground' : daysUntilExpiry !== null && daysUntilExpiry <= 0 ? 'text-severity-critical' : daysUntilExpiry !== null && daysUntilExpiry <= 14 ? 'text-status-warning' : 'text-foreground'}`}>
                  <Calendar className="h-4 w-4" /> {evidence.expires_at ? new Date(evidence.expires_at).toLocaleDateString() : 'Never'}
                </div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Validity Period</div>
                <div className="text-sm font-bold text-foreground">{validity.total !== null ? `${validity.total} days` : '—'}</div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Days Remaining</div>
                <div className={`text-sm font-bold ${!evidence.expires_at ? 'text-muted-foreground' : daysUntilExpiry !== null && daysUntilExpiry <= 0 ? 'text-severity-critical' : daysUntilExpiry !== null && daysUntilExpiry <= 14 ? 'text-status-warning' : 'text-status-passing'}`}>
                  {!evidence.expires_at ? 'No expiry' : daysUntilExpiry !== null && daysUntilExpiry <= 0 ? 'EXPIRED' : `${daysUntilExpiry} days`}
                </div>
              </div>
            </div>

            {evidence.expires_at && daysUntilExpiry !== null && (
              <div className={`p-4 rounded-lg border ${daysUntilExpiry <= 0 ? 'border-severity-critical/30 bg-severity-critical/5' : daysUntilExpiry <= 14 ? 'border-status-warning/30 bg-status-warning/5' : 'border-status-passing/30 bg-status-passing/5'}`}>
                <div className="flex items-start gap-2">
                  {daysUntilExpiry <= 0 ? (
                    <XCircle className="h-5 w-5 text-severity-critical mt-0.5 shrink-0" />
                  ) : daysUntilExpiry <= 14 ? (
                    <AlertTriangle className="h-5 w-5 text-status-warning mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-status-passing mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {daysUntilExpiry <= 0
                        ? 'This evidence has expired and needs immediate renewal.'
                        : daysUntilExpiry <= 14
                        ? 'This evidence is expiring soon. Plan renewal before the deadline.'
                        : 'This evidence is within its validity window. No action needed.'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAutoCollected
                        ? 'Auto-collection is configured and will renew this evidence automatically.'
                        : 'This evidence requires manual upload for renewal.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!evidence.expires_at && (
              <div className="p-4 rounded-lg border border-border bg-muted/20">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">No Expiration Set</p>
                    <p className="text-xs text-muted-foreground mt-1">This evidence does not have an expiration date. Set an expiration date to enable expiration tracking.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-Collection */}
      {activeTab === 'automation' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" /> Auto-Collection Configuration
          </h3>
          {!isAutoCollected ? (
            <div className="text-center py-8">
              <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Manual Collection Only</p>
              <p className="text-xs text-muted-foreground">This evidence is collected manually. Configure an integration to enable automatic collection.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Collection Method</div>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-chart-1" /> Auto-Collected
                </div>
              </div>
              <div className="p-3 rounded-lg border border-border bg-secondary/30">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Source</div>
                <code className="text-xs font-mono text-foreground">{evidence.source ?? 'auto'}</code>
              </div>
              <div className="text-xs text-muted-foreground border-t border-border pt-3 mt-4">
                Auto-collection schedule and endpoint configuration are managed through Integrations. Configure collection rules in the Integrations settings.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
