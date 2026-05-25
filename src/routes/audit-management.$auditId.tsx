import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, ArrowLeft, Plus, FileText, AlertTriangle, Calendar, User, Download, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { WriteGuard } from '@/components/guards/RoleGuards';
import { exportToCsv } from '@/lib/export-csv';

export const Route = createFileRoute('/audit-management/$auditId')({
  component: AuditDetailPage,
  head: () => ({ meta: [{ title: 'Audit Detail — ZeroDay Security' }] }),
});

const findingFields: FieldDef[] = [
  { name: 'title', label: 'Finding Title', type: 'text', required: true, placeholder: 'e.g. Missing MFA on production console', max: 255 },
  {
    name: 'severity', label: 'Severity', type: 'select', required: true,
    options: [
      { value: 'critical', label: 'Critical' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' },
    ],
  },
  {
    name: 'status', label: 'Status', type: 'select', required: true,
    options: [
      { value: 'open', label: 'Open' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'resolved', label: 'Resolved' },
      { value: 'accepted', label: 'Accepted' },
      { value: 'disputed', label: 'Disputed' },
    ],
  },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed description of the finding...', max: 5000 },
  { name: 'remediation', label: 'Remediation', type: 'textarea', placeholder: 'Steps to remediate...', max: 5000 },
];

const evidenceRequestFields: FieldDef[] = [
  { name: 'title', label: 'Request Title', type: 'text', required: true, placeholder: 'e.g. MFA configuration screenshots', max: 255 },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe what evidence is needed...', max: 5000 },
  { name: 'due_date', label: 'Due Date', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Internal notes...', max: 5000 },
];

const severityStyles: Record<string, string> = {
  critical: 'bg-severity-critical/12 text-severity-critical',
  high: 'bg-severity-high/12 text-severity-high',
  medium: 'bg-severity-medium/12 text-severity-medium',
  low: 'bg-severity-low/12 text-severity-low',
};

const findingStatusStyles: Record<string, string> = {
  open: 'bg-status-failing/12 text-status-failing',
  in_progress: 'bg-status-in-progress/12 text-status-in-progress',
  resolved: 'bg-status-passing/12 text-status-passing',
  accepted: 'bg-muted text-muted-foreground',
  disputed: 'bg-status-warning/12 text-status-warning',
};

const requestStatusStyles: Record<string, string> = {
  pending: 'bg-status-in-progress/12 text-status-in-progress',
  submitted: 'bg-status-passing/12 text-status-passing',
  approved: 'bg-status-passing/12 text-status-passing',
  rejected: 'bg-status-failing/12 text-status-failing',
};

function AuditDetailPage() {
  const navigate = useNavigate({ from: '/audit-management/$auditId' });
  const { auditId } = Route.useParams();
  const [audit, setAudit] = useState<Record<string, any> | null>(null);
  const [findings, setFindings] = useState<Record<string, any>[]>([]);
  const [requests, setRequests] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'findings' | 'requests'>('findings');
  const [findingFormOpen, setFindingFormOpen] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Record<string, any> | null>(null);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  async function fetchData(cancelRef?: { current: boolean }) {
    setLoading(true);
    const results = await Promise.allSettled([
      supabase.from('audits').select('id, title, status, framework, scope, start_date, end_date, lead_auditor_id, notes').eq('id', auditId).single(),
      supabase.from('audit_findings').select('id, title, description, severity, status, remediation').eq('audit_id', auditId).order('created_at', { ascending: false }),
      supabase.from('audit_evidence_requests').select('id, title, description, status, due_date, assigned_to_id').eq('audit_id', auditId).order('created_at', { ascending: false }),
    ]);
    if (cancelRef?.current) return;

    const errors: string[] = [];
    if (results[0].status === 'fulfilled') {
      if (results[0].value.error) { errors.push('Failed to load audit'); }
      else setAudit(results[0].value.data);
    } else { errors.push('Failed to load audit'); }

    if (results[1].status === 'fulfilled' && !results[1].value.error) {
      setFindings(results[1].value.data ?? []);
    } else { errors.push('Failed to load findings'); }

    if (results[2].status === 'fulfilled' && !results[2].value.error) {
      setRequests(results[2].value.data ?? []);
    } else { errors.push('Failed to load evidence requests'); }

    if (errors.length > 0) {
      toast.error(errors.join('. '));
      if (errors.some(e => e.includes('audit'))) { navigate({ to: '/audit-management' }); return; }
    }
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchData(cancelRef);
    return () => { cancelRef.current = true; };
  }, [auditId]);

  const filteredFindings = useMemo(() => {
    if (statusFilter === 'all') return findings;
    return findings.filter(f => f.status === statusFilter);
  }, [findings, statusFilter]);

  async function handleFindingSubmit(values: Record<string, unknown>) {
    const payload = editingFinding?.id
      ? supabase.from('audit_findings').update(values as TablesUpdate<'audit_findings'>).eq('id', editingFinding.id)
      : supabase.from('audit_findings').insert({ ...values, audit_id: auditId } as TablesInsert<'audit_findings'>);
    const { error } = await payload;
    if (error) { toast.error('Failed to save finding'); return false; }
    toast.success(editingFinding?.id ? 'Finding updated' : 'Finding created');
    await fetchData();
    setEditingFinding(null);
    return true;
  }

  async function handleRequestSubmit(values: Record<string, unknown>) {
    const { error } = await supabase.from('audit_evidence_requests').insert({ ...values, audit_id: auditId } as TablesInsert<'audit_evidence_requests'>);
    if (error) { toast.error('Failed to create request'); return false; }
    toast.success('Evidence request created');
    await fetchData();
    return true;
  }

  function handleGenerateReport() {
    const rows = findings.map(f => ({
      Finding: f.title,
      Severity: f.severity,
      Status: f.status,
      Description: f.description ?? '',
      Remediation: f.remediation ?? '',
    }));
    exportToCsv(`audit-report-${audit?.title?.replace(/\s+/g, '-') ?? 'audit'}`, rows);
    toast.success('Report exported');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading audit...</p>
      </div>
    );
  }

  if (!audit) return null;

  const statusStyles: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    in_progress: 'bg-status-in-progress/12 text-status-in-progress',
    completed: 'bg-status-passing/12 text-status-passing',
    cancelled: 'bg-status-failing/12 text-status-failing',
  };

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <button
        onClick={() => navigate({ to: '/audit-management' })}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Audits
      </button>

      <div className="bg-card border border-border/60 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{audit.title}</h1>
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${statusStyles[audit.status] || 'bg-muted text-muted-foreground'}`}>
                {audit.status?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
              {audit.framework && <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {audit.framework}</span>}
              {audit.start_date && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {audit.start_date}{audit.end_date ? ` → ${audit.end_date}` : ''}</span>}
              {audit.lead_auditor_id && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Lead assigned</span>}
            </div>
            {audit.scope && <p className="text-sm text-muted-foreground mt-3">{audit.scope}</p>}
            {audit.notes && <p className="text-sm text-muted-foreground mt-2">{audit.notes}</p>}
          </div>
          <WriteGuard>
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border/60 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Generate Report
            </button>
          </WriteGuard>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${activeTab === 'findings' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Findings ({findings.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${activeTab === 'requests' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Evidence Requests ({requests.length})
        </button>
      </div>

      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Findings</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-card border border-border/60 rounded-lg text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="accepted">Accepted</option>
                  <option value="disputed">Disputed</option>
                </select>
              </div>
              <WriteGuard>
                <button
                  onClick={() => { setEditingFinding(null); setFindingFormOpen(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Finding
                </button>
              </WriteGuard>
            </div>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <AlertTriangle className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{findings.length === 0 ? 'No findings recorded' : 'No findings match the filter'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFindings.map(finding => (
                <div key={finding.id} className="bg-card border border-border/60 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="text-sm font-semibold text-foreground">{finding.title}</h3>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityStyles[finding.severity] || ''}`}>{finding.severity}</span>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${findingStatusStyles[finding.status] || ''}`}>{finding.status?.replace('_', ' ')}</span>
                      </div>
                      {finding.description && <p className="text-xs text-muted-foreground mb-2">{finding.description}</p>}
                      {finding.remediation && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70">Remediation:</span> {finding.remediation}
                        </div>
                      )}
                    </div>
                    <WriteGuard>
                      <button
                        onClick={() => { setEditingFinding(finding); setFindingFormOpen(true); }}
                        className="shrink-0 px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                      >
                        Edit
                      </button>
                    </WriteGuard>
                  </div>
                </div>
              ))}
            </div>
          )}

          <EntityFormDialog
            open={findingFormOpen}
            onOpenChange={v => { setFindingFormOpen(v); if (!v) setEditingFinding(null); }}
            title={editingFinding ? 'Edit Finding' : 'Add Finding'}
            fields={findingFields}
            initialValues={editingFinding ?? undefined}
            onSubmit={handleFindingSubmit}
            entityType="audit_findings"
          />
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Evidence Requests</h2>
            <WriteGuard>
              <button
                onClick={() => setRequestFormOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> New Request
              </button>
            </WriteGuard>
          </div>

          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No evidence requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} className="bg-card border border-border/60 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="text-sm font-semibold text-foreground">{req.title}</h3>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${requestStatusStyles[req.status] || ''}`}>{req.status}</span>
                      </div>
                      {req.description && <p className="text-xs text-muted-foreground mb-1">{req.description}</p>}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {req.due_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Due {req.due_date}</span>}
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {req.assigned_to_id ? 'Assigned' : 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <EntityFormDialog
            open={requestFormOpen}
            onOpenChange={setRequestFormOpen}
            title="New Evidence Request"
            fields={evidenceRequestFields}
            initialValues={{ status: 'pending', audit_id: auditId }}
            onSubmit={handleRequestSubmit}
            entityType="audit_evidence_requests"
          />
        </div>
      )}
    </div>
  );
}
