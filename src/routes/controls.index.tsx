import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, Plus, Pencil, Trash2, Download } from 'lucide-react';
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

const controlsSearchSchema = z.object({
  status: fallback(z.string(), 'all').default('all'),
  category: fallback(z.string(), 'all').default('all'),
  q: fallback(z.string(), '').default(''),
});

export const Route = createFileRoute('/controls/')({
  component: ControlsPage,
  validateSearch: zodValidator(controlsSearchSchema),
  head: () => ({
    meta: [
      { title: 'Controls — WatchDog Security' },
      { name: 'description', content: 'Security controls management' },
    ],
  }),
});

const statusStyles: Record<string, string> = {
  implemented: 'bg-status-passing/15 text-status-passing',
  partially_implemented: 'bg-status-in-progress/15 text-status-in-progress',
  failing: 'bg-status-failing/15 text-status-failing',
  not_started: 'bg-muted text-muted-foreground',
  not_applicable: 'bg-muted text-muted-foreground',
  not_implemented: 'bg-status-failing/15 text-status-failing',
};

const controlFields: FieldDef[] = [
  { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. CC6.1', max: 50 },
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Control title', max: 255 },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this control...', max: 2000 },
  { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Access Control', max: 100 },
  {
    name: 'status', label: 'Status', type: 'select', required: true,
    options: [
      { value: 'not_started', label: 'Not Started' },
      { value: 'partially_implemented', label: 'Partially Implemented' },
      { value: 'implemented', label: 'Implemented' },
      { value: 'not_implemented', label: 'Not Implemented' },
      { value: 'not_applicable', label: 'Not Applicable' },
      { value: 'failing', label: 'Failing' },
    ],
  },
];

const statusOptions = controlFields.find(f => f.name === 'status')!.options!;

function ControlsPage() {
  const navigate = useNavigate({ from: '/controls/' });
  const { status: statusFilter, category: categoryFilter, q: search } = Route.useSearch();
  const { data: controls, loading, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('controls');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const usedCategories = useMemo(
    () => [...new Set(controls.map(c => c.category).filter(Boolean))].sort() as string[],
    [controls]
  );

  const filtered = useMemo(() => {
    return controls.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [controls, search, statusFilter, categoryFilter]);

  const { sorted, sort, toggle: toggleSort } = useTableSort(filtered, 'code', 'asc');
  const pagination = usePagination(sorted);
  const filteredIds = useMemo(() => filtered.map(c => c.id), [filtered]);
  const bulk = useBulkSelection(filteredIds);

  const stats = useMemo(() => ({
    total: controls.length,
    implemented: controls.filter(c => c.status === 'implemented').length,
    failing: controls.filter(c => c.status === 'failing').length,
    in_progress: controls.filter(c => c.status === 'partially_implemented').length,
  }), [controls]);

  const updateSearch = (updates: Record<string, string>) => {
    navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...updates }) });
  };

  const activeFilterCount = [statusFilter, categoryFilter].filter(f => f !== 'all').length + (search ? 1 : 0);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Controls</h1>
          <p className="text-sm text-muted-foreground">{controls.length} controls</p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={() => navigate({ search: { status: 'all', category: 'all', q: '' } })}
              className="text-xs text-primary hover:underline cursor-pointer">
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => exportToCsv('controls', filtered as Record<string, unknown>[], [
              { key: 'code', label: 'Code' }, { key: 'title', label: 'Title' }, { key: 'status', label: 'Status' },
              { key: 'category', label: 'Category' }, { key: 'description', label: 'Description' }, { key: 'created_at', label: 'Created' },
            ])} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Control
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => updateSearch({ status: 'all' })} className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-colors cursor-pointer">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Controls</div>
        </button>
        <button onClick={() => updateSearch({ status: 'implemented' })} className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-colors cursor-pointer">
          <div className="text-2xl font-bold text-status-passing">{stats.implemented}</div>
          <div className="text-xs text-muted-foreground">Implemented</div>
        </button>
        <button onClick={() => updateSearch({ status: 'failing' })} className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-colors cursor-pointer">
          <div className="text-2xl font-bold text-status-failing">{stats.failing}</div>
          <div className="text-xs text-muted-foreground">Failing</div>
        </button>
        <button onClick={() => updateSearch({ status: 'partially_implemented' })} className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-colors cursor-pointer">
          <div className="text-2xl font-bold text-status-in-progress">{stats.in_progress}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search controls..." value={search} onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={statusFilter} onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
          <option value="all">All Statuses</option>
          <option value="implemented">Implemented</option>
          <option value="partially_implemented">Partially Implemented</option>
          <option value="failing">Failing</option>
          <option value="not_started">Not Started</option>
        </select>
        <select value={categoryFilter} onChange={e => updateSearch({ category: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${categoryFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
          <option value="all">All Categories</option>
          {usedCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} controls matching filters</p>

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clear}
        onBulkDelete={() => bulkRemove([...bulk.selected])}
        statusOptions={statusOptions}
        onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })}
        entityName="control"
      />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                  onChange={bulk.toggleAll} className="rounded border-border" />
              </th>
              <SortableHeader label="Code" column="code" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Title" column="title" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Category" column="category" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
              <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Last Reviewed" column="last_reviewed" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden lg:table-cell" />
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paged.map(c => (
              <tr key={c.id}
                className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${bulk.isSelected(c.id) ? 'bg-primary/5' : ''}`}
                onClick={() => navigate({ to: '/controls/$controlId', params: { controlId: c.id } })}>
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={bulk.isSelected(c.id)} onChange={() => bulk.toggle(c.id)} className="rounded border-border" />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-primary">{c.code}</td>
                <td className="px-4 py-3 text-foreground">{c.title}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.category ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusStyles[c.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                  {c.last_reviewed ? new Date(c.last_reviewed).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditing({ code: c.code, title: c.title, description: c.description, category: c.category, status: c.status, _id: c.id }); setFormOpen(true); }}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget({ id: c.id, title: c.title })}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No controls match the current filters.{' '}
            <button onClick={() => navigate({ search: { status: 'all', category: 'all', q: '' } })} className="text-primary hover:underline cursor-pointer">Clear filters</button>
          </div>
        )}
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title={editing ? 'Edit Control' : 'New Control'} fields={controlFields}
        initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'control'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
  );
}
