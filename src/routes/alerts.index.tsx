import { createFileRoute } from '@tanstack/react-router';
import { alerts } from '@/lib/mock-data';
import { useState } from 'react';

export const Route = createFileRoute('/alerts/')({
  component: AlertsPage,
  head: () => ({
    meta: [
      { title: 'Alerts — WatchDog Security' },
      { name: 'description', content: 'Security alerts queue and triage' },
    ],
  }),
});

const severityStyles: Record<string, string> = {
  critical: 'bg-severity-critical/15 text-severity-critical',
  high: 'bg-severity-high/15 text-severity-high',
  medium: 'bg-severity-medium/15 text-severity-medium',
  low: 'bg-severity-low/15 text-severity-low',
  info: 'bg-severity-info/15 text-severity-info',
};

const statusStyles: Record<string, string> = {
  open: 'bg-status-failing/15 text-status-failing',
  acknowledged: 'bg-status-warning/15 text-status-warning',
  investigating: 'bg-status-in-progress/15 text-status-in-progress',
  resolved: 'bg-status-passing/15 text-status-passing',
  dismissed: 'bg-muted text-muted-foreground',
};

function AlertsPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Alerts</h1>
          <p className="text-sm text-muted-foreground">{alerts.length} total alerts</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-md p-0.5">
          {['all', 'critical', 'high', 'medium', 'low'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${
                filter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Source</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Owner</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Age</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(alert => (
              <tr key={alert.id} className="border-b border-border hover:bg-surface transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityStyles[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{alert.id}</td>
                <td className="px-4 py-3 text-foreground">{alert.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{alert.source}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[alert.status]}`}>
                    {alert.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{alert.owner || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{alert.age}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
