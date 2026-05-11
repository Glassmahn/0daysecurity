import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { evidenceItems } from '@/lib/mock-data-extended';
import { supabase } from '@/integrations/supabase/client';
import { controls } from '@/lib/mock-data';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, FileText, Image, Settings, PenTool, ScrollText, CloudDownload,
  Zap, Clock, CheckCircle2, XCircle, AlertTriangle, Shield, Calendar,
  RefreshCw, ExternalLink, User, Timer, History
} from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  screenshot: Image,
  document: FileText,
  api_pull: CloudDownload,
  config_export: Settings,
  attestation: PenTool,
  log: ScrollText,
};

const typeLabels: Record<string, string> = {
  screenshot: 'Screenshot',
  document: 'Document',
  api_pull: 'API Pull',
  config_export: 'Config Export',
  attestation: 'Attestation',
  log: 'Log',
};

const statusConfig: Record<string, { style: string; icon: React.ElementType; label: string; bg: string }> = {
  valid: { style: 'text-status-passing', icon: CheckCircle2, label: 'Valid', bg: 'bg-status-passing/15 text-status-passing' },
  expiring: { style: 'text-status-in-progress', icon: Clock, label: 'Expiring Soon', bg: 'bg-status-in-progress/15 text-status-in-progress' },
  expired: { style: 'text-severity-critical', icon: XCircle, label: 'Expired', bg: 'bg-status-failing/15 text-status-failing' },
  rejected: { style: 'text-muted-foreground', icon: AlertTriangle, label: 'Rejected', bg: 'bg-muted text-muted-foreground' },
};

const controlStatusStyle: Record<string, string> = {
  implemented: 'text-status-passing',
  in_progress: 'text-status-in-progress',
  failing: 'text-severity-critical',
  not_implemented: 'text-muted-foreground',
  not_applicable: 'text-muted-foreground',
};

// Mock collection history per evidence item
const collectionHistory: Record<string, Array<{
  date: string;
  action: string;
  actor: string;
  method: 'auto' | 'manual';
  notes: string;
}>> = {
  'ev-1': [
    { date: '2026-04-10', action: 'Collected', actor: 'System', method: 'auto', notes: 'Automated pull from AWS CloudTrail API' },
    { date: '2026-03-10', action: 'Collected', actor: 'System', method: 'auto', notes: 'Automated pull from AWS CloudTrail API' },
    { date: '2026-02-10', action: 'Collected', actor: 'System', method: 'auto', notes: 'Automated pull from AWS CloudTrail API' },
    { date: '2026-01-10', action: 'Collected', actor: 'System', method: 'auto', notes: 'Initial automated collection configured' },
  ],
  'ev-2': [
    { date: '2026-04-09', action: 'Collected', actor: 'System', method: 'auto', notes: 'Pulled MFA enrollment data from Okta API' },
    { date: '2026-03-09', action: 'Collected', actor: 'System', method: 'auto', notes: 'Monthly enrollment snapshot' },
    { date: '2026-02-09', action: 'Reviewed', actor: 'James Wilson', method: 'manual', notes: 'Verified enrollment numbers match HR records' },
    { date: '2026-02-09', action: 'Collected', actor: 'System', method: 'auto', notes: 'Monthly enrollment snapshot' },
  ],
  'ev-3': [
    { date: '2026-01-15', action: 'Uploaded', actor: 'Sarah Chen', method: 'manual', notes: 'Q1 2026 penetration test report from SecurityCo' },
    { date: '2025-10-20', action: 'Uploaded', actor: 'Sarah Chen', method: 'manual', notes: 'Q4 2025 penetration test report' },
    { date: '2025-07-15', action: 'Uploaded', actor: 'James Wilson', method: 'manual', notes: 'Q3 2025 penetration test report' },
  ],
  'ev-5': [
    { date: '2025-12-01', action: 'Uploaded', actor: 'Alex Kim', method: 'manual', notes: 'Screenshot of S3 encryption settings' },
    { date: '2025-12-01', action: 'Reviewed', actor: 'Sarah Chen', method: 'manual', notes: 'Approved — shows correct encryption configuration' },
    { date: '2025-06-01', action: 'Uploaded', actor: 'David Park', method: 'manual', notes: 'Previous screenshot — outdated settings' },
  ],
  'ev-9': [
    { date: '2026-02-15', action: 'Uploaded', actor: 'Maria Garcia', method: 'manual', notes: 'Incident Response Plan v3.0 — major update' },
    { date: '2026-02-10', action: 'Reviewed', actor: 'Sarah Chen', method: 'manual', notes: 'CISO review passed' },
    { date: '2025-08-20', action: 'Uploaded', actor: 'Maria Garcia', method: 'manual', notes: 'IRP v2.5 update after tabletop exercise' },
    { date: '2025-02-15', action: 'Uploaded', actor: 'James Wilson', method: 'manual', notes: 'IRP v2.0 annual revision' },
  ],
};

// Mock auto-collection config
const autoCollectionConfig: Record<string, {
  schedule: string;
  nextRun: string;
  integration: string;
  endpoint: string;
  lastStatus: 'success' | 'warning' | 'error';
  successRate: number;
  runsLast30Days: number;
}> = {
  'ev-1': { schedule: 'Monthly', nextRun: '2026-05-10', integration: 'AWS CloudTrail', endpoint: '/v1/trails/config', lastStatus: 'success', successRate: 100, runsLast30Days: 1 },
  'ev-2': { schedule: 'Monthly', nextRun: '2026-05-09', integration: 'Okta', endpoint: '/api/v1/users?filter=mfa', lastStatus: 'success', successRate: 100, runsLast30Days: 1 },
  'ev-4': { schedule: 'Quarterly', nextRun: '2026-07-08', integration: 'Internal Scanner', endpoint: '/api/certs/inventory', lastStatus: 'success', successRate: 95, runsLast30Days: 0 },
  'ev-7': { schedule: 'Annually', nextRun: '2027-04-01', integration: 'BambooHR', endpoint: '/api/training/hipaa', lastStatus: 'success', successRate: 100, runsLast30Days: 0 },
  'ev-8': { schedule: 'Monthly', nextRun: '2026-04-30', integration: 'Okta', endpoint: '/api/v1/access-reviews', lastStatus: 'success', successRate: 100, runsLast30Days: 1 },
  'ev-10': { schedule: 'Bi-weekly', nextRun: '2026-04-15', integration: 'CrowdStrike', endpoint: '/api/vuln-scan/latest', lastStatus: 'warning', successRate: 85, runsLast30Days: 2 },
  'ev-12': { schedule: 'Monthly', nextRun: '2026-05-07', integration: 'Cloudflare', endpoint: '/api/firewall/rules', lastStatus: 'success', successRate: 100, runsLast30Days: 1 },
  'ev-13': { schedule: 'Monthly', nextRun: '2026-05-05', integration: 'GitHub', endpoint: '/repos/settings/protection', lastStatus: 'success', successRate: 100, runsLast30Days: 1 },
  'ev-15': { schedule: 'Quarterly', nextRun: '2026-04-20', integration: 'Datadog', endpoint: '/api/logs/phi-access', lastStatus: 'success', successRate: 90, runsLast30Days: 0 },
};

function getDaysUntil(dateStr: string): number {
  const now = new Date('2026-04-11');
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getValidityDays(collected: string, expires: string): { total: number; elapsed: number; pct: number } {
  const start = new Date(collected).getTime();
  const end = new Date(expires).getTime();
  const now = new Date('2026-04-11').getTime();
  const total = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const elapsed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
  const pct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  return { total, elapsed, pct };
}

interface EvidenceDetailViewProps {
  evidenceId: string;
}

export function EvidenceDetailView({ evidenceId }: EvidenceDetailViewProps) {
  const [sbEvidence, setSbEvidence] = useState<typeof evidenceItems[0] | null>(null);
  const [sbLoading, setSbLoading] = useState(false);
  const mockEvidence = evidenceItems.find(e => e.id === evidenceId);
  const evidence = mockEvidence ?? sbEvidence;
  const [activeTab, setActiveTab] = useState<'history' | 'controls' | 'expiration' | 'automation'>('history');

  useEffect(() => {
    if (mockEvidence) return;
    setSbLoading(true);
    supabase.from('evidence').select('*').eq('id', evidenceId).maybeSingle().then(({ data }) => {
      if (data) {
        const today = new Date().toISOString().split('T')[0];
        const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
        setSbEvidence({
          id: data.id,
          title: data.title ?? 'Untitled Evidence',
          type: data.type ?? 'document',
          status: (['valid', 'expiring', 'expired', 'rejected'].includes(data.status) ? data.status : 'valid') as 'valid' | 'expiring' | 'expired' | 'rejected',
          source: data.source ?? 'manual',
          collectedAt: data.collected_at ? data.collected_at.split('T')[0] : today,
          expiresAt: data.expires_at ? data.expires_at.split('T')[0] : nextYear,
          autoCollected: data.source === 'auto',
          controlRef: '',
          controlTitle: '',
        } as typeof evidenceItems[0]);
      }
      setSbLoading(false);
    });
  }, [evidenceId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!evidence) {
    if (sbLoading) {
      return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading…</div>;
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Evidence not found</h2>
        <Link to="/evidence" className="text-primary hover:underline text-sm">← Back to Evidence</Link>
      </div>
    );
  }

  const sc = statusConfig[evidence.status];
  const StatusIcon = sc.icon;
  const TypeIcon = typeIcons[evidence.type] || FileText;
  const history = collectionHistory[evidenceId] || [
    { date: evidence.collectedAt, action: 'Collected', actor: evidence.autoCollected ? 'System' : evidence.source, method: evidence.autoCollected ? 'auto' as const : 'manual' as const, notes: `Evidence collected from ${evidence.source}` },
  ];

  const linkedControl = controls.find(c => c.ref === evidence.controlRef);
  const relatedEvidence = evidenceItems.filter(e => e.controlRef === evidence.controlRef && e.id !== evidenceId);
  const daysUntilExpiry = getDaysUntil(evidence.expiresAt);
  const validity = getValidityDays(evidence.collectedAt, evidence.expiresAt);
  const autoConfig = autoCollectionConfig[evidenceId];

  const tabs = [
    { key: 'history' as const, label: 'Collection History', count: history.length },
    { key: 'controls' as const, label: 'Linked Control', count: relatedEvidence.length + 1 },
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
            <span className="font-mono text-xs text-muted-foreground">{evidence.id.toUpperCase()}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.bg}`}>
              <StatusIcon className="h-3 w-3" />
              {sc.label}
            </span>
            {evidence.autoCollected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-chart-1/15 text-chart-1">
                <Zap className="h-3 w-3" /> Auto
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-foreground">{evidence.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><TypeIcon className="h-3.5 w-3.5" /> {typeLabels[evidence.type] || evidence.type}</span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {evidence.controlRef} — {evidence.controlTitle}</span>
            <span className="flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" /> {evidence.source}</span>
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
          <div className="text-lg font-bold text-foreground">{evidence.collectedAt}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Expires</div>
          <div className={`text-lg font-bold ${daysUntilExpiry <= 0 ? 'text-severity-critical' : daysUntilExpiry <= 14 ? 'text-status-warning' : 'text-foreground'}`}>
            {evidence.expiresAt}
          </div>
          <div className={`text-xs mt-0.5 ${daysUntilExpiry <= 0 ? 'text-severity-critical' : daysUntilExpiry <= 14 ? 'text-status-warning' : 'text-muted-foreground'}`}>
            {daysUntilExpiry <= 0 ? `Expired ${Math.abs(daysUntilExpiry)}d ago` : `${daysUntilExpiry}d remaining`}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Collections</div>
          <div className="text-lg font-bold text-foreground">{history.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">historical records</div>
        </div>
      </div>

      {/* Expiration bar */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Validity Window</span>
          <span className="text-xs text-muted-foreground">{validity.elapsed}d of {validity.total}d elapsed ({validity.pct}%)</span>
        </div>
        <div className="relative">
          <Progress
            value={validity.pct}
            className={`h-2 ${validity.pct >= 90 ? '[&>div]:bg-severity-critical' : validity.pct >= 75 ? '[&>div]:bg-status-warning' : ''}`}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>{evidence.collectedAt}</span>
          <span>{evidence.expiresAt}</span>
        </div>
      </div>

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
              {history.map((h, i) => (
                <div key={i} className="relative pl-8 pb-5 last:pb-0">
                  <div className={`absolute left-1.5 top-1 h-3 w-3 rounded-full border-2 ${i === 0 ? 'bg-primary border-primary' : 'bg-card border-border'}`} />
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground">{h.date}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${h.action === 'Collected' ? 'bg-status-passing/15 text-status-passing' : h.action === 'Uploaded' ? 'bg-status-in-progress/15 text-status-in-progress' : 'bg-muted text-muted-foreground'}`}>
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
                    <span className="font-mono text-xs text-muted-foreground">{linkedControl.ref}</span>
                    <span className="font-medium text-sm text-foreground">{linkedControl.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{linkedControl.framework}</span>
                    <span>·</span>
                    <span>{linkedControl.category}</span>
                    <span>·</span>
                    <span>Owner: {linkedControl.owner}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Progress value={linkedControl.implementationPct} className="h-1.5 w-20" />
                    <span className="text-xs text-muted-foreground">{linkedControl.implementationPct}%</span>
                  </div>
                  <span className={`text-xs font-medium capitalize ${controlStatusStyle[linkedControl.status]}`}>
                    {linkedControl.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {relatedEvidence.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Related Evidence for {evidence.controlRef} ({relatedEvidence.length})
              </h3>
              <div className="space-y-2">
                {relatedEvidence.map(re => {
                  const rsc = statusConfig[re.status];
                  const RStatusIcon = rsc.icon;
                  return (
                    <Link key={re.id} to="/evidence/$evidenceId" params={{ evidenceId: re.id }}>
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-surface transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          {re.autoCollected && <Zap className="h-3 w-3 text-chart-1" />}
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
                  <Calendar className="h-4 w-4 text-muted-foreground" /> {evidence.collectedAt}
                </div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Expiration Date</div>
                <div className={`text-sm font-bold flex items-center gap-1.5 ${daysUntilExpiry <= 0 ? 'text-severity-critical' : daysUntilExpiry <= 14 ? 'text-status-warning' : 'text-foreground'}`}>
                  <Calendar className="h-4 w-4" /> {evidence.expiresAt}
                </div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Validity Period</div>
                <div className="text-sm font-bold text-foreground">{validity.total} days</div>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Days Remaining</div>
                <div className={`text-sm font-bold ${daysUntilExpiry <= 0 ? 'text-severity-critical' : daysUntilExpiry <= 14 ? 'text-status-warning' : 'text-status-passing'}`}>
                  {daysUntilExpiry <= 0 ? 'EXPIRED' : `${daysUntilExpiry} days`}
                </div>
              </div>
            </div>

            {/* Renewal recommendation */}
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
                    {evidence.autoCollected
                      ? 'Auto-collection is configured and will renew this evidence automatically.'
                      : 'This evidence requires manual upload for renewal.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Collection */}
      {activeTab === 'automation' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" /> Auto-Collection Configuration
          </h3>
          {!evidence.autoCollected ? (
            <div className="text-center py-8">
              <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Manual Collection Only</p>
              <p className="text-xs text-muted-foreground">This evidence is collected manually. Configure an integration to enable automatic collection.</p>
            </div>
          ) : autoConfig ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Integration</div>
                  <div className="text-sm font-bold text-foreground">{autoConfig.integration}</div>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Schedule</div>
                  <div className="text-sm font-bold text-foreground">{autoConfig.schedule}</div>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Next Run</div>
                  <div className="text-sm font-bold text-foreground">{autoConfig.nextRun}</div>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Success Rate</div>
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-bold ${autoConfig.successRate >= 95 ? 'text-status-passing' : autoConfig.successRate >= 80 ? 'text-status-warning' : 'text-severity-critical'}`}>
                      {autoConfig.successRate}%
                    </div>
                    <Progress value={autoConfig.successRate} className="h-1.5 flex-1" />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-secondary/30">
                <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">API Endpoint</div>
                <code className="text-xs font-mono text-foreground">{autoConfig.endpoint}</code>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                <div className={`h-2.5 w-2.5 rounded-full ${autoConfig.lastStatus === 'success' ? 'bg-status-passing' : autoConfig.lastStatus === 'warning' ? 'bg-status-warning' : 'bg-severity-critical'}`} />
                <span className="text-xs text-muted-foreground">Last run status:</span>
                <span className={`text-xs font-semibold capitalize ${autoConfig.lastStatus === 'success' ? 'text-status-passing' : autoConfig.lastStatus === 'warning' ? 'text-status-warning' : 'text-severity-critical'}`}>
                  {autoConfig.lastStatus}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{autoConfig.runsLast30Days} runs in last 30 days</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Zap className="h-10 w-10 text-chart-1 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Auto-Collection Active</p>
              <p className="text-xs text-muted-foreground">Configuration details are managed by the integration.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
