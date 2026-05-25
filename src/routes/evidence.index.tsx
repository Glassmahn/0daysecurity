import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, type ElementType } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, CheckCircle, Clock, XCircle, AlertTriangle, FileText, Plus, Pencil, Trash2, Download, Paperclip, Filter, AlertCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
      { title: 'Evidence — ZeroDay Security' },
      { name: 'description', content: 'Evidence management and collection' },
    ],
  }),
});

const statusConfig: Record<string, { style: string; icon: ElementType; label: string }> = {
  valid: { style: 'bg-status-passing/12 text-status-passing', icon: CheckCircle, label: 'Valid' },
  pending_review: { style: 'bg-status-in-progress/12 text-status-in-progress', icon: Clock, label: 'Pending Review' },
  expired: { style: 'bg-status-failing/12 text-status-failing', icon: XCircle, label: 'Expired' },
  rejected: { style: 'bg-muted text-muted-foreground', icon: AlertTriangle, label: 'Rejected' },
  needs_recollection: { style: 'bg-chart-5/15 text-chart-5', icon: AlertTriangle, label: 'Needs Recollection' },
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
  { name: 'file_url', label: 'Attach File', type: 'file' },
];

const evidenceStatusOptions = evidenceFields.find(f => f.name === 'status')!.options!;

function EvidencePage() {
  const navigate = useNavigate({ from: '/evidence/' });
  const { status: statusFilter, type: typeFilter, source: sourceFilter, q: search } = Route.useSearch();
  const { data: evidence, loading, error, refetch, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('evidence');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [packageDialog, setPackageDialog] = useState<{ open: boolean; loading: boolean; url: string | null; error: string | null }>({ open: false, loading: false, url: null, error: null });

  const filtered = useMemo(() => {
    return evidence.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-destructive">Failed to load evidence</p>
        <p className="text-xs text-muted-foreground max-w-md text-center">{error}</p>
        <button onClick={refetch} className="text-xs text-primary hover:underline cursor-pointer">Try again</button>
      </div>
    );
  }

  if (loading && !evidence.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading evidence…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Paperclip className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Evidence</h1>
            <p className="text-sm text-muted-foreground">{evidence.length} items collected{loading && <span className="inline-flex items-center gap-1 ml-2 text-xs"><Loader2 className="h-3 w-3 animate-spin" />refreshing</span>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={() => navigate({ search: { status: 'all', type: 'all', source: 'all', q: '' } })}
              className="text-xs text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium">
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => exportToCsv('evidence', filtered as Record<string, unknown>[], [
              { key: 'title', label: 'Title' }, { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' },
              { key: 'source', label: 'Source' }, { key: 'collected_at', label: 'Collected' }, { key: 'expires_at', label: 'Expires' },
            ])} className="flex items-center gap-1.5 px-3.5 py-2 border border-border/60 rounded-xl text-sm font-medium hover:bg-accent hover:border-primary/30 transition-all text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={async () => {
            setPackageDialog({ open: true, loading: true, url: null, error: null });
            const { data, error: fnError } = await supabase.functions.invoke('generate-evidence-package', { body: {} });
            if (fnError) setPackageDialog({ open: true, loading: false, url: null, error: fnError.message });
            else setPackageDialog({ open: true, loading: false, url: data.url, error: null });
          }} className="flex items-center gap-1.5 px-3.5 py-2 border border-border/60 rounded-xl text-sm font-medium hover:bg-accent hover:border-primary/30 transition-all text-foreground">
            <Package className="h-4 w-4" /> Export Package
          </button>
          <WriteGuard>
            <button onClick={() => { setEditing(null); setFormOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-glow transition-all">
              <Plus className="h-4 w-4" /> Add Evidence
            </button>
          </WriteGuard>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {([
          { key: 'all', label: 'Total', value: stats.total, color: '' },
          { key: 'valid', label: 'Valid', value: stats.valid, color: 'text-status-passing' },
          { key: 'pending_review', label: 'Pending', value: stats.pending, color: 'text-status-in-progress' },
          { key: 'expired', label: 'Expired', value: stats.expired, color: 'text-status-failing' },
        ] as const).map(item => (
          <button key={item.key} onClick={() => updateSearch({ status: statusFilter === item.key ? 'all' : item.key })}
            className={`bg-card border rounded-xl p-4 text-left hover:border-primary/40 hover:shadow-glow transition-all cursor-pointer ${statusFilter === item.key && item.key !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
            <div className={`text-2xl font-display font-bold ${item.color || 'text-foreground'}`}>{item.value}</div>
            <div className="text-[11px] text-muted-foreground font-medium mt-1">{item.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" aria-label="Search evidence" placeholder="Search evidence..." value={search} onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${statusFilter !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
          <option value="all">All Statuses</option>
          <option value="valid">Valid</option><option value="pending_review">Pending Review</option>
          <option value="expired">Expired</option><option value="rejected">Rejected</option><option value="needs_recollection">Needs Recollection</option>
        </select>
        {usedTypes.length > 1 && (
          <select value={typeFilter} onChange={e => updateSearch({ type: e.target.value })}
            className={`bg-card border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${typeFilter !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
            <option value="all">All Types</option>
            {usedTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        )}
        <select value={sourceFilter} onChange={e => updateSearch({ source: e.target.value })}
          className={`bg-card border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${sourceFilter !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
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

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left bg-surface/50">
              <th scope="col" className="px-3 py-3.5 w-10">
                <input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                  onChange={bulk.toggleAll} className="rounded-md border-border" />
              </th>
              <SortableHeader label="Title" column="title" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Type" column="type" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Source" column="source" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
              <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Collected" column="collected_at" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden lg:table-cell" />
              <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paged.map(e => {
              const sc = statusConfig[e.status] ?? statusConfig.valid;
              const StatusIcon = sc.icon;
              return (
                <tr key={e.id} className={`border-b border-border/40 hover:bg-primary/[0.03] transition-colors cursor-pointer ${bulk.isSelected(e.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => navigate({ to: '/evidence/$evidenceId', params: { evidenceId: e.id } })}>
                  <td className="px-3 py-3.5" onClick={ev => ev.stopPropagation()}>
                    <input type="checkbox" checked={bulk.isSelected(e.id)} onChange={() => bulk.toggle(e.id)} className="rounded-md border-border" />
                  </td>
                  <td className="px-4 py-3.5 text-foreground font-medium">
                    {e.title}
                    {e.file_url && <Paperclip className="h-3 w-3 inline ml-1.5 text-muted-foreground" />}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">{e.type.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{e.source ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-md ${sc.style}`}>
                      <StatusIcon className="h-3 w-3" />{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                    {e.collected_at ? new Date(e.collected_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1" onClick={ev => ev.stopPropagation()}>
                      <WriteGuard>
                        <button onClick={() => { setEditing({ title: e.title, type: e.type, status: e.status, source: e.source, _id: e.id }); setFormOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget({ id: e.id, title: e.title })}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </WriteGuard>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
              <Filter className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p>No evidence matches the current filters.</p>
            <button onClick={() => navigate({ search: { status: 'all', type: 'all', source: 'all', q: '' } })} className="text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium text-xs">Clear filters</button>
          </div>
        )}
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title={editing ? 'Edit Evidence' : 'Add Evidence'} fields={evidenceFields}
        initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals; if (_id) return update(String(_id), data); return insert(data); }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'evidence'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />

      {packageDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="evidence-package-title" onClick={() => setPackageDialog({ ...packageDialog, open: false })}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-2" id="evidence-package-title">Evidence Package</h3>
            {packageDialog.loading && (
              <div className="flex items-center gap-3 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating evidence package...</p>
              </div>
            )}
            {packageDialog.error && (
              <div className="py-4">
                <p className="text-sm text-destructive mb-2">Failed to generate package</p>
                <p className="text-xs text-muted-foreground">{packageDialog.error}</p>
              </div>
            )}
            {packageDialog.url && (
              <div className="py-4 space-y-3">
                <p className="text-sm text-status-passing">Package generated successfully!</p>
                <a href={packageDialog.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors w-fit">
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </div>
            )}
            <button onClick={() => setPackageDialog({ ...packageDialog, open: false })}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
