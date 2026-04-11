import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';

export const Route = createFileRoute('/tests/')({ component: TestsIndexPage,
  head: () => ({ meta: [{ title: 'Tests — WatchDog Security' }, { name: 'description', content: 'Compliance test management' }] }) });

const statusStyles: Record<string, string> = { passing: 'bg-status-passing/15 text-status-passing', failing: 'bg-status-failing/15 text-status-failing', pending: 'bg-status-in-progress/15 text-status-in-progress', error: 'bg-severity-high/15 text-severity-high', disabled: 'bg-muted text-muted-foreground' };

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

  const filteredIds = useMemo(() => filtered.map(t => t.id), [filtered]);
  const bulk = useBulkSelection(filteredIds);

  const stats = useMemo(() => ({
    passing: tests.filter(t => t.status === 'passing').length,
    failing: tests.filter(t => t.status === 'failing').length,
    pending: tests.filter(t => t.status === 'pending').length,
    total: tests.length,
  }), [tests]);
  const passRate = stats.total > 0 ? Math.round((stats.passing / stats.total) * 100) : 0;

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-foreground">Tests</h1><p className="text-sm text-muted-foreground">{tests.length} tests configured</p></div>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"><Plus className="h-4 w-4" /> New Test</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-foreground">{passRate}%</div><div className="text-xs text-muted-foreground">Pass Rate</div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-status-passing">{stats.passing}</div><div className="text-xs text-muted-foreground">Passing</div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-status-failing">{stats.failing}</div><div className="text-xs text-muted-foreground">Failing</div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="text-2xl font-bold text-status-in-progress">{stats.pending}</div><div className="text-xs text-muted-foreground">Pending</div></div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      <BulkActionBar count={bulk.count} onClear={bulk.clear} onBulkDelete={() => bulkRemove([...bulk.selected])}
        statusOptions={testStatusOptions} onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })} entityName="test" />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left">
            <th className="px-3 py-3 w-10"><input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }} onChange={bulk.toggleAll} className="rounded border-border" /></th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Test Name</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Schedule</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Last Run</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Result</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Actions</th>
          </tr></thead>
          <tbody>{filtered.map(t => (
            <tr key={t.id} className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${bulk.isSelected(t.id) ? 'bg-primary/5' : ''}`}
              onClick={() => navigate({ to: '/tests/$testId', params: { testId: t.id } })}>
              <td className="px-3 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={bulk.isSelected(t.id)} onChange={() => bulk.toggle(t.id)} className="rounded border-border" /></td>
              <td className="px-4 py-3"><div className="font-medium text-foreground">{t.name}</div><div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div></td>
              <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell capitalize">{t.schedule ?? '—'}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{t.last_run ? new Date(t.last_run).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3"><span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[t.status] ?? 'bg-muted text-muted-foreground'}`}>{t.status}</span></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{t.result ?? '—'}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditing({ name: t.name, description: t.description, status: t.status, result: t.result, schedule: t.schedule, _id: t.id }); setFormOpen(true); }} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteTarget({ id: t.id, title: t.name })} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No tests found.</div>}
      </div>
      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit Test' : 'New Test'} fields={testFields} initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />
      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title={deleteTarget?.title ?? 'test'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
  );
}
