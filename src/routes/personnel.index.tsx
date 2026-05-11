import { createFileRoute } from '@tanstack/react-router';
import { personnelMembers } from '@/lib/mock-data-extended';
import { useState } from 'react';
import { Users, Mail, ShieldAlert, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/guards/RoleGuards';

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

function PersonnelPage() {
  const [filter, setFilter] = useState<string>('all');

  const overdue = personnelMembers.filter(p => p.accessReviewStatus === 'overdue').length;
  const trainingComplete = personnelMembers.filter(p => p.trainingStatus === 'completed').length;
  const trainingPct = Math.round((trainingComplete / personnelMembers.length) * 100);

  const filtered = filter === 'all'
    ? personnelMembers
    : filter === 'overdue-review'
    ? personnelMembers.filter(p => p.accessReviewStatus === 'overdue')
    : filter === 'overdue-training'
    ? personnelMembers.filter(p => p.trainingStatus === 'overdue')
    : personnelMembers;

  return (
    <AdminGuard fallback={<div className="flex items-center justify-center py-24"><div className="text-center space-y-3"><div className="text-4xl">🔒</div><h2 className="text-lg font-semibold">Access Restricted</h2><p className="text-sm text-muted-foreground">Only administrators can access Personnel management.</p></div></div>}>
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Personnel</h1>
          <p className="text-sm text-muted-foreground">{personnelMembers.length} team members tracked</p>
        </div>
        <button
          onClick={() => {
            const overdueCount = personnelMembers.filter(p => p.accessReviewStatus === 'overdue' || p.trainingStatus === 'overdue').length;
            toast.success(`Reminders sent to ${overdueCount} team member${overdueCount !== 1 ? 's' : ''}`);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Mail className="h-4 w-4" /> Send Reminders
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Personnel</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{personnelMembers.length}</div>
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
          <div className="text-2xl font-bold text-status-failing">{personnelMembers.filter(p => p.trainingStatus === 'overdue').length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Department</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Access Review</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Training</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Last Review</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Last Training</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-border hover:bg-surface transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.department}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${reviewStyles[p.accessReviewStatus]}`}>
                    {p.accessReviewStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${trainingStyles[p.trainingStatus]}`}>
                    {p.trainingStatus.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.lastAccessReview}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.lastTrainingCompleted || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </AdminGuard>
  );
}
