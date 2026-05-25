import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useEffect } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { AdminGuard, WriteGuard } from '@/components/guards/RoleGuards';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { Users, Mail, ShieldAlert, GraduationCap, Plus, Pencil, Trash2, Loader2, AlertCircle, FileText, LogOut, UserPlus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { logAudit } from '@/lib/audit-logger';
import { supabase } from '@/integrations/supabase/client';
import { OffboardingChecklistModal } from '@/components/personnel/OffboardingChecklistModal';
import { AssignEntityDialog } from '@/components/personnel/AssignEntityDialog';
import { PersonnelPolicyAcks } from '@/components/personnel/PersonnelPolicyAcks';
import { TrainingCompletionDetails } from '@/components/personnel/TrainingCompletionDetails';

export const Route = createFileRoute('/personnel/')({
  component: PersonnelPage,
  head: () => ({ meta: [{ title: 'Personnel — ZeroDay Security' }] }),
});

const reviewStyles: Record<string, string> = {
  current: 'bg-status-passing/15 text-status-passing',
  overdue: 'bg-status-failing/15 text-status-failing',
  pending: 'bg-status-warning/15 text-status-warning',
};

const trainingStyles: Record<string, string> = {
  completed: 'bg-status-passing/15 text-status-passing',
  in_progress: 'bg-status-in-progress/15 text-status-in-progress',
  overdue: 'bg-status-failing/15 text-status-failing',
  not_started: 'bg-muted text-muted-foreground',
};

const roleStyles: Record<string, string> = {
  admin: 'bg-primary/15 text-primary',
  analyst: 'bg-chart-2/15 text-chart-2',
  auditor: 'bg-status-warning/15 text-status-warning',
  viewer: 'bg-muted text-muted-foreground',
};

const personnelFields: FieldDef[] = [
  { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Full name', max: 255 },
  { name: 'email', label: 'Email', type: 'text', required: true, placeholder: 'email@company.com' },
  { name: 'department', label: 'Department', type: 'text', placeholder: 'Engineering, Security, etc.' },
  { name: 'title', label: 'Title', type: 'text', placeholder: 'Job title' },
  {
    name: 'role', label: 'Platform Role', type: 'select', required: true,
    options: [
      { value: 'admin', label: 'Admin' }, { value: 'analyst', label: 'Analyst' },
      { value: 'auditor', label: 'Auditor' }, { value: 'viewer', label: 'Viewer' },
    ],
  },
  {
    name: 'access_review_status', label: 'Access Review', type: 'select',
    options: [
      { value: 'current', label: 'Current' }, { value: 'pending', label: 'Pending' },
      { value: 'overdue', label: 'Overdue' },
    ],
  },
  {
    name: 'training_status', label: 'Training Status', type: 'select',
    options: [
      { value: 'completed', label: 'Completed' }, { value: 'in_progress', label: 'In Progress' },
      { value: 'not_started', label: 'Not Started' }, { value: 'overdue', label: 'Overdue' },
    ],
  },
];

function PersonnelPage() {
  const { data: records, loading, error, refetch, insert, update, remove } = useSupabaseCrud('personnel', 'name', true);
  const [filter, setFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [policyAcksTarget, setPolicyAcksTarget] = useState<{ id: string; name: string } | null>(null);
  const [trainingDetailsTarget, setTrainingDetailsTarget] = useState<{ id: string; name: string } | null>(null);
  const [offboardingTarget, setOffboardingTarget] = useState<{ id: string; name: string } | null>(null);
  const [assignTarget, setAssignTarget] = useState<{ id: string; name: string } | null>(null);
  const [ackCounts, setAckCounts] = useState<Record<string, number>>({});

  const personnel = records as Record<string, unknown>[];

  useEffect(() => {
    supabase.from('policy_acknowledgments').select('user_id').then(({ data }) => {
      const counts: Record<string, number> = {};
      for (const a of data ?? []) {
        const uid = String(a.user_id);
        counts[uid] = (counts[uid] ?? 0) + 1;
      }
      setAckCounts(counts);
    });
  }, [records]);

  const overdue = personnel.filter(p => String(p.access_review_status) === 'overdue').length;
  const trainingComplete = personnel.filter(p => String(p.training_status) === 'completed').length;
  const trainingPct = personnel.length > 0 ? Math.round((trainingComplete / personnel.length) * 100) : 0;

  const filtered = useMemo(() => {
    if (filter === 'all') return personnel;
    if (filter === 'overdue-review') return personnel.filter(p => String(p.access_review_status) === 'overdue');
    if (filter === 'overdue-training') return personnel.filter(p => String(p.training_status) === 'overdue');
    return personnel;
  }, [personnel, filter]);

  const overdueCount = personnel.filter(p => String(p.access_review_status) === 'overdue' || String(p.training_status) === 'overdue').length;

  const handleSendReminders = async () => {
    if (overdueCount === 0) {
      toast.info('No overdue team members');
      return;
    }
    logAudit({
      action: 'send_reminders',
      entity_type: 'personnel',
      entity_id: 'bulk',
      details: { overdueCount, filter },
    });
    toast.success(`Reminder logged for ${overdueCount} team member${overdueCount !== 1 ? 's' : ''}`);
  };

  if (error) {
    return (
      <AdminGuard fallback={<div className="flex items-center justify-center py-24"><div className="text-center space-y-3"><div className="text-4xl">{'\uD83D\uDD12'}</div><h2 className="text-lg font-semibold">Access Restricted</h2><p className="text-sm text-muted-foreground">Only administrators can access Personnel management.</p></div></div>}>
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-destructive">Failed to load personnel</p>
        <p className="text-xs text-muted-foreground max-w-md text-center">{error}</p>
        <button onClick={refetch} className="text-xs text-primary hover:underline cursor-pointer">Try again</button>
      </div>
      </AdminGuard>
    );
  }

  if (loading) {
    return (
      <AdminGuard fallback={<div className="flex items-center justify-center py-24"><div className="text-center space-y-3"><div className="text-4xl">{'\uD83D\uDD12'}</div><h2 className="text-lg font-semibold">Access Restricted</h2><p className="text-sm text-muted-foreground">Only administrators can access Personnel management.</p></div></div>}>
      <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard fallback={<div className="flex items-center justify-center py-24"><div className="text-center space-y-3"><div className="text-4xl">{'\uD83D\uDD12'}</div><h2 className="text-lg font-semibold">Access Restricted</h2><p className="text-sm text-muted-foreground">Only administrators can access Personnel management.</p></div></div>}>
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Personnel</h1>
          <p className="text-sm text-muted-foreground">{personnel.length} team members tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSendReminders}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors text-foreground">
            <Mail className="h-4 w-4" /> Send Reminders
          </button>
          <WriteGuard>
            <button onClick={() => { setEditing(null); setFormOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Add Member
            </button>
          </WriteGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Personnel</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{personnel.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setFilter(filter === 'overdue-review' ? 'all' : 'overdue-review')}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-status-failing" />
            <span className="text-xs text-muted-foreground">Overdue Access Reviews</span>
          </div>
          <div className="text-2xl font-bold text-status-failing">{overdue}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-4 w-4 text-status-passing" />
            <span className="text-xs text-muted-foreground">Training Completion</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{trainingPct}%</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/40 transition-all" onClick={() => setFilter(filter === 'overdue-training' ? 'all' : 'overdue-training')}>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-4 w-4 text-status-failing" />
            <span className="text-xs text-muted-foreground">Training Overdue</span>
          </div>
          <div className="text-2xl font-bold text-status-failing">{personnel.filter(p => String(p.training_status) === 'overdue').length}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Dept</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Access Review</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Training</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Policy Acks</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const id = String(p.id);
              const name = String(p.name ?? '');
              const email = String(p.email ?? '');
              const department = String(p.department ?? '');
              const role = String(p.role ?? '');
              const accessReviewStatus = String(p.access_review_status ?? '');
              const trainingStatus = String(p.training_status ?? '');
              const ackCount = ackCounts[id] ?? 0;
              return (
                <tr key={id} className="border-b border-border hover:bg-surface transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-foreground">{name}</div>
                      <div className="text-xs text-muted-foreground">{email || '\u2014'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{department || '\u2014'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${roleStyles[role] ?? 'bg-muted text-muted-foreground'}`}>{role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${reviewStyles[accessReviewStatus] ?? ''}`}>
                      {accessReviewStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${trainingStyles[trainingStatus] ?? ''}`}>
                        {trainingStatus.replace(/_/g, ' ')}
                      </span>
                      <button onClick={() => setTrainingDetailsTarget({ id, name })}
                        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Training details">
                        <BookOpen className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setPolicyAcksTarget({ id, name })}
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer">
                      <FileText className="h-3 w-3" />
                      {ackCount > 0 ? `${ackCount} policy${ackCount !== 1 ? 's' : ''}` : 'View'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <WriteGuard>
                        <button onClick={() => setOffboardingTarget({ id, name })}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Offboarding">
                          <LogOut className="h-3.5 w-3.5" />
                        </button>
                      </WriteGuard>
                      <WriteGuard>
                        <button onClick={() => setAssignTarget({ id, name })}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Assign to Control/Risk/Audit">
                          <UserPlus className="h-3.5 w-3.5" />
                        </button>
                      </WriteGuard>
                      <WriteGuard>
                        <button onClick={() => { setEditing({ id, name, email, department, title: String(p.title ?? ''), role, access_review_status: accessReviewStatus, training_status: trainingStatus, last_access_review: p.last_access_review, last_training_completed: p.last_training_completed }); setFormOpen(true); }}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      </WriteGuard>
                      <WriteGuard>
                        <button onClick={() => setDeleteTarget({ id, name })}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </WriteGuard>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {personnel.length === 0
              ? 'No team members yet. Add your first member above.'
              : 'No team members match the current filter.'}
          </div>
        )}
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title={editing ? 'Edit Member' : 'Add Member'} fields={personnelFields}
        initialValues={editing ?? undefined}
        onSubmit={async (vals) => {
          const { _id, ...data } = vals;
          if (_id) return update(String(_id), data);
          return insert(data);
        }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.name ?? 'member'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />

      {policyAcksTarget && (
        <PersonnelPolicyAcks personId={policyAcksTarget.id} personName={policyAcksTarget.name}
          onClose={() => setPolicyAcksTarget(null)} />
      )}

      {trainingDetailsTarget && (
        <TrainingCompletionDetails personId={trainingDetailsTarget.id} personName={trainingDetailsTarget.name}
          onClose={() => setTrainingDetailsTarget(null)} />
      )}

      {offboardingTarget && (
        <OffboardingChecklistModal personId={offboardingTarget.id} personName={offboardingTarget.name}
          onClose={() => setOffboardingTarget(null)} onSaved={refetch} />
      )}

      {assignTarget && (
        <AssignEntityDialog personId={assignTarget.id} personName={assignTarget.name}
          onClose={() => setAssignTarget(null)} onSaved={refetch} />
      )}
    </div>
    </AdminGuard>
  );
}
