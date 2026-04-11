import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { useTableSort } from '@/hooks/use-table-sort';
import { SortableHeader } from '@/components/crud/SortableHeader';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';

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
  acknowledged: 'bg-status-warning/15 text-status-warning',
  resolved: 'bg-status-passing/15 text-status-passing',
  dismissed: 'bg-muted text-muted-foreground',
};

const alertFields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Alert title', max: 255 },
  { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Alert details...', max: 2000 },
  {
    name: 'severity', label: 'Severity', type: 'select', required: true,
    options: [
      { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }, { value: 'info', label: 'Info' },
    ],
  },
  {
    name: 'status', label: 'Status', type: 'select', required: true,
    options: [
      { value: 'new', label: 'New' }, { value: 'acknowledged', label: 'Acknowledged' },
      { value: 'resolved', label: 'Resolved' }, { value: 'dismissed', label: 'Dismissed' },
    ],
  },
  { name: 'source', label: 'Source', type: 'text', placeholder: 'e.g. security, infrastructure', max: 100 },
];

const alertStatusOptions = alertFields.find(f => f.name === 'status')!.options!;

function AlertsPage() {
  const navigate = useNavigate({ from: '/alerts/' });
  const { severity: severityFilter, status: statusFilter, q: search } = Route.useSearch();
  const { data: alerts, loading, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('alerts');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

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

  const { sorted, sort, toggle: toggleSort } = useTableSort(filtered, 'created_at', 'desc');
  const pagination = usePagination(sorted);
  const filteredIds = useMemo(() => filtered.map(a => a.id), [filtered]);
  const bulk = useBulkSelection(filteredIds);

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
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Alerts</h1>
          <p className="text-sm text-muted-foreground">{alerts.length} total alerts</p>
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
            <Plus className="h-4 w-4" /> New Alert
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
          <input type="text" placeholder="Search alerts..." value={search} onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={severityFilter} onChange={e => updateSearch({ severity: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${severityFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option><option value="info">Info</option>
        </select>
        <select value={statusFilter} onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
          <option value="all">All Statuses</option>
          <option value="new">New</option><option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} alerts matching filters</p>

      <BulkActionBar count={bulk.count} onClear={bulk.clear}
        onBulkDelete={() => bulkRemove([...bulk.selected])}
        statusOptions={alertStatusOptions}
        onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })}
        entityName="alert" />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                  onChange={bulk.toggleAll} className="rounded border-border" />
              </th>
              <SortableHeader label="Severity" column="severity" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Title" column="title" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Source" column="source" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
              <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Age" column="created_at" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paged.map(alert => (
              <tr key={alert.id} className={`border-b border-border hover:bg-muted/50 transition-colors ${bulk.isSelected(alert.id) ? 'bg-primary/5' : ''}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={bulk.isSelected(alert.id)} onChange={() => bulk.toggle(alert.id)} className="rounded border-border" />
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityStyles[alert.severity] ?? ''}`}>{alert.severity}</span>
                </td>
                <td className="px-4 py-3 text-foreground">{alert.title}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{alert.source ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[alert.status] ?? ''}`}>{alert.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDistanceToNow(new Date(alert.created_at), { addSuffix: false })}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing({ title: alert.title, message: alert.message, severity: alert.severity, status: alert.status, source: alert.source, _id: alert.id }); setFormOpen(true); }}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget({ id: alert.id, title: alert.title })}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
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
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title={editing ? 'Edit Alert' : 'New Alert'} fields={alertFields}
        initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'alert'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
  );
}
