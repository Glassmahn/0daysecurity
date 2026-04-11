import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useSupabaseTable } from '@/hooks/use-supabase-data';
import { Search, Loader2 } from 'lucide-react';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';

const alertsSearchSchema = z.object({
  severity: fallback(z.string(), 'all').default('all'),
  status: fallback(z.string(), 'all').default('all'),
  q: fallback(z.string(), '').default(''),
});

export const Route = createFileRoute('/alerts/')({
  component: AlertsPage,
  validateSearch: zodValidator(alertsSearchSchema),
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
  new: 'bg-status-failing/15 text-status-failing',
  open: 'bg-status-failing/15 text-status-failing',
  acknowledged: 'bg-status-warning/15 text-status-warning',
  investigating: 'bg-status-in-progress/15 text-status-in-progress',
  resolved: 'bg-status-passing/15 text-status-passing',
  dismissed: 'bg-muted text-muted-foreground',
};

function AlertsPage() {
  const navigate = useNavigate({ from: '/alerts/' });
  const { severity: severityFilter, status: statusFilter, q: search } = Route.useSearch();
  const { data: alerts, loading } = useSupabaseTable('alerts');

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.title.toLowerCase().includes(q) || (a.source ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [alerts, severityFilter, statusFilter, search]);

  const updateSearch = (updates: Record<string, string>) => {
    navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...updates }) });
  };

  const activeFilterCount = [severityFilter, statusFilter].filter(f => f !== 'all').length + (search ? 1 : 0);

  const severityCounts = useMemo(() => ({
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  }), [alerts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Alerts</h1>
          <p className="text-sm text-muted-foreground">{alerts.length} total alerts</p>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={() => navigate({ search: { severity: 'all', status: 'all', q: '' } })}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
          <button
            key={sev}
            onClick={() => updateSearch({ severity: severityFilter === sev ? 'all' : sev })}
            className={`bg-card border rounded-lg p-4 text-left hover:border-primary/40 transition-all cursor-pointer ${severityFilter === sev ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
          >
            <div className={`text-2xl font-bold ${severityFilter === sev ? 'text-primary' : ''}`}>
              {severityCounts[sev]}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${sev === 'critical' ? 'bg-severity-critical' : sev === 'high' ? 'bg-severity-high' : sev === 'medium' ? 'bg-severity-medium' : 'bg-severity-low'}`} />
              <span className="text-xs text-muted-foreground capitalize">{sev}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={severityFilter}
          onChange={e => updateSearch({ severity: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${severityFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} alerts matching filters</p>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Source</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Age</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(alert => (
              <tr key={alert.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityStyles[alert.severity] ?? ''}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{alert.title}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{alert.source ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[alert.status] ?? ''}`}>
                    {alert.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: false })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No alerts match the current filters.{' '}
            <button onClick={() => navigate({ search: { severity: 'all', status: 'all', q: '' } })} className="text-primary hover:underline cursor-pointer">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
