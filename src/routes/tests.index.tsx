import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, Plus, Pencil, Trash2, Download, FlaskConical, Filter } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { useTableSort } from '@/hooks/use-table-sort';
import { SortableHeader } from '@/components/crud/SortableHeader';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';
import { WriteGuard } from '@/components/guards/RoleGuards';

export const Route = createFileRoute('/tests/')({ component: TestsIndexPage,
  head: () => ({ meta: [{ title: 'Tests — ZeroDay Security' }, { name: 'description', content: 'Compliance test management' }] }) });

const statusStyles: Record<string, string> = { passing: 'bg-status-passing/12 text-status-passing', failing: 'bg-status-failing/12 text-status-failing', pending: 'bg-status-in-progress/12 text-status-in-progress', error: 'bg-severity-high/12 text-severity-high', disabled: 'bg-muted text-muted-foreground' };

const testFields: FieldDef[] = [
  { name: 'name', label: 'Test Name', type: 'text', required: true, placeholder: 'Test name', max: 255 },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this test...', max: 2000 },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [
    { value: 'passing', label: 'Passing' }, { value: 'failing', label: 'Failing' }, { value: 'pending', label: 'Pending' }, { value: 'error', label: 'Error' }, { value: 'disabled', label: 'Disabled' },
  ]},
  { name: 'result', label: 'Result', type: 'text', placeholder: 'pass/fail', max: 50 },
  { name: 'schedule', label: 'Schedule', type: 'text', placeholder: 'e.g. weekly, monthly', max: 50 },
];
const testStatusOptions = testFields.find(f => f.name === 'status')!.options!;

function TestsIndexPage() {
  const navigate = useNavigate();
  const { data: tests, loading, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('tests');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const filtered = useMemo(() => {
    if (!search) return tests;
    const q = search.toLowerCase();
    return tests.filter(t => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q));
  }, [tests, search]);

  const { sorted, sort, toggle: toggleSort } = useTableSort(filtered, 'name', 'asc');
  const pagination = usePagination(sorted);
  const filteredIds = useMemo(() => filtered.map(t => t.id), [filtered]);
  const bulk = useBulkSelection(filteredIds);

  const stats = useMemo(() => ({
    passing: tests.filter(t => t.status === 'passing').length,
    failing: tests.filter(t => t.status === 'failing').length,
    pending: tests.filter(t => t.status === 'pending').length,
    total: tests.length,
  }), [tests]);
  const passRate = stats.total > 0 ? Math.round((stats.passing / stats.total) * 100) : 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">Loading tests…</p>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Tests</h1>
            <p className="text-sm text-muted-foreground">{tests.length} tests configured</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportToCsv('tests', filtered as Record<string, unknown>[], [
              { key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'result', label: 'Result' },
              { key: 'schedule', label: 'Schedule' }, { key: 'last_run', label: 'Last Run' }, { key: 'description', label: 'Description' },
            ])} className="flex items-center gap-1.5 px-3.5 py-2 border border-border/60 rounded-xl text-sm font-medium hover:bg-accent hover:border-primary/30 transition-all text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <WriteGuard>
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-glow transition-all">
              <Plus className="h-4 w-4" /> New Test
            </button>
          </WriteGuard>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all"><div className="text-2xl font-display font-bold text-foreground">{passRate}%</div><div className="text-[11px] text-muted-foreground font-medium mt-1">Pass Rate</div></div>
        <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all"><div className="text-2xl font-display font-bold text-status-passing">{stats.passing}</div><div className="text-[11px] text-muted-foreground font-medium mt-1">Passing</div></div>
        <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all"><div className="text-2xl font-display font-bold text-status-failing">{stats.failing}</div><div className="text-[11px] text-muted-foreground font-medium mt-1">Failing</div></div>
        <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all"><div className="text-2xl font-display font-bold text-status-in-progress">{stats.pending}</div><div className="text-[11px] text-muted-foreground font-medium mt-1">Pending</div></div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />
      </div>

      <BulkActionBar count={bulk.count} onClear={bulk.clear} onBulkDelete={() => bulkRemove([...bulk.selected])}
        statusOptions={testStatusOptions} onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })} entityName="test" />

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/60 text-left bg-surface/50">
            <th className="px-3 py-3.5 w-10"><input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }} onChange={bulk.toggleAll} className="rounded-md border-border" /></th>
            <SortableHeader label="Test Name" column="name" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <SortableHeader label="Schedule" column="schedule" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
            <SortableHeader label="Last Run" column="last_run" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden lg:table-cell" />
            <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <SortableHeader label="Result" column="result" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground w-20">Actions</th>
          </tr></thead>
          <tbody>{pagination.paged.map(t => (
            <tr key={t.id} className={`border-b border-border/40 hover:bg-primary/[0.03] transition-colors cursor-pointer ${bulk.isSelected(t.id) ? 'bg-primary/5' : ''}`}
              onClick={() => navigate({ to: '/tests/$testId', params: { testId: t.id } })}>
              <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}><input type="checkbox" checked={bulk.isSelected(t.id)} onChange={() => bulk.toggle(t.id)} className="rounded-md border-border" /></td>
              <td className="px-4 py-3.5"><div className="font-medium text-foreground">{t.name}</div><div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div></td>
              <td className="px-4 py-3.5 text-muted-foreground text-xs hidden md:table-cell capitalize">{t.schedule ?? '—'}</td>
              <td className="px-4 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">{t.last_run ? new Date(t.last_run).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3.5"><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusStyles[t.status] ?? 'bg-muted text-muted-foreground'}`}>{t.status}</span></td>
              <td className="px-4 py-3.5 text-xs text-muted-foreground">{t.result ?? '—'}</td>
              <td className="px-4 py-3.5"><div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <WriteGuard>
                  <button onClick={() => { setEditing({ name: t.name, description: t.description, status: t.status, result: t.result, schedule: t.schedule, _id: t.id }); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget({ id: t.id, title: t.name })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </WriteGuard>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
              <Filter className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p>No tests found.</p>
          </div>
        )}
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>
      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit Test' : 'New Test'} fields={testFields} initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />
      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title={deleteTarget?.title ?? 'test'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
  );
}
