import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Plus, Loader2, Pencil, Trash2, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { useTableSort } from '@/hooks/use-table-sort';
import { SortableHeader } from '@/components/crud/SortableHeader';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';

export const Route = createFileRoute('/risk-register/')({ component: RiskRegisterPage, head: () => ({ meta: [{ title: 'Risk Register — WatchDog Security' }] }) });

const statusStyles: Record<string, string> = { open: 'bg-status-failing/15 text-status-failing', mitigated: 'bg-status-passing/15 text-status-passing', accepted: 'bg-muted text-muted-foreground', transferred: 'bg-status-in-progress/15 text-status-in-progress', closed: 'bg-muted text-muted-foreground' };

function scoreColor(score: number | null) {
  if (!score) return 'bg-muted text-muted-foreground';
  if (score >= 15) return 'bg-severity-critical text-primary-foreground';
  if (score >= 10) return 'bg-severity-high text-primary-foreground';
  if (score >= 6) return 'bg-severity-medium text-primary-foreground';
  return 'bg-status-passing text-primary-foreground';
}

const riskFields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Risk title', max: 255 },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the risk...', max: 5000 },
  { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Cybersecurity', max: 100 },
  { name: 'likelihood', label: 'Likelihood (1-5)', type: 'number', required: true, min: 1, max: 5 },
  { name: 'impact', label: 'Impact (1-5)', type: 'number', required: true, min: 1, max: 5 },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [
    { value: 'open', label: 'Open' }, { value: 'mitigated', label: 'Mitigated' }, { value: 'accepted', label: 'Accepted' }, { value: 'transferred', label: 'Transferred' }, { value: 'closed', label: 'Closed' },
  ]},
  { name: 'mitigation_plan', label: 'Mitigation Plan', type: 'textarea', placeholder: 'Mitigation strategy...', max: 5000 },
];
const riskStatusOptions = riskFields.find(f => f.name === 'status')!.options!;

function RiskRegisterPage() {
  const [view, setView] = useState<'matrix' | 'table'>('matrix');
  const navigate = useNavigate();
  const { data: risks, loading, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('risks');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { sorted, sort, toggle: toggleSort } = useTableSort(risks, 'risk_score', 'desc');
  const riskIds = useMemo(() => risks.map(r => r.id), [risks]);
  const pagination = usePagination(sorted);
  const bulk = useBulkSelection(riskIds);

  const matrix = useMemo(() => {
    const m: Record<string, typeof risks> = {};
    for (let l = 1; l <= 5; l++) for (let i = 1; i <= 5; i++) m[`${l}-${i}`] = risks.filter(r => r.likelihood === l && r.impact === i);
    return m;
  }, [risks]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-foreground">Risk Register</h1><p className="text-sm text-muted-foreground">{risks.length} identified risks</p></div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-secondary rounded-md p-0.5">
            <button onClick={() => setView('matrix')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${view === 'matrix' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Matrix</button>
            <button onClick={() => setView('table')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Table</button>
          </div>
          <button onClick={() => exportToCsv('risks', filtered as Record<string, unknown>[], [
              { key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'risk_score', label: 'Score' },
              { key: 'likelihood', label: 'Likelihood' }, { key: 'impact', label: 'Impact' }, { key: 'status', label: 'Status' }, { key: 'mitigation_plan', label: 'Mitigation' },
            ])} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"><Plus className="h-4 w-4" /> Add Risk</button>
        </div>
      </div>

      {view === 'matrix' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Risk Heat Map — Likelihood × Impact</h3>
          <div className="flex gap-2">
            <div className="flex flex-col-reverse justify-between py-1 pr-2">{[1,2,3,4,5].map(l => <div key={l} className="h-16 flex items-center text-xs text-muted-foreground">{l}</div>)}<div className="h-6" /></div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1">{[5,4,3,2,1].map(likelihood => [1,2,3,4,5].map(impact => {
                const cellRisks = matrix[`${likelihood}-${impact}`] || []; const score = likelihood * impact;
                const bg = score >= 15 ? 'bg-severity-critical/20 border-severity-critical/30' : score >= 10 ? 'bg-severity-high/20 border-severity-high/30' : score >= 6 ? 'bg-severity-medium/20 border-severity-medium/30' : 'bg-status-passing/10 border-status-passing/20';
                return <div key={`${likelihood}-${impact}`} className={`h-16 rounded border ${bg} flex items-center justify-center text-xs transition-all ${cellRisks.length > 0 ? 'cursor-pointer hover:scale-105' : ''}`} title={cellRisks.map(r => r.title).join('\n') || `L${likelihood} × I${impact}`}>
                  {cellRisks.length > 0 && <span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreColor(score)}`}>{cellRisks.length}</span>}
                </div>;
              }))}</div>
              <div className="grid grid-cols-5 gap-1 mt-1">{[1,2,3,4,5].map(i => <div key={i} className="text-center text-xs text-muted-foreground">{i}</div>)}</div>
              <div className="text-center text-xs text-muted-foreground mt-1">Impact →</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">← Likelihood</div>
        </div>
      )}

      <BulkActionBar count={bulk.count} onClear={bulk.clear} onBulkDelete={() => bulkRemove([...bulk.selected])}
        statusOptions={riskStatusOptions} onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })} entityName="risk" />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left">
            <th className="px-3 py-3 w-10"><input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }} onChange={bulk.toggleAll} className="rounded border-border" /></th>
            <SortableHeader label="Title" column="title" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <SortableHeader label="Category" column="category" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <SortableHeader label="Score" column="risk_score" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <SortableHeader label="L" column="likelihood" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <SortableHeader label="I" column="impact" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Actions</th>
          </tr></thead>
          <tbody>{pagination.paged.map(r => (
            <tr key={r.id} className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${bulk.isSelected(r.id) ? 'bg-primary/5' : ''}`}
              onClick={() => navigate({ to: '/risk-register/$riskId', params: { riskId: r.id } })}>
              <td className="px-3 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={bulk.isSelected(r.id)} onChange={() => bulk.toggle(r.id)} className="rounded border-border" /></td>
              <td className="px-4 py-3"><div className="font-medium text-foreground">{r.title}</div><div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div></td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{r.category}</td>
              <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreColor(r.risk_score)}`}>{r.risk_score ?? '—'}</span></td>
              <td className="px-4 py-3 text-center text-muted-foreground">{r.likelihood}</td><td className="px-4 py-3 text-center text-muted-foreground">{r.impact}</td>
              <td className="px-4 py-3"><span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[r.status] ?? 'bg-muted text-muted-foreground'}`}>{r.status}</span></td>
              <td className="px-4 py-3"><div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditing({ title: r.title, description: r.description, category: r.category, likelihood: r.likelihood, impact: r.impact, status: r.status, mitigation_plan: r.mitigation_plan, _id: r.id }); setFormOpen(true); }} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleteTarget({ id: r.id, title: r.title })} className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
        {risks.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No risks recorded yet.</div>}
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>
      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit Risk' : 'Add Risk'} fields={riskFields} initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />
      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title={deleteTarget?.title ?? 'risk'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
  );
}
