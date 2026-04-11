import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { incidents } from '@/lib/mock-data';

export const Route = createFileRoute('/incidents/')({
  component: IncidentsPage,
  head: () => ({
    meta: [
      { title: 'Incidents — WatchDog Security' },
      { name: 'description', content: 'Security incident management' },
    ],
  }),
});

const severityStyles: Record<string, string> = {
  critical: 'bg-severity-critical/15 text-severity-critical',
  high: 'bg-severity-high/15 text-severity-high',
  medium: 'bg-severity-medium/15 text-severity-medium',
  low: 'bg-severity-low/15 text-severity-low',
};

const statusStyles: Record<string, string> = {
  open: 'bg-status-failing/15 text-status-failing',
  investigating: 'bg-status-in-progress/15 text-status-in-progress',
  contained: 'bg-status-warning/15 text-status-warning',
  resolved: 'bg-status-passing/15 text-status-passing',
  closed: 'bg-muted text-muted-foreground',
};

function IncidentsPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Incidents</h1>
        <p className="text-sm text-muted-foreground">{incidents.length} incidents</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Priority</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Owner</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map(inc => (
              <tr key={inc.id} className="border-b border-border hover:bg-surface transition-colors cursor-pointer" onClick={() => navigate({ to: '/incidents/$incidentId', params: { incidentId: inc.id } })}>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityStyles[inc.severity]}`}>{inc.severity}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inc.id}</td>
                <td className="px-4 py-3 text-foreground">{inc.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[inc.status]}`}>{inc.status}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground uppercase">{inc.priority}</td>
                <td className="px-4 py-3 text-muted-foreground">{inc.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
