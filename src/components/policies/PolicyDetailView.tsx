import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, FileText, Clock, User, Shield, CheckCircle2,
  AlertTriangle, GitBranch, CalendarDays, Send, Loader2, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { PolicyAcknowledgmentPanel } from './PolicyAcknowledgmentPanel';

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-status-warning/15 text-status-warning',
  approved: 'bg-status-in-progress/15 text-status-in-progress',
  published: 'bg-status-passing/15 text-status-passing',
  archived: 'bg-muted text-muted-foreground',
};

interface PolicyDetailViewProps {
  policyId: string;
}

export function PolicyDetailView({ policyId }: PolicyDetailViewProps) {
  const [policy, setPolicy] = useState<Tables<'policies'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'versions' | 'approval' | 'controls' | 'frameworks' | 'acknowledgments'>('versions');
  const [ackCount, setAckCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('policies')
          .select('*')
          .eq('id', policyId)
          .maybeSingle();
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setPolicy(data);

        const { count } = await supabase
          .from('policy_acknowledgments')
          .select('*', { count: 'exact', head: true })
          .eq('policy_id', policyId);
        if (!cancelled) setAckCount(count ?? 0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load policy');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [policyId]);

  function exportPdf() {
    if (!policy) return;
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setProperties({ title: policy.title, creator: 'ZeroDay Security' });

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(248, 250, 252);
      doc.text('ZeroDay Security', 14, 11);
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.text('Policy Document', 14, 19);
      doc.setFontSize(8);
      doc.setTextColor(180, 196, 220);
      doc.text(format(new Date(), 'MMMM d, yyyy'), doc.internal.pageSize.getWidth() - 14, 11, { align: 'right' });
      doc.text(`v${policy.version ?? '1.0'}`, doc.internal.pageSize.getWidth() - 14, 19, { align: 'right' });

      let y = 40;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(policy.title, 14, y);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Status: ${policy.status}  |  Version: ${policy.version ?? '1.0'}  |  Review Date: ${policy.review_date ? format(new Date(policy.review_date), 'MMM d, yyyy') : 'Not set'}`, 14, y);
      y += 8;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, y, doc.internal.pageSize.getWidth() - 14, y);
      y += 8;

      if (policy.content) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        const lines = doc.splitTextToSize(policy.content, doc.internal.pageSize.getWidth() - 28);
        for (const line of lines) {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 14, y);
          y += 5;
        }
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('ZeroDay Security — Confidential', 14, doc.internal.pageSize.getHeight() - 6);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(14, doc.internal.pageSize.getHeight() - 10, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 10);
      }

      const filename = `${policy.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_v${policy.version ?? '1.0'}.pdf`;
      doc.save(filename);
      toast.success('Policy exported as PDF');
    } catch {
      toast.error('Failed to generate PDF');
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-severity-critical" />
        <p className="text-sm text-severity-critical">{error}</p>
        <Link to="/policies" className="text-primary hover:underline text-sm">← Back to Policies</Link>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Policy not found</h2>
        <Link to="/policies" className="text-primary hover:underline text-sm">← Back to Policies</Link>
      </div>
    );
  }

  const versions = [
    { version: policy.version ?? '1.0', date: policy.updated_at ? new Date(policy.updated_at).toLocaleDateString('en-CA') : '—', author: policy.approved_by ?? 'Unknown', changes: 'Current version', status: policy.status === 'published' ? 'published' as const : 'approved' as const },
  ];

  interface WorkflowStep { step: string; assignee: string; status: 'completed' | 'pending'; completedAt: string | null; comment: string | null; }
  const workflow: WorkflowStep[] = [
    { step: 'Draft', assignee: policy.owner_id ?? 'Unassigned', status: 'completed', completedAt: policy.created_at, comment: null },
    { step: 'Peer Review', assignee: '—', status: 'pending', completedAt: null, comment: null },
    { step: 'Legal Review', assignee: '—', status: 'pending', completedAt: null, comment: null },
    { step: 'CISO Approval', assignee: '—', status: 'pending', completedAt: null, comment: null },
    { step: 'Board Sign-off', assignee: '—', status: 'pending', completedAt: null, comment: null },
  ];

  const completedSteps = workflow.filter(s => s.status === 'completed').length;
  const totalSteps = workflow.length;
  const approvalProgress = Math.round((completedSteps / totalSteps) * 100);

  const tabs = [
    { key: 'versions' as const, label: 'Version History', count: versions.length },
    { key: 'approval' as const, label: 'Approval Workflow', count: null },
    { key: 'controls' as const, label: 'Linked Controls', count: 0 },
    { key: 'frameworks' as const, label: 'Frameworks', count: policy.framework_id ? 1 : 0 },
    { key: 'acknowledgments' as const, label: 'Acknowledgments', count: ackCount },
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
            <span className="font-mono text-xs text-muted-foreground">{policy.id.slice(0, 8)}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[policy.status]}`}>
              {policy.status}
            </span>
            <span className="font-mono text-xs bg-secondary text-foreground px-2 py-0.5 rounded">v{policy.version ?? '1.0'}</span>
            <button
              onClick={exportPdf}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-auto"
            >
              <Download className="h-3 w-3" /> Export PDF
            </button>
          </div>
          <h1 className="text-lg font-bold text-foreground">{policy.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> Owner: <strong className="text-foreground">{policy.owner_id ?? 'Unassigned'}</strong></span>
            <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Next Review: <strong className="text-foreground">{policy.review_date ? new Date(policy.review_date).toLocaleDateString('en-CA') : 'Not set'}</strong></span>
          </div>
          {policy.content && (
            <div className="mt-3 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">{policy.content}</p>
            </div>
          )}
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
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</div>
          <div className="text-2xl font-bold text-foreground capitalize">{policy.status}</div>
          <div className="text-xs text-muted-foreground mt-3">Updated {new Date(policy.updated_at).toLocaleDateString('en-CA')}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Version</div>
          <div className="text-2xl font-bold text-foreground">v{policy.version ?? '1.0'}</div>
          <div className="text-xs text-muted-foreground mt-3">Created {new Date(policy.created_at).toLocaleDateString('en-CA')}</div>
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
            {workflow.map((step) => {
              const StepIcon = step.status === 'completed' ? CheckCircle2 : Clock;
              const iconColor = step.status === 'completed' ? 'text-status-passing' : 'text-muted-foreground';
              return (
                <div key={step.step} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <StepIcon className={`h-5 w-5 mt-0.5 shrink-0 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{step.step}</span>
                      {step.completedAt && <span className="text-xs text-muted-foreground">{new Date(step.completedAt).toLocaleDateString('en-CA')}</span>}
              {step.status === 'completed' ? <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-status-passing/15 text-status-passing">Complete</span> : <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Pending</span>}
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
          <ControlsTab frameworkId={policy.framework_id} policyId={policyId} />
        </div>
      )}

      {/* Frameworks */}
      {activeTab === 'frameworks' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" /> Applicable Frameworks
          </h3>
          {policy.framework_id ? (
            <FrameworkBadge frameworkId={policy.framework_id} />
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">No frameworks linked</div>
          )}
        </div>
      )}

      {/* Acknowledgments */}
      {activeTab === 'acknowledgments' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Acknowledgments
          </h3>
          <PolicyAcknowledgmentPanel policyId={policyId} />
        </div>
      )}
    </div>
  );
}

function ControlsTab({ frameworkId }: { frameworkId: string | null; policyId: string }) {
  const [controls, setControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!frameworkId) { setLoading(false); return; }
    supabase.from('controls').select('id, code, title, status, category').eq('framework_id', frameworkId).then(({ data }) => {
      setControls(data ?? []);
      setLoading(false);
    });
  }, [frameworkId]);

  if (!frameworkId) return <div className="p-8 text-center text-muted-foreground text-sm">No framework linked — controls appear once a framework is assigned.</div>;
  if (loading) return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>;

  if (controls.length === 0) return <div className="p-8 text-center text-muted-foreground text-sm">No controls found for the linked framework.</div>;

  const ctrlStatusStyles: Record<string, string> = {
    implemented: 'bg-status-passing/15 text-status-passing',
    in_progress: 'bg-status-warning/15 text-status-warning',
    failing: 'bg-status-critical/15 text-status-critical',
    not_started: 'bg-muted text-muted-foreground',
  };

  return (
    <div>
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" /> Linked Controls ({controls.length})
        </h3>
      </div>
      <div className="divide-y divide-border">
        {controls.map(c => (
          <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-surface transition-colors">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
              <span className="text-sm text-foreground">{c.title}</span>
            </div>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${ctrlStatusStyles[c.status] ?? ''}`}>{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FrameworkBadge({ frameworkId }: { frameworkId: string }) {
  const [fw, setFw] = useState<any>(null);
  useEffect(() => {
    supabase.from('frameworks').select('name, description').eq('id', frameworkId).maybeSingle().then(({ data }) => setFw(data));
  }, [frameworkId]);
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface transition-colors">
      <div>
        <div className="font-medium text-sm text-foreground">{fw?.name ?? 'Unknown Framework'}</div>
        {fw?.description && <div className="text-xs text-muted-foreground mt-0.5">{fw.description}</div>}
      </div>
    </div>
  );
}
