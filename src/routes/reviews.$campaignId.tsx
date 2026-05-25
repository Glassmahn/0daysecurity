import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, AlertCircle, UserCheck, Plus, Trash2, Download, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { WriteGuard, RouteGuard } from '@/components/guards/RoleGuards';
import { exportToCsv } from '@/lib/export-csv';

export const Route = createFileRoute('/reviews/$campaignId')({
  component: CampaignDetailPage,
  head: () => ({ meta: [{ title: 'Campaign Detail — ZeroDay Security' }] }),
});

const statusStyles: Record<string, string> = {
  pending: 'bg-status-in-progress/12 text-status-in-progress',
  approved: 'bg-status-passing/12 text-status-passing',
  rejected: 'bg-status-failing/12 text-status-failing',
  changes_requested: 'bg-amber-500/12 text-amber-500',
  completed: 'bg-muted text-muted-foreground',
};

const campaignStatusStyles: Record<string, string> = {
  active: 'bg-status-passing/12 text-status-passing',
  pending: 'bg-status-in-progress/12 text-status-in-progress',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-status-failing/12 text-status-failing',
};

function CampaignDetailPage() {
  const { campaignId } = Route.useParams() as { campaignId: string };
  const navigate = useNavigate({ from: '/reviews/$campaignId' });
  const [campaign, setCampaign] = useState<Record<string, any> | null>(null);
  const [assignments, setAssignments] = useState<Record<string, any>[]>([]);
  const [personnel, setPersonnel] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  async function fetchData(cancelRef?: { current: boolean }) {
    setLoading(true);
    const results = await Promise.allSettled([
      supabase.from('access_review_campaigns').select('id, name, status, due_date, notes').eq('id', campaignId).maybeSingle(),
      supabase.from('access_review_assignments').select('id, status, reviewee_id, reviewer_id').eq('campaign_id', campaignId).order('created_at', { ascending: false }),
      supabase.from('personnel').select('id, name, email, role, department').order('name'),
    ]);
    if (cancelRef?.current) return;

    const errors: string[] = [];
    if (results[0].status === 'fulfilled') {
      if (results[0].value.error) { errors.push('Failed to load campaign'); }
      else setCampaign(results[0].value.data);
    } else { errors.push('Failed to load campaign'); }

    if (results[1].status === 'fulfilled' && !results[1].value.error) {
      setAssignments(results[1].value.data ?? []);
    } else if (results[1].status === 'rejected') { errors.push('Failed to load assignments'); }

    if (results[2].status === 'fulfilled' && !results[2].value.error) {
      setPersonnel(results[2].value.data ?? []);
    } else if (results[2].status === 'rejected') { errors.push('Failed to load personnel'); }

    if (errors.length > 0) toast.error(errors[0]);
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchData(cancelRef);
    return () => { cancelRef.current = true; };
  }, [campaignId]);

  async function handleUpdateStatus(assignmentId: string, status: string) {
    const { error } = await supabase.from('access_review_assignments')
      .update({ status, completed_at: status === 'approved' || status === 'rejected' ? new Date().toISOString() : null })
      .eq('id', assignmentId);
    if (error) { toast.error('Failed to update'); return; }
    toast.success(`Assignment marked as ${status}`);
    await fetchData();
  }

  async function handleDeleteAssignment(id: string) {
    const { error } = await supabase.from('access_review_assignments').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Assignment removed');
    await fetchData();
  }

  const reviewerFields: FieldDef[] = [
    {
      name: 'reviewee_id', label: 'Personnel', type: 'select', required: true,
      options: personnel.map(p => ({ value: p.id, label: `${p.name} (${p.role})` })),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading campaign…</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => navigate({ to: '/reviews' })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back to Reviews
        </button>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Campaign not found.</p>
        </div>
      </div>
    );
  }

  const completedCount = assignments.filter(a => a.status === 'approved' || a.status === 'rejected').length;

  return (
    <RouteGuard allowedRoles={['admin']}>
    <div className="space-y-6 animate-fade-up p-6">
      {/* Back */}
      <button onClick={() => navigate({ to: '/reviews' })} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to Reviews
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">{campaign.name}</h1>
              <p className="text-sm text-muted-foreground">
                {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} · {completedCount} completed
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WriteGuard>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-glow transition-all">
              <Plus className="h-4 w-4" /> Add Reviewer
            </button>
          </WriteGuard>
          <button onClick={() => exportToCsv(`access-review-${campaign.name}`, assignments.map(a => {
            const person = personnel.find(p => p.id === a.reviewee_id);
            return { Personnel: person?.name ?? 'Unknown', Email: person?.email ?? '', Department: person?.department ?? '', Status: a.status, Reviewer: a.reviewer_id ?? 'Unassigned' };
          }))}
            className="flex items-center gap-1.5 px-3 py-2 border border-border/60 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <Download className="h-4 w-4" /> Export Results
          </button>
        </div>
      </div>

      {/* Campaign info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-md mt-1 ${campaignStatusStyles[campaign.status] ?? 'bg-muted text-muted-foreground'}`}>
            {campaign.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {campaign.status ?? 'unknown'}
          </span>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Due Date</p>
          <p className="text-sm font-medium mt-1">{campaign.due_date ? new Date(campaign.due_date).toLocaleDateString() : 'No due date'}</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Completion</p>
          <p className="text-sm font-medium mt-1">{assignments.length > 0 ? `${Math.round((completedCount / assignments.length) * 100)}%` : '—'}</p>
        </div>
      </div>

      {campaign.notes && (
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm text-foreground">{campaign.notes}</p>
        </div>
      )}

      {/* Assignments table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left bg-surface/50">
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Personnel</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Reviewer</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr><td colSpan={4}>
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p>No assignments yet.</p>
                  <button onClick={() => setAddOpen(true)} className="text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium text-xs">Add one</button>
                </div>
              </td></tr>
            ) : assignments.map(a => {
              const person = personnel.find(p => p.id === a.reviewee_id);
              return (
                <tr key={a.id} className="border-b border-border/40 hover:bg-primary/[0.03] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center text-xs font-bold text-white">
                        {person?.name?.charAt(0) ?? '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{person?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{person?.email ?? ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">{a.reviewer_id ? 'Assigned' : 'Unassigned'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusStyles[a.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {a.status === 'approved' ? <CheckCircle2 className="h-3 w-3" /> : a.status === 'rejected' ? <XCircle className="h-3 w-3" /> : a.status === 'changes_requested' ? <HelpCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {a.status?.replace(/_/g, ' ') ?? 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {a.status !== 'approved' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUpdateStatus(a.id, 'approved')}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      )}
                      {a.status !== 'rejected' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleUpdateStatus(a.id, 'rejected')}>
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      )}
                      {a.status !== 'changes_requested' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-amber-500 hover:text-amber-600" onClick={() => handleUpdateStatus(a.id, 'changes_requested')}>
                          <HelpCircle className="h-3 w-3 mr-1" /> Changes
                        </Button>
                      )}
                      <WriteGuard>
                        <button onClick={() => setDeleteTarget({ id: a.id, title: person?.name ?? 'assignment' })}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Remove">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </WriteGuard>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EntityFormDialog open={addOpen} onOpenChange={setAddOpen}
        title="Add Reviewer" fields={reviewerFields}
        onSubmit={async (vals) => {
          const { error } = await supabase.from('access_review_assignments').insert({
            campaign_id: campaignId,
            reviewee_id: vals.reviewee_id as string,
            status: 'pending',
          } as TablesInsert<'access_review_assignments'>);
          if (error) { toast.error('Failed: ' + error.message); return false; }
          toast.success('Reviewer added');
          await fetchData();
          return true;
        }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'assignment'}
        onConfirm={async () => { if (deleteTarget) { await handleDeleteAssignment(deleteTarget.id); return true; } return false; }} />
    </div>
    </RouteGuard>
  );
}
