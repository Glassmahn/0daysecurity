import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, Plus, Pencil, Trash2, Download, Flame, Filter } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { useTableSort } from '@/hooks/use-table-sort';
import { SortableHeader } from '@/components/crud/SortableHeader';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';
import { WriteGuard } from '@/components/guards/RoleGuards';

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
      { title: 'Incidents — ZeroDay Security' },
      { name: 'description', content: 'Security incident management' },
    ],
  }),
});

const severityStyles: Record<string, string> = {
  critical: 'bg-severity-critical/12 text-severity-critical',
  high: 'bg-severity-high/12 text-severity-high',
  medium: 'bg-severity-medium/12 text-severity-medium',
  low: 'bg-severity-low/12 text-severity-low',
};

const statusStyles: Record<string, string> = {
  open: 'bg-status-failing/12 text-status-failing',
  investigating: 'bg-status-in-progress/12 text-status-in-progress',
  contained: 'bg-status-warning/12 text-status-warning',
  resolved: 'bg-status-passing/12 text-status-passing',
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

  const { sorted, sort, toggle: toggleSort } = useTableSort(filtered, 'created_at', 'desc');
  const pagination = usePagination(sorted);
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
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading incidents…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Incidents</h1>
            <p className="text-sm text-muted-foreground">{incidents.length} incidents tracked</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={() => navigate({ search: { severity: 'all', status: 'all', q: '' } })}
              className="text-xs text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium">
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => exportToCsv('incidents', filtered as Record<string, unknown>[], [
              { key: 'title', label: 'Title' }, { key: 'severity', label: 'Severity' }, { key: 'status', label: 'Status' },
              { key: 'description', label: 'Description' }, { key: 'root_cause', label: 'Root Cause' }, { key: 'created_at', label: 'Created' },
            ])} className="flex items-center gap-1.5 px-3.5 py-2 border border-border/60 rounded-xl text-sm font-medium hover:bg-accent hover:border-primary/30 transition-all text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <WriteGuard>
            <button onClick={() => { setEditing(null); setFormOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-glow transition-all">
              <Plus className="h-4 w-4" /> Report Incident
            </button>
          </WriteGuard>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
          <button key={sev} onClick={() => updateSearch({ severity: severityFilter === sev ? 'all' : sev })}
            className={`bg-card border rounded-xl p-4 text-left hover:border-primary/40 hover:shadow-glow transition-all cursor-pointer ${severityFilter === sev ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
            <div className={`text-2xl font-display font-bold ${severityFilter === sev ? 'text-primary' : ''}`}>{severityCounts[sev]}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`h-2 w-2 rounded-full ${sev === 'critical' ? 'bg-severity-critical' : sev === 'high' ? 'bg-severity-high' : sev === 'medium' ? 'bg-severity-medium' : 'bg-severity-low'}`} />
              <span className="text-[11px] text-muted-foreground font-medium capitalize">{sev}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search incidents..." value={search} onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />
        </div>
        <select value={severityFilter} onChange={e => updateSearch({ severity: e.target.value })}
          className={`bg-card border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${severityFilter !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select value={statusFilter} onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${statusFilter !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
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

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left bg-surface/50">
              <th className="px-3 py-3.5 w-10">
                <input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                  onChange={bulk.toggleAll} className="rounded-md border-border" />
              </th>
              <SortableHeader label="Severity" column="severity" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Title" column="title" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Created" column="created_at" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paged.map(inc => (
              <tr key={inc.id} className={`border-b border-border/40 hover:bg-primary/[0.03] transition-colors cursor-pointer ${bulk.isSelected(inc.id) ? 'bg-primary/5' : ''}`}
                onClick={() => navigate({ to: '/incidents/$incidentId', params: { incidentId: inc.id } })}>
                <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={bulk.isSelected(inc.id)} onChange={() => bulk.toggle(inc.id)} className="rounded-md border-border" />
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${severityStyles[inc.severity] ?? ''}`}>{inc.severity}</span>
                </td>
                <td className="px-4 py-3.5 text-foreground font-medium">{inc.title}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusStyles[inc.status] ?? ''}`}>{inc.status}</span>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                  {new Date(inc.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <WriteGuard>
                      <button onClick={() => { setEditing({ title: inc.title, description: inc.description, severity: inc.severity, status: inc.status, root_cause: inc.root_cause, _id: inc.id }); setFormOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget({ id: inc.id, title: inc.title })}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </WriteGuard>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
              <Filter className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p>No incidents match the current filters.</p>
            <button onClick={() => navigate({ search: { severity: 'all', status: 'all', q: '' } })} className="text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium text-xs">Clear filters</button>
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
