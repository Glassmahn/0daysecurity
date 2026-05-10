import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { policies } from '@/lib/mock-data-extended';
import { controls, frameworks } from '@/lib/mock-data';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, FileText, Clock, User, Shield, CheckCircle2,
  XCircle, AlertTriangle, GitBranch, CalendarDays, Send, Eye, PenLine
} from 'lucide-react';

// Enriched mock data for policy details
const policyVersionHistory: Record<string, Array<{
  version: string;
  date: string;
  author: string;
  changes: string;
  status: 'published' | 'approved' | 'archived';
}>> = {
  'pol-1': [
    { version: '3.1', date: '2026-02-15', author: 'Sarah Chen', changes: 'Updated cloud security controls section; added AI/ML data handling', status: 'published' },
    { version: '3.0', date: '2025-08-20', author: 'Sarah Chen', changes: 'Major revision — aligned with SOC 2 Type II requirements', status: 'archived' },
    { version: '2.4', date: '2025-02-10', author: 'James Wilson', changes: 'Added remote work security addendum', status: 'archived' },
    { version: '2.3', date: '2024-08-01', author: 'Sarah Chen', changes: 'Annual review — minor updates to incident reporting procedures', status: 'archived' },
    { version: '2.0', date: '2024-01-15', author: 'Sarah Chen', changes: 'Restructured policy for HIPAA alignment', status: 'archived' },
  ],
  'pol-4': [
    { version: '3.0', date: '2026-02-15', author: 'Maria Garcia', changes: 'Added AI-assisted triage procedures; updated SLA targets', status: 'published' },
    { version: '2.2', date: '2025-09-10', author: 'Maria Garcia', changes: 'Updated escalation matrix for PHI-related incidents', status: 'archived' },
    { version: '2.0', date: '2025-03-01', author: 'Sarah Chen', changes: 'Major overhaul after tabletop exercise findings', status: 'archived' },
  ],
};

const policyApprovalWorkflow: Record<string, Array<{
  step: string;
  assignee: string;
  status: 'completed' | 'current' | 'pending';
  completedAt: string | null;
  comment: string | null;
}>> = {
  'pol-1': [
    { step: 'Draft', assignee: 'Sarah Chen', status: 'completed', completedAt: '2026-01-20', comment: 'Initial draft ready for review' },
    { step: 'Peer Review', assignee: 'James Wilson', status: 'completed', completedAt: '2026-01-28', comment: 'Minor edits to Section 4.2 — cloud encryption requirements' },
    { step: 'Legal Review', assignee: 'Amanda Martinez', status: 'completed', completedAt: '2026-02-05', comment: 'Approved — compliant with current regulations' },
    { step: 'CISO Approval', assignee: 'Sarah Chen', status: 'completed', completedAt: '2026-02-12', comment: 'Approved for publication' },
    { step: 'Board Sign-off', assignee: 'Carlos Ruiz', status: 'completed', completedAt: '2026-02-15', comment: 'Ratified' },
  ],
  'pol-6': [
    { step: 'Draft', assignee: 'David Park', status: 'completed', completedAt: '2026-03-15', comment: 'Initial draft' },
    { step: 'Peer Review', assignee: 'Alex Kim', status: 'completed', completedAt: '2026-03-25', comment: 'Needs more detail on rollback procedures' },
    { step: 'Legal Review', assignee: 'Amanda Martinez', status: 'current', completedAt: null, comment: null },
    { step: 'CISO Approval', assignee: 'Sarah Chen', status: 'pending', completedAt: null, comment: null },
    { step: 'Board Sign-off', assignee: 'Carlos Ruiz', status: 'pending', completedAt: null, comment: null },
  ],
  'pol-7': [
    { step: 'Draft', assignee: 'Alex Kim', status: 'completed', completedAt: '2026-03-01', comment: 'Initial draft' },
    { step: 'Peer Review', assignee: 'David Park', status: 'completed', completedAt: '2026-03-12', comment: 'LGTM' },
    { step: 'Legal Review', assignee: 'Amanda Martinez', status: 'completed', completedAt: '2026-03-22', comment: 'Approved' },
    { step: 'CISO Approval', assignee: 'Sarah Chen', status: 'completed', completedAt: '2026-04-05', comment: 'Approved' },
    { step: 'Board Sign-off', assignee: 'Carlos Ruiz', status: 'pending', completedAt: null, comment: null },
  ],
  'pol-8': [
    { step: 'Draft', assignee: 'Sandra White', status: 'current', completedAt: null, comment: null },
    { step: 'Peer Review', assignee: 'Sarah Chen', status: 'pending', completedAt: null, comment: null },
    { step: 'Legal Review', assignee: 'Amanda Martinez', status: 'pending', completedAt: null, comment: null },
    { step: 'CISO Approval', assignee: 'Sarah Chen', status: 'pending', completedAt: null, comment: null },
    { step: 'Board Sign-off', assignee: 'Carlos Ruiz', status: 'pending', completedAt: null, comment: null },
  ],
};

const policyControlMap: Record<string, string[]> = {
  'pol-1': ['CC-6.1', 'CC-6.2', 'CC-6.3', 'CC-7.1', 'CC-7.2', 'CC-7.3', 'CC-6.6', 'CC-6.8'],
  'pol-2': ['HP-1.1', 'HP-1.2', 'CC-6.8', 'CC-7.3'],
  'pol-3': ['CC-6.1', 'CC-6.2', 'HP-2.1'],
  'pol-4': ['HP-3.1', 'CC-7.3', 'CC-6.1', 'CC-6.6', 'CC-6.8', 'HP-1.1'],
  'pol-5': ['CC-6.1', 'CC-6.2', 'CC-6.3', 'HP-1.1', 'CC-6.8'],
  'pol-6': ['CC-6.3', 'CC-7.3', 'CC-6.6'],
  'pol-7': ['CC-7.1', 'CC-7.2', 'HP-1.2', 'CC-6.8'],
  'pol-8': ['CC-6.8', 'CC-6.6'],
  'pol-9': ['HP-3.1', 'CC-7.3', 'CC-6.6', 'CC-6.8'],
  'pol-10': ['HP-1.1', 'HP-1.2', 'CC-6.1', 'CC-6.3', 'CC-6.8', 'CC-7.2'],
  'pol-11': ['CC-6.6'],
  'pol-12': ['CC-6.1', 'CC-7.1'],
};

const policyFrameworkMap: Record<string, string[]> = {
  'pol-1': ['SOC 2 Type II', 'HIPAA Security Rule'],
  'pol-2': ['HIPAA Security Rule'],
  'pol-3': ['SOC 2 Type II'],
  'pol-4': ['SOC 2 Type II', 'HIPAA Security Rule'],
  'pol-5': ['SOC 2 Type II', 'HIPAA Security Rule'],
  'pol-6': ['SOC 2 Type II'],
  'pol-7': ['SOC 2 Type II', 'HIPAA Security Rule'],
  'pol-8': ['SOC 2 Type II'],
  'pol-9': ['SOC 2 Type II'],
  'pol-10': ['HIPAA Security Rule'],
  'pol-11': ['SOC 2 Type II'],
  'pol-12': ['SOC 2 Type II'],
};

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-status-warning/15 text-status-warning',
  approved: 'bg-status-in-progress/15 text-status-in-progress',
  published: 'bg-status-passing/15 text-status-passing',
  archived: 'bg-muted text-muted-foreground',
};

const controlStatusIcon: Record<string, typeof CheckCircle2> = {
  implemented: CheckCircle2,
  in_progress: Clock,
  failing: XCircle,
  not_implemented: AlertTriangle,
  not_applicable: Eye,
};

const controlStatusStyle: Record<string, string> = {
  implemented: 'text-status-passing',
  in_progress: 'text-status-in-progress',
  failing: 'text-severity-critical',
  not_implemented: 'text-muted-foreground',
  not_applicable: 'text-muted-foreground',
};

interface PolicyDetailViewProps {
  policyId: string;
}

export function PolicyDetailView({ policyId }: PolicyDetailViewProps) {
  const policy = policies.find(p => p.id === policyId);
  const [activeTab, setActiveTab] = useState<'versions' | 'approval' | 'controls' | 'frameworks'>('versions');

  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Policy not found</h2>
        <Link to="/policies" className="text-primary hover:underline text-sm">← Back to Policies</Link>
      </div>
    );
  }

  const versions = policyVersionHistory[policyId] || [
    { version: policy.version, date: policy.approvedAt || '—', author: policy.owner, changes: 'Current version', status: policy.status === 'published' ? 'published' as const : 'approved' as const },
  ];

  const workflow = policyApprovalWorkflow[policyId] || [
    { step: 'Draft', assignee: policy.owner, status: policy.status === 'draft' ? 'current' as const : 'completed' as const, completedAt: null, comment: null },
    { step: 'Peer Review', assignee: '—', status: 'pending' as const, completedAt: null, comment: null },
    { step: 'Legal Review', assignee: '—', status: 'pending' as const, completedAt: null, comment: null },
    { step: 'CISO Approval', assignee: '—', status: 'pending' as const, completedAt: null, comment: null },
    { step: 'Board Sign-off', assignee: '—', status: 'pending' as const, completedAt: null, comment: null },
  ];

  const linkedControlRefs = policyControlMap[policyId] || [];
  const linkedControls = controls.filter(c => linkedControlRefs.includes(c.ref));
  const linkedFrameworkNames = policyFrameworkMap[policyId] || [];
  const linkedFrameworks = frameworks.filter(f => linkedFrameworkNames.includes(f.name));

  const completedSteps = workflow.filter(s => s.status === 'completed').length;
  const totalSteps = workflow.length;
  const approvalProgress = Math.round((completedSteps / totalSteps) * 100);

  const passingControls = linkedControls.filter(c => c.status === 'implemented').length;
  const controlHealth = linkedControls.length > 0 ? Math.round((passingControls / linkedControls.length) * 100) : 0;

  const tabs = [
    { key: 'versions' as const, label: 'Version History', count: versions.length },
    { key: 'approval' as const, label: 'Approval Workflow', count: null },
    { key: 'controls' as const, label: 'Linked Controls', count: linkedControls.length },
    { key: 'frameworks' as const, label: 'Frameworks', count: linkedFrameworks.length },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/policies">
          <button className="mt-1 p-1 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{policy.id.toUpperCase()}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[policy.status]}`}>
              {policy.status}
            </span>
            <span className="font-mono text-xs bg-secondary text-foreground px-2 py-0.5 rounded">v{policy.version}</span>
          </div>
          <h1 className="text-lg font-bold text-foreground">{policy.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Owner: <strong className="text-foreground">{policy.owner}</strong></span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Category: <strong className="text-foreground">{policy.category}</strong></span>
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Next Review: <strong className="text-foreground">{policy.nextReviewDate}</strong></span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Approval Progress</div>
          <div className="text-2xl font-bold text-foreground">{completedSteps}/{totalSteps}</div>
          <Progress value={approvalProgress} className="mt-2 h-1.5" />
          <div className="text-xs text-muted-foreground mt-1">{approvalProgress}% complete</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Control Health</div>
          <div className="text-2xl font-bold text-foreground">{controlHealth}%</div>
          <Progress value={controlHealth} className="mt-2 h-1.5" />
          <div className="text-xs text-muted-foreground mt-1">{passingControls} of {linkedControls.length} passing</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Versions</div>
          <div className="text-2xl font-bold text-foreground">{versions.length}</div>
          <div className="text-xs text-muted-foreground mt-3">Latest: v{policy.version}</div>
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

      {/* Version History */}
      {activeTab === 'versions' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" /> Version History
          </h3>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-0">
              {versions.map((v, i) => (
                <div key={v.version} className="relative pl-8 pb-6 last:pb-0">
                  <div className={`absolute left-1.5 top-1 h-3 w-3 rounded-full border-2 ${i === 0 ? 'bg-primary border-primary' : 'bg-card border-border'}`} />
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-foreground">v{v.version}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[v.status]}`}>{v.status}</span>
                    <span className="text-xs text-muted-foreground">{v.date}</span>
                  </div>
                  <p className="text-sm text-foreground">{v.changes}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">by {v.author}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approval Workflow */}
      {activeTab === 'approval' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" /> Approval Workflow
          </h3>
          <div className="space-y-3">
            {workflow.map((step, i) => {
              const StepIcon = step.status === 'completed' ? CheckCircle2 : step.status === 'current' ? PenLine : Clock;
              const iconColor = step.status === 'completed' ? 'text-status-passing' : step.status === 'current' ? 'text-status-warning' : 'text-muted-foreground';
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${step.status === 'current' ? 'border-status-warning/30 bg-status-warning/5' : 'border-border'}`}>
                  <StepIcon className={`h-5 w-5 mt-0.5 shrink-0 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{step.step}</span>
                      {step.completedAt && <span className="text-xs text-muted-foreground">{step.completedAt}</span>}
                      {step.status === 'current' && <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-status-warning/15 text-status-warning">In Progress</span>}
                      {step.status === 'pending' && <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Pending</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Assignee: {step.assignee}</p>
                    {step.comment && <p className="text-xs text-foreground/80 mt-1 italic">"{step.comment}"</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Linked Controls */}
      {activeTab === 'controls' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" /> Linked Controls ({linkedControls.length})
            </h3>
          </div>
          {linkedControls.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No controls linked to this policy</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Control</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Framework</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Impl.</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Last Tested</th>
                </tr>
              </thead>
              <tbody>
                {linkedControls.map(c => {
                  const StatusIcon = controlStatusIcon[c.status] || Eye;
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-surface transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{c.ref}</span>
                          <span className="font-medium text-foreground">{c.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.framework}</td>
                      <td className="px-4 py-2.5">
                        <span className={`flex items-center gap-1 text-xs font-medium ${controlStatusStyle[c.status]}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Progress value={c.implementationPct} className="h-1 w-16" />
                          <span className="text-xs text-muted-foreground">{c.implementationPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.lastTested || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Frameworks */}
      {activeTab === 'frameworks' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" /> Applicable Frameworks ({linkedFrameworks.length})
          </h3>
          {linkedFrameworks.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">No frameworks linked</div>
          ) : (
            <div className="space-y-3">
              {linkedFrameworks.map(fw => (
                <div key={fw.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface transition-colors">
                  <div>
                    <div className="font-medium text-sm text-foreground">{fw.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {fw.controlCounts.passing + fw.controlCounts.failing + fw.controlCounts.inProgress} controls · Target: {fw.targetDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={fw.compliancePct} className="h-1.5 w-24" />
                    <span className="text-sm font-bold text-foreground">{fw.compliancePct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
