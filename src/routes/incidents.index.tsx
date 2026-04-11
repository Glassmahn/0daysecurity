import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { incidents } from '@/lib/mock-data';
import { Search } from 'lucide-react';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';

const incidentsSearchSchema = z.object({
  severity: fallback(z.string(), 'all').default('all'),
  status: fallback(z.string(), 'all').default('all'),
  q: fallback(z.string(), '').default(''),
});

export const Route = createFileRoute('/incidents/')({
  component: IncidentsPage,
  validateSearch: zodValidator(incidentsSearchSchema),
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
  const navigate = useNavigate({ from: '/incidents/' });
  const { severity: severityFilter, status: statusFilter, q: search } = Route.useSearch();

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return inc.title.toLowerCase().includes(q) || inc.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [severityFilter, statusFilter, search]);

  const updateSearch = (updates: Record<string, string>) => {
    navigate({ search: (prev) => ({ ...prev, ...updates }) });
  };

  const activeFilterCount = [severityFilter, statusFilter].filter(f => f !== 'all').length + (search ? 1 : 0);

  const severityCounts = {
    critical: incidents.filter(i => i.severity === 'critical').length,
    high: incidents.filter(i => i.severity === 'high').length,
    medium: incidents.filter(i => i.severity === 'medium').length,
    low: incidents.filter(i => i.severity === 'low').length,
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Incidents</h1>
          <p className="text-sm text-muted-foreground">{incidents.length} incidents</p>
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

      {/* Severity KPI cards */}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search incidents..."
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
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="contained">Contained</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Results */}
      <p className="text-xs text-muted-foreground">{filtered.length} incidents matching filters</p>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Priority</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Owner</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(inc => (
              <tr key={inc.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate({ to: '/incidents/$incidentId', params: { incidentId: inc.id } })}>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityStyles[inc.severity]}`}>{inc.severity}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{inc.id}</td>
                <td className="px-4 py-3 text-foreground">{inc.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[inc.status]}`}>{inc.status}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground uppercase hidden sm:table-cell">{inc.priority}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{inc.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No incidents match the current filters.{' '}
            <button onClick={() => navigate({ search: { severity: 'all', status: 'all', q: '' } })} className="text-primary hover:underline cursor-pointer">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
