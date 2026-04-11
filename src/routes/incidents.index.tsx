import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';

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

const incidentFields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Incident title', max: 255 },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the incident...', max: 5000 },
  {
    name: 'severity', label: 'Severity', type: 'select', required: true,
    options: [
      { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' },
    ],
  },
  {
    name: 'status', label: 'Status', type: 'select', required: true,
    options: [
      { value: 'open', label: 'Open' }, { value: 'investigating', label: 'Investigating' },
      { value: 'contained', label: 'Contained' }, { value: 'resolved', label: 'Resolved' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  { name: 'root_cause', label: 'Root Cause', type: 'textarea', placeholder: 'Root cause analysis...', max: 2000 },
];

const incidentStatusOptions = incidentFields.find(f => f.name === 'status')!.options!;

function IncidentsPage() {
  const navigate = useNavigate({ from: '/incidents/' });
  const { severity: severityFilter, status: statusFilter, q: search } = Route.useSearch();
  const { data: incidents, loading, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('incidents');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

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
  }, [incidents, severityFilter, statusFilter, search]);

  const pagination = usePagination(filtered);
  const filteredIds = useMemo(() => filtered.map(i => i.id), [filtered]);
  const bulk = useBulkSelection(filteredIds);

  const updateSearch = (updates: Record<string, string>) => {
    navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...updates }) });
  };

  const activeFilterCount = [severityFilter, statusFilter].filter(f => f !== 'all').length + (search ? 1 : 0);

  const severityCounts = useMemo(() => ({
    critical: incidents.filter(i => i.severity === 'critical').length,
    high: incidents.filter(i => i.severity === 'high').length,
    medium: incidents.filter(i => i.severity === 'medium').length,
    low: incidents.filter(i => i.severity === 'low').length,
  }), [incidents]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Incidents</h1>
          <p className="text-sm text-muted-foreground">{incidents.length} incidents</p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={() => navigate({ search: { severity: 'all', status: 'all', q: '' } })}
              className="text-xs text-primary hover:underline cursor-pointer">
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Report Incident
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
          <button key={sev} onClick={() => updateSearch({ severity: severityFilter === sev ? 'all' : sev })}
            className={`bg-card border rounded-lg p-4 text-left hover:border-primary/40 transition-all cursor-pointer ${severityFilter === sev ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
            <div className={`text-2xl font-bold ${severityFilter === sev ? 'text-primary' : ''}`}>{severityCounts[sev]}</div>
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
          <input type="text" placeholder="Search incidents..." value={search} onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={severityFilter} onChange={e => updateSearch({ severity: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${severityFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select value={statusFilter} onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option><option value="investigating">Investigating</option>
          <option value="contained">Contained</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} incidents matching filters</p>

      <BulkActionBar count={bulk.count} onClear={bulk.clear}
        onBulkDelete={() => bulkRemove([...bulk.selected])}
        statusOptions={incidentStatusOptions}
        onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })}
        entityName="incident" />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                  onChange={bulk.toggleAll} className="rounded border-border" />
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Created</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paged.map(inc => (
              <tr key={inc.id} className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${bulk.isSelected(inc.id) ? 'bg-primary/5' : ''}`}
                onClick={() => navigate({ to: '/incidents/$incidentId', params: { incidentId: inc.id } })}>
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={bulk.isSelected(inc.id)} onChange={() => bulk.toggle(inc.id)} className="rounded border-border" />
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityStyles[inc.severity] ?? ''}`}>{inc.severity}</span>
                </td>
                <td className="px-4 py-3 text-foreground">{inc.title}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[inc.status] ?? ''}`}>{inc.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                  {new Date(inc.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditing({ title: inc.title, description: inc.description, severity: inc.severity, status: inc.status, root_cause: inc.root_cause, _id: inc.id }); setFormOpen(true); }}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget({ id: inc.id, title: inc.title })}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
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
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title={editing ? 'Edit Incident' : 'Report Incident'} fields={incidentFields}
        initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'incident'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
  );
}
