import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, Plus, Building2, ShieldCheck, ShieldAlert, AlertTriangle, Pencil, Trash2, Download, Filter, AlertCircle } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { useTableSort } from '@/hooks/use-table-sort';
import { SortableHeader } from '@/components/crud/SortableHeader';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';
import { WriteGuard, RouteGuard } from '@/components/guards/RoleGuards';

const vendorsSearchSchema = z.object({ riskTier: fallback(z.string(), 'all').default('all'), status: fallback(z.string(), 'all').default('all'), q: fallback(z.string(), '').default('') });

export const Route = createFileRoute('/vendors/')({ component: VendorsIndexPage, validateSearch: zodValidator(vendorsSearchSchema),
  head: () => ({ meta: [{ title: 'Vendors — ZeroDay Security' }, { name: 'description', content: 'Third-party vendor risk management' }] }) });

function riskTierBadge(tier: string | null) {
  const map: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = { critical: 'destructive', high: 'default', medium: 'secondary', low: 'outline' };
  return <Badge variant={map[tier ?? ''] ?? 'outline'} className="capitalize text-xs">{tier ?? 'unknown'}</Badge>;
}
function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'default', label: 'Active' }, under_review: { variant: 'secondary', label: 'Under Review' },
    suspended: { variant: 'destructive', label: 'Suspended' }, offboarded: { variant: 'outline', label: 'Offboarded' },
  };
  const s = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
}

const vendorFields: FieldDef[] = [
  { name: 'name', label: 'Vendor Name', type: 'text', required: true, placeholder: 'Company name', max: 255 },
  { name: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'contact@vendor.com' },
  { name: 'risk_tier', label: 'Risk Tier', type: 'select', required: true, options: [{ value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }] },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'active', label: 'Active' }, { value: 'under_review', label: 'Under Review' }, { value: 'suspended', label: 'Suspended' }, { value: 'offboarded', label: 'Offboarded' }] },
  { name: 'contract_value', label: 'Contract Value ($)', type: 'number', min: 0 },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...', max: 2000 },
];
const vendorStatusOptions = vendorFields.find(f => f.name === 'status')!.options!;

function VendorsIndexPage() {
  const navigate = useNavigate({ from: '/vendors/' });
  const { riskTier: riskTierFilter, status: statusFilter, q: search } = Route.useSearch();
  const { data: vendors, loading, error, refetch, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('vendors');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const updateSearch = (updates: Record<string, string>) => { navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...updates }) }); };
  const filtered = useMemo(() => vendors.filter(v => {
    if (riskTierFilter !== 'all' && v.risk_tier !== riskTierFilter) return false;
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (search) return v.name.toLowerCase().includes(search.toLowerCase());
    return true;
  }), [vendors, riskTierFilter, statusFilter, search]);

  const { sorted, sort, toggle: toggleSort } = useTableSort(filtered, 'name', 'asc');
  const pagination = usePagination(sorted);
  const filteredIds = useMemo(() => filtered.map(v => v.id), [filtered]);
  const bulk = useBulkSelection(filteredIds);
  const activeCount = vendors.filter(v => v.status === 'active').length;
  const underReview = vendors.filter(v => v.status === 'under_review').length;
  const expiringContracts = vendors.filter(v => { if (!v.contract_expiry) return false; const d = Math.ceil((new Date(v.contract_expiry).getTime() - Date.now()) / 86400000); return d > 0 && d <= 90; }).length;
  const activeFilterCount = [riskTierFilter, statusFilter].filter(f => f !== 'all').length + (search ? 1 : 0);

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
      <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <p className="text-sm font-medium text-destructive">Failed to load vendors</p>
      <p className="text-xs text-muted-foreground max-w-md text-center">{error}</p>
      <button onClick={refetch} className="text-xs text-primary hover:underline cursor-pointer">Try again</button>
    </div>
  );

  if (loading && !vendors.length) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">Loading vendors…</p>
    </div>
  );

  return (
    <RouteGuard allowedRoles={['admin', 'analyst']}>
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Vendors</h1>
            <p className="text-sm text-muted-foreground">Third-party vendor risk management{loading && <span className="inline-flex items-center gap-1 ml-2 text-xs"><Loader2 className="h-3 w-3 animate-spin" />refreshing</span>}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeFilterCount > 0 && <button onClick={() => navigate({ search: { riskTier: 'all', status: 'all', q: '' } })} className="text-xs text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium">Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</button>}
          <button onClick={() => exportToCsv('vendors', filtered as Record<string, unknown>[], [
              { key: 'name', label: 'Name' }, { key: 'risk_tier', label: 'Risk Tier' }, { key: 'status', label: 'Status' },
              { key: 'contact_email', label: 'Email' }, { key: 'contract_value', label: 'Contract Value' }, { key: 'contract_expiry', label: 'Contract Expiry' },
            ])} className="flex items-center gap-1.5 px-3.5 py-2 border border-border/60 rounded-xl text-sm font-medium hover:bg-accent hover:border-primary/30 transition-all text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <WriteGuard>
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-glow transition-all">
              <Plus className="h-4 w-4" /> Add Vendor
            </button>
          </WriteGuard>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
        <button onClick={() => navigate({ search: { riskTier: 'all', status: 'all', q: '' } })} className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-glow transition-all cursor-pointer">
          <div className="p-2.5 rounded-xl bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-display font-bold">{vendors.length}</p><p className="text-[11px] text-muted-foreground font-medium">Total Vendors</p></div>
        </button>
        <button onClick={() => updateSearch({ status: statusFilter === 'active' ? 'all' : 'active' })} className={`bg-card border rounded-xl p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-glow transition-all cursor-pointer ${statusFilter === 'active' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
          <div className="p-2.5 rounded-xl bg-status-passing/10"><ShieldCheck className="h-5 w-5 text-status-passing" /></div>
          <div><p className="text-2xl font-display font-bold">{activeCount}</p><p className="text-[11px] text-muted-foreground font-medium">Active</p></div>
        </button>
        <button onClick={() => updateSearch({ status: statusFilter === 'under_review' ? 'all' : 'under_review' })} className={`bg-card border rounded-xl p-4 flex items-center gap-3 hover:border-primary/40 hover:shadow-glow transition-all cursor-pointer ${statusFilter === 'under_review' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
          <div className="p-2.5 rounded-xl bg-destructive/10"><ShieldAlert className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-2xl font-display font-bold">{underReview}</p><p className="text-[11px] text-muted-foreground font-medium">Under Review</p></div>
        </button>
        <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-status-warning/10"><AlertTriangle className="h-5 w-5 text-status-warning" /></div>
          <div><p className="text-2xl font-display font-bold">{expiringContracts}</p><p className="text-[11px] text-muted-foreground font-medium">Expiring Soon</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input aria-label="Search vendors" placeholder="Search vendors..." className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" value={search} onChange={e => updateSearch({ q: e.target.value })} />
        </div>
        <select value={riskTierFilter} onChange={e => updateSearch({ riskTier: e.target.value })} className={`bg-card border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${riskTierFilter !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
          <option value="all">All Risk Tiers</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select value={statusFilter} onChange={e => updateSearch({ status: e.target.value })} className={`bg-card border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${statusFilter !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
          <option value="all">All Statuses</option><option value="active">Active</option><option value="under_review">Under Review</option><option value="suspended">Suspended</option><option value="offboarded">Offboarded</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} vendors matching filters</p>

      <BulkActionBar count={bulk.count} onClear={bulk.clear} onBulkDelete={() => bulkRemove([...bulk.selected])}
        statusOptions={vendorStatusOptions} onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })} entityName="vendor" />

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/60 text-left bg-surface/50">
            <th scope="col" className="px-3 py-3.5 w-10"><input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }} onChange={bulk.toggleAll} className="rounded-md border-border" /></th>
            <SortableHeader label="Vendor" column="name" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <SortableHeader label="Risk Tier" column="risk_tier" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <SortableHeader label="Contact" column="contact_email" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
            <SortableHeader label="Contract Expiry" column="contract_expiry" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden lg:table-cell" />
            <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
            <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground w-20">Actions</th>
          </tr></thead>
          <tbody>
            {pagination.paged.map(v => (
              <tr key={v.id} className={`border-b border-border/40 hover:bg-primary/[0.03] transition-colors cursor-pointer ${bulk.isSelected(v.id) ? 'bg-primary/5' : ''}`} onClick={() => navigate({ to: '/vendors/$vendorId', params: { vendorId: v.id } })}>
                <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}><input type="checkbox" checked={bulk.isSelected(v.id)} onChange={() => bulk.toggle(v.id)} className="rounded-md border-border" /></td>
                <td className="px-4 py-3.5"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-xs font-bold text-white">{v.name.charAt(0)}</div><p className="font-medium text-sm text-foreground">{v.name}</p></div></td>
                <td className="px-4 py-3.5">{riskTierBadge(v.risk_tier)}</td>
                <td className="px-4 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{v.contact_email ?? '—'}</td>
                <td className="px-4 py-3.5 text-sm font-mono hidden lg:table-cell">{v.contract_expiry ? new Date(v.contract_expiry).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-3.5">{statusBadge(v.status)}</td>
                <td className="px-4 py-3.5"><div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <WriteGuard>
                    <button onClick={() => { setEditing({ name: v.name, contact_email: v.contact_email, risk_tier: v.risk_tier, status: v.status, contract_value: v.contract_value, notes: v.notes, _id: v.id }); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget({ id: v.id, title: v.name })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </WriteGuard>
                </div></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7}>
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center"><Filter className="h-5 w-5 text-muted-foreground/50" /></div>
                <p>No vendors match filters.</p>
                <button onClick={() => navigate({ search: { riskTier: 'all', status: 'all', q: '' } })} className="text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium text-xs">Clear</button>
              </div>
            </td></tr>}
          </tbody>
        </table>
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>
      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit Vendor' : 'Add Vendor'} fields={vendorFields} initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals; if (_id) return update(String(_id), data); return insert(data); }} />
      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title={deleteTarget?.title ?? 'vendor'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
    </RouteGuard>
  );
}
