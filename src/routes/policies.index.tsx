import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { policies } from '@/lib/mock-data-extended';
import { FileText, Plus } from 'lucide-react';

export const Route = createFileRoute('/policies/')({
  component: PoliciesPage,
  head: () => ({ meta: [{ title: 'Policies — WatchDog Security' }] }),
});

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-status-warning/15 text-status-warning',
  approved: 'bg-status-in-progress/15 text-status-in-progress',
  published: 'bg-status-passing/15 text-status-passing',
  archived: 'bg-muted text-muted-foreground',
};

const statusOrder = ['draft', 'review', 'approved', 'published', 'archived'];

function PoliciesPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Policies</h1>
          <p className="text-sm text-muted-foreground">{policies.length} policies managed</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> New Policy
        </button>
      </div>

      {/* Lifecycle summary */}
      <div className="flex gap-3 flex-wrap">
        {statusOrder.map(s => {
          const count = policies.filter(p => p.status === s).length;
          return (
            <div key={s} className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[s]}`}>{s}</span>
              <span className="text-sm font-bold text-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Version</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Owner</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Approved</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Next Review</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Controls</th>
            </tr>
          </thead>
          <tbody>
            {policies.map(p => (
              <tr key={p.id} className="border-b border-border hover:bg-surface transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">{p.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">v{p.version}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[p.status]}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.owner}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.approvedAt || '—'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{p.nextReviewDate}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.linkedControls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
