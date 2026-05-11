import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { enrichedControls, frameworkCatalog, evidenceTypes as evidenceTypeCatalog } from '@/lib/framework-catalog';
import { evidenceItems } from '@/lib/mock-data-extended';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Shield, CheckCircle2, XCircle, Clock, AlertTriangle, Zap,
  FileText, Image, Settings, PenTool, ScrollText, CloudDownload, Scan,
  GraduationCap, UserCheck, ShieldAlert, Building2, GitPullRequest,
  Database, Network as NetworkIcon, Ticket, User, Calendar, Activity,
  History, Layers, Eye
} from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  screenshot: Image, document: FileText, api_pull: CloudDownload,
  config_export: Settings, attestation: PenTool, log: ScrollText,
  scan_result: Scan, training_record: GraduationCap, access_review: UserCheck,
  pen_test: ShieldAlert, risk_assessment: AlertTriangle, vendor_report: Building2,
  code_review: GitPullRequest, backup_verification: Database,
  network_diagram: NetworkIcon, change_ticket: Ticket,
};

const statusStyles: Record<string, { style: string; bg: string; icon: React.ElementType }> = {
  implemented: { style: 'text-status-passing', bg: 'bg-status-passing/15 text-status-passing', icon: CheckCircle2 },
  in_progress: { style: 'text-status-in-progress', bg: 'bg-status-in-progress/15 text-status-in-progress', icon: Clock },
  failing: { style: 'text-severity-critical', bg: 'bg-status-failing/15 text-status-failing', icon: XCircle },
  not_implemented: { style: 'text-muted-foreground', bg: 'bg-muted text-muted-foreground', icon: AlertTriangle },
  not_applicable: { style: 'text-muted-foreground', bg: 'bg-muted text-muted-foreground', icon: Eye },
};

const evidenceStatusConfig: Record<string, { style: string; icon: React.ElementType }> = {
  valid: { style: 'bg-status-passing/15 text-status-passing', icon: CheckCircle2 },
  expiring: { style: 'bg-status-in-progress/15 text-status-in-progress', icon: Clock },
  expired: { style: 'bg-status-failing/15 text-status-failing', icon: XCircle },
  rejected: { style: 'bg-muted text-muted-foreground', icon: AlertTriangle },
};

// Mock test history per control
const testHistory: Record<string, Array<{
  date: string;
  result: 'pass' | 'fail' | 'partial';
  tester: string;
  method: 'automated' | 'manual';
  notes: string;
  duration: string;
}>> = {
  'ec-1': [
    { date: '2026-04-10', result: 'pass', tester: 'System', method: 'automated', notes: 'All access policies validated via Okta API', duration: '0m 45s' },
    { date: '2026-04-03', result: 'pass', tester: 'System', method: 'automated', notes: 'Weekly automated check passed', duration: '0m 42s' },
    { date: '2026-03-27', result: 'pass', tester: 'System', method: 'automated', notes: 'Weekly automated check passed', duration: '0m 48s' },
    { date: '2026-03-20', result: 'partial', tester: 'James Wilson', method: 'manual', notes: 'Found 2 service accounts without proper access scoping — remediated same day', duration: '15m' },
    { date: '2026-03-13', result: 'pass', tester: 'System', method: 'automated', notes: 'Weekly automated check passed', duration: '0m 44s' },
  ],
  'ec-6': [
    { date: '2026-04-11', result: 'fail', tester: 'System', method: 'automated', notes: '3 admin accounts without PAM enrollment; root access detected on 2 servers', duration: '1m 10s' },
    { date: '2026-04-04', result: 'fail', tester: 'System', method: 'automated', notes: '4 admin accounts without PAM enrollment', duration: '1m 05s' },
    { date: '2026-03-28', result: 'fail', tester: 'Sarah Chen', method: 'manual', notes: 'PAM solution deployment only 35% complete', duration: '30m' },
    { date: '2026-03-14', result: 'fail', tester: 'System', method: 'automated', notes: 'No PAM solution in place', duration: '0m 55s' },
  ],
  'ec-8': [
    { date: '2026-04-11', result: 'fail', tester: 'System', method: 'automated', notes: 'S3 PHI bucket and 2 EBS volumes missing encryption', duration: '0m 30s' },
    { date: '2026-04-04', result: 'fail', tester: 'System', method: 'automated', notes: 'Same findings — no remediation progress', duration: '0m 28s' },
    { date: '2026-03-21', result: 'fail', tester: 'Alex Kim', method: 'manual', notes: 'Identified all unencrypted resources; created remediation plan', duration: '45m' },
  ],
  'ec-14': [
    { date: '2026-04-04', result: 'pass', tester: 'Maria Garcia', method: 'manual', notes: 'Tabletop exercise completed with full team participation', duration: '2h 30m' },
    { date: '2026-01-10', result: 'pass', tester: 'Maria Garcia', method: 'manual', notes: 'Quarterly IRP review — minor updates to escalation matrix', duration: '1h 15m' },
    { date: '2025-10-05', result: 'partial', tester: 'Sarah Chen', method: 'manual', notes: 'Tabletop revealed gaps in PHI breach notification timeline', duration: '2h' },
  ],
};

// Mock implementation timeline
const implTimeline: Record<string, Array<{
  date: string;
  event: string;
  actor: string;
  pctChange: string;
}>> = {
  'ec-1': [
    { date: '2026-04-10', event: 'Automated test passed — control verified', actor: 'System', pctChange: '100%' },
    { date: '2026-02-20', event: 'SSO integration completed for remaining 3 apps', actor: 'Alex Kim', pctChange: '100%' },
    { date: '2026-01-15', event: 'Okta RBAC policies deployed for production systems', actor: 'James Wilson', pctChange: '85%' },
    { date: '2025-11-01', event: 'Access control policy v2.0 approved', actor: 'Sarah Chen', pctChange: '60%' },
    { date: '2025-08-15', event: 'Initial implementation — centralized identity provider', actor: 'Alex Kim', pctChange: '40%' },
    { date: '2025-06-01', event: 'Control identified and scoped', actor: 'Sarah Chen', pctChange: '0%' },
  ],
  'ec-6': [
    { date: '2026-04-11', event: 'Test failed — 3 accounts still without PAM', actor: 'System', pctChange: '35%' },
    { date: '2026-03-15', event: 'PAM solution procurement approved', actor: 'Sarah Chen', pctChange: '35%' },
    { date: '2026-02-01', event: 'Vendor evaluation completed — selected CyberArk', actor: 'Alex Kim', pctChange: '20%' },
    { date: '2025-12-01', event: 'Control identified as gap during SOC 2 readiness', actor: 'Sandra White', pctChange: '0%' },
  ],
  'ec-8': [
    { date: '2026-04-11', event: 'Test failed — PHI bucket still unencrypted', actor: 'System', pctChange: '40%' },
    { date: '2026-03-21', event: 'Remediation plan created for unencrypted resources', actor: 'Alex Kim', pctChange: '40%' },
    { date: '2026-02-15', event: 'AWS Config rule deployed to detect unencrypted resources', actor: 'David Park', pctChange: '40%' },
    { date: '2025-12-01', event: 'Encryption at rest policy approved', actor: 'Sarah Chen', pctChange: '20%' },
    { date: '2025-09-01', event: 'Control scoped — inventory of data stores completed', actor: 'Alex Kim', pctChange: '10%' },
  ],
};

// Control to evidence ref mapping (using controlRef from evidenceItems)
const controlRefToEnrichedRef: Record<string, string> = {
  'CC-6.1': 'ec-1', 'CC-6.2': 'ec-2', 'CC-6.3': 'ec-3', 'CC-7.1': 'ec-7',
  'CC-7.2': 'ec-8', 'CC-6.6': 'ec-11', 'CC-7.3': 'ec-20', 'CC-6.8': 'ec-18',
  'HP-1.1': 'ec-1', 'HP-1.2': 'ec-8', 'HP-2.1': 'ec-23', 'HP-3.1': 'ec-14',
};

const enrichedRefToControlRef: Record<string, string[]> = {};
Object.entries(controlRefToEnrichedRef).forEach(([cRef, eRef]) => {
  if (!enrichedRefToControlRef[eRef]) enrichedRefToControlRef[eRef] = [];
  enrichedRefToControlRef[eRef].push(cRef);
});

interface ControlDetailViewProps {
  controlId: string;
}

export function ControlDetailView({ controlId }: ControlDetailViewProps) {
  const control = enrichedControls.find(c => c.id === controlId || c.ref === controlId);
  const [activeTab, setActiveTab] = useState<'evidence' | 'tests' | 'timeline' | 'frameworks'>('evidence');

  if (!control) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Control not found</h2>
        <Link to="/controls" className="text-primary hover:underline text-sm">← Back to Controls</Link>
      </div>
    );
  }

  const sc = statusStyles[control.status];
  const StatusIcon = sc.icon;

  // Get linked evidence items
  const controlRefs = enrichedRefToControlRef[controlId] || [];
  const linkedEvidence = evidenceItems.filter(e => controlRefs.includes(e.controlRef));

  const tests = testHistory[controlId] || [
    { date: control.lastTested || '—', result: control.status === 'implemented' ? 'pass' as const : 'fail' as const, tester: control.owner, method: control.automatable ? 'automated' as const : 'manual' as const, notes: 'Latest test result', duration: '—' },
  ];

  const timeline = implTimeline[controlId] || [
    { date: control.lastTested || '—', event: `Current status: ${control.status.replace('_', ' ')}`, actor: control.owner, pctChange: `${control.implementationPct}%` },
  ];

  const linkedFrameworks = control.crossMappings.map(m => {
    const fw = frameworkCatalog.find(f => f.standard === m.framework);
    return { ...m, frameworkName: fw?.name || m.framework, enabled: fw?.enabled || false, compliancePct: fw?.compliancePct || 0 };
  });

  const passRate = tests.length > 0 ? Math.round((tests.filter(t => t.result === 'pass').length / tests.length) * 100) : 0;
  const validEvidence = linkedEvidence.filter(e => e.status === 'valid').length;

  const tabs = [
    { key: 'evidence' as const, label: 'Evidence', count: linkedEvidence.length },
    { key: 'tests' as const, label: 'Test History', count: tests.length },
    { key: 'timeline' as const, label: 'Implementation', count: null },
    { key: 'frameworks' as const, label: 'Frameworks', count: linkedFrameworks.length },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/controls">
          <button className="mt-1 p-1 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-primary font-bold">{control.ref}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${sc.bg}`}>
              <StatusIcon className="h-3 w-3" /> {control.status.replace(/_/g, ' ')}
            </span>
            {control.automatable && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-chart-1/15 text-chart-1">
                <Zap className="h-3 w-3" /> Automatable
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-foreground">{control.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{control.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Owner: <strong className="text-foreground">{control.owner}</strong></span>
            <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {control.category}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Test: <strong className="text-foreground capitalize">{control.testFrequency}</strong></span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Implementation</div>
          <div className="text-2xl font-bold text-foreground">{control.implementationPct}%</div>
          <Progress value={control.implementationPct} className="mt-2 h-1.5" />
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Test Pass Rate</div>
          <div className={`text-2xl font-bold ${passRate >= 80 ? 'text-status-passing' : passRate >= 50 ? 'text-status-warning' : 'text-severity-critical'}`}>{passRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">{tests.filter(t => t.result === 'pass').length}/{tests.length} passed</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Evidence</div>
          <div className="text-2xl font-bold text-foreground">{linkedEvidence.length}</div>
          <div className="text-xs text-muted-foreground mt-1">{validEvidence} valid</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Frameworks</div>
          <div className="text-2xl font-bold text-foreground">{linkedFrameworks.length}</div>
          <div className="text-xs text-muted-foreground mt-1">cross-mapped</div>
        </div>
      </div>

      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 bg-secondary rounded-md p-0.5 overflow-x-auto">
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

      {/* Evidence Mapping */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          {/* Evidence types required */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Required Evidence Types</h3>
            <div className="flex flex-wrap gap-2">
              {control.evidenceTypes.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">No evidence types specified</span>
              ) : (
                control.evidenceTypes.map(et => {
                  const etInfo = evidenceTypeCatalog.find(e => e.id === et);
                  const Icon = typeIcons[et] || FileText;
                  const collected = linkedEvidence.filter(e => e.type === et).length;
                  return (
                    <div key={et} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${collected > 0 ? 'border-status-passing/30 bg-status-passing/5' : 'border-border'}`}>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground capitalize">{etInfo?.label || et.replace(/_/g, ' ')}</span>
                      <span className={`text-[10px] font-bold ${collected > 0 ? 'text-status-passing' : 'text-muted-foreground'}`}>({collected})</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Collected evidence */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Collected Evidence ({linkedEvidence.length})</h3>
            </div>
            {linkedEvidence.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No evidence collected for this control</div>
            ) : (
              <div className="divide-y divide-border">
                {linkedEvidence.map(e => {
                  const esc = evidenceStatusConfig[e.status];
                  const EIcon = esc.icon;
                  const TIcon = typeIcons[e.type] || FileText;
                  return (
                    <Link key={e.id} to="/evidence/$evidenceId" params={{ evidenceId: e.id }}>
                      <div className="px-5 py-3 hover:bg-surface transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <TIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{e.title}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span>{e.source}</span>
                                <span>·</span>
                                <span>{e.collectedAt}</span>
                                {e.autoCollected && <Zap className="h-3 w-3 text-chart-1" />}
                              </div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${esc.style}`}>
                            <EIcon className="h-3 w-3" /> {e.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test History */}
      {activeTab === 'tests' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" /> Test History ({tests.length})
            </h3>
          </div>
          <div className="divide-y divide-border">
            {tests.map((t, i) => {
              const resultStyle = t.result === 'pass' ? 'bg-status-passing/15 text-status-passing' : t.result === 'fail' ? 'bg-status-failing/15 text-status-failing' : 'bg-status-in-progress/15 text-status-in-progress';
              const ResultIcon = t.result === 'pass' ? CheckCircle2 : t.result === 'fail' ? XCircle : AlertTriangle;
              return (
                <div key={i} className="px-5 py-3 hover:bg-surface transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ResultIcon className={`h-4 w-4 mt-0.5 shrink-0 ${t.result === 'pass' ? 'text-status-passing' : t.result === 'fail' ? 'text-severity-critical' : 'text-status-in-progress'}`} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{t.date}</span>
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${resultStyle}`}>{t.result}</span>
                          {t.method === 'automated' && <Zap className="h-3 w-3 text-chart-1" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t.notes}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>By: {t.tester}</span>
                          <span>·</span>
                          <span>Duration: {t.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Implementation Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" /> Implementation Timeline
          </h3>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-0">
              {timeline.map((t, i) => (
                <div key={i} className="relative pl-8 pb-5 last:pb-0">
                  <div className={`absolute left-1.5 top-1 h-3 w-3 rounded-full border-2 ${i === 0 ? 'bg-primary border-primary' : 'bg-card border-border'}`} />
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground">{t.date}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{t.pctChange}</span>
                  </div>
                  <p className="text-sm text-foreground">{t.event}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <User className="h-3 w-3" /> {t.actor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Frameworks */}
      {activeTab === 'frameworks' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" /> Cross-Framework Mappings ({linkedFrameworks.length})
          </h3>
          <div className="space-y-2">
            {linkedFrameworks.map((fw, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">{fw.ref}</span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{fw.frameworkName}</div>
                    <div className="text-xs text-muted-foreground">{fw.framework}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {fw.enabled ? (
                    <>
                      <Progress value={fw.compliancePct} className="h-1.5 w-20" />
                      <span className="text-xs font-bold text-foreground">{fw.compliancePct}%</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-status-passing/15 text-status-passing">Active</span>
                    </>
                  ) : (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Not Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
