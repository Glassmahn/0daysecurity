import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, CheckCircle, Clock, XCircle, AlertTriangle, FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { useTableSort } from '@/hooks/use-table-sort';
import { SortableHeader } from '@/components/crud/SortableHeader';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';

const evidenceSearchSchema = z.object({
  status: fallback(z.string(), 'all').default('all'),
  type: fallback(z.string(), 'all').default('all'),
  source: fallback(z.string(), 'all').default('all'),
  q: fallback(z.string(), '').default(''),
});

export const Route = createFileRoute('/evidence/')({
  component: EvidencePage,
  validateSearch: zodValidator(evidenceSearchSchema),
  head: () => ({
    meta: [
      { title: 'Evidence — WatchDog Security' },
      { name: 'description', content: 'Evidence management and collection' },
    ],
  }),
});

const statusConfig: Record<string, { style: string; icon: React.ElementType; label: string }> = {
  valid: { style: 'bg-status-passing/15 text-status-passing', icon: CheckCircle, label: 'Valid' },
  pending_review: { style: 'bg-status-in-progress/15 text-status-in-progress', icon: Clock, label: 'Pending Review' },
  expired: { style: 'bg-status-failing/15 text-status-failing', icon: XCircle, label: 'Expired' },
  rejected: { style: 'bg-muted text-muted-foreground', icon: AlertTriangle, label: 'Rejected' },
};

const evidenceFields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Evidence title', max: 255 },
  {
    name: 'type', label: 'Type', type: 'select', required: true,
    options: [
      { value: 'document', label: 'Document' }, { value: 'screenshot', label: 'Screenshot' },
      { value: 'log', label: 'Log' }, { value: 'report', label: 'Report' },
      { value: 'certificate', label: 'Certificate' }, { value: 'scan_result', label: 'Scan Result' },
      { value: 'training_record', label: 'Training Record' }, { value: 'risk_assessment', label: 'Risk Assessment' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    name: 'status', label: 'Status', type: 'select', required: true,
    options: [
      { value: 'valid', label: 'Valid' }, { value: 'pending_review', label: 'Pending Review' },
      { value: 'expired', label: 'Expired' }, { value: 'rejected', label: 'Rejected' },
    ],
  },
  {
    name: 'source', label: 'Source', type: 'select', required: true,
    options: [{ value: 'manual', label: 'Manual Upload' }, { value: 'auto', label: 'Auto-Collected' }],
  },
];

const evidenceStatusOptions = evidenceFields.find(f => f.name === 'status')!.options!;

function EvidencePage() {
  const navigate = useNavigate({ from: '/evidence/' });
  const { status: statusFilter, type: typeFilter, source: sourceFilter, q: search } = Route.useSearch();
  const { data: evidence, loading, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('evidence');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const filtered = useMemo(() => {
    return evidence.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (sourceFilter === 'auto' && e.source !== 'auto') return false;
      if (sourceFilter === 'manual' && e.source !== 'manual') return false;
      if (search) return e.title.toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [evidence, search, statusFilter, typeFilter, sourceFilter]);

  const { sorted, sort, toggle: toggleSort } = useTableSort(filtered, 'collected_at', 'desc');
  const pagination = usePagination(sorted);
  const filteredIds = useMemo(() => filtered.map(e => e.id), [filtered]);
  const bulk = useBulkSelection(filteredIds);

  const updateSearch = (updates: Record<string, string>) => {
    navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...updates }) });
  };

  const activeFilterCount = [statusFilter, typeFilter, sourceFilter].filter(f => f !== 'all').length + (search ? 1 : 0);

  const stats = useMemo(() => ({
    total: evidence.length,
    valid: evidence.filter(e => e.status === 'valid').length,
    pending: evidence.filter(e => e.status === 'pending_review').length,
    expired: evidence.filter(e => e.status === 'expired').length,
  }), [evidence]);

  const usedTypes = useMemo(() => [...new Set(evidence.map(e => e.type))].sort(), [evidence]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Evidence</h1>
          <p className="text-sm text-muted-foreground">{evidence.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={() => navigate({ search: { status: 'all', type: 'all', source: 'all', q: '' } })}
              className="text-xs text-primary hover:underline cursor-pointer">
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Evidence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { key: 'all', label: 'Total', value: stats.total, color: '' },
          { key: 'valid', label: 'Valid', value: stats.valid, color: 'text-status-passing' },
          { key: 'pending_review', label: 'Pending', value: stats.pending, color: 'text-status-in-progress' },
          { key: 'expired', label: 'Expired', value: stats.expired, color: 'text-status-failing' },
        ] as const).map(item => (
          <button key={item.key} onClick={() => updateSearch({ status: statusFilter === item.key ? 'all' : item.key })}
            className={`bg-card border rounded-lg p-3 text-center hover:border-primary/40 transition-all cursor-pointer ${statusFilter === item.key && item.key !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
            <div className={`text-xl font-bold ${item.color || 'text-foreground'}`}>{item.value}</div>
            <div className="text-[10px] text-muted-foreground">{item.label}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search evidence..." value={search} onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={statusFilter} onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
          <option value="all">All Statuses</option>
          <option value="valid">Valid</option><option value="pending_review">Pending Review</option>
          <option value="expired">Expired</option><option value="rejected">Rejected</option>
        </select>
        {usedTypes.length > 1 && (
          <select value={typeFilter} onChange={e => updateSearch({ type: e.target.value })}
            className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${typeFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
            <option value="all">All Types</option>
            {usedTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        )}
        <select value={sourceFilter} onChange={e => updateSearch({ source: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${sourceFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
          <option value="all">All Sources</option>
          <option value="auto">Auto-Collected</option><option value="manual">Manual Upload</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} evidence items matching filters</p>

      <BulkActionBar count={bulk.count} onClear={bulk.clear}
        onBulkDelete={() => bulkRemove([...bulk.selected])}
        statusOptions={evidenceStatusOptions}
        onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })}
        entityName="evidence item" />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                  onChange={bulk.toggleAll} className="rounded border-border" />
              </th>
              <SortableHeader label="Title" column="title" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Type" column="type" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Source" column="source" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
              <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Collected" column="collected_at" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden lg:table-cell" />
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paged.map(e => {
              const sc = statusConfig[e.status] ?? statusConfig.valid;
              const StatusIcon = sc.icon;
              return (
                <tr key={e.id} className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${bulk.isSelected(e.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => navigate({ to: '/evidence/$evidenceId', params: { evidenceId: e.id } })}>
                  <td className="px-3 py-3" onClick={ev => ev.stopPropagation()}>
                    <input type="checkbox" checked={bulk.isSelected(e.id)} onChange={() => bulk.toggle(e.id)} className="rounded border-border" />
                  </td>
                  <td className="px-4 py-3 text-foreground">{e.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">{e.type.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{e.source ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.style}`}>
                      <StatusIcon className="h-3 w-3" />{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {e.collected_at ? new Date(e.collected_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
                      <button onClick={() => { setEditing({ title: e.title, type: e.type, status: e.status, source: e.source, _id: e.id }); setFormOpen(true); }}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget({ id: e.id, title: e.title })}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No evidence matches the current filters.{' '}
            <button onClick={() => navigate({ search: { status: 'all', type: 'all', source: 'all', q: '' } })} className="text-primary hover:underline cursor-pointer">Clear filters</button>
          </div>
        )}
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title={editing ? 'Edit Evidence' : 'Add Evidence'} fields={evidenceFields}
        initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'evidence'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
  );
}
