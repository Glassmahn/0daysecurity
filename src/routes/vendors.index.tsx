import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { Search, Loader2, Plus, Building2, ShieldCheck, ShieldAlert, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';

const vendorsSearchSchema = z.object({
  riskTier: fallback(z.string(), 'all').default('all'),
  status: fallback(z.string(), 'all').default('all'),
  q: fallback(z.string(), '').default(''),
});

export const Route = createFileRoute('/vendors/')({
  component: VendorsIndexPage,
  validateSearch: zodValidator(vendorsSearchSchema),
  head: () => ({
    meta: [
      { title: 'Vendors — WatchDog Security' },
      { name: 'description', content: 'Third-party vendor risk management' },
    ],
  }),
});

function riskTierBadge(tier: string | null) {
  const map: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = { critical: 'destructive', high: 'default', medium: 'secondary', low: 'outline' };
  return <Badge variant={map[tier ?? ''] ?? 'outline'} className="capitalize text-xs">{tier ?? 'unknown'}</Badge>;
}

function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    active: { variant: 'default', label: 'Active' },
    under_review: { variant: 'secondary', label: 'Under Review' },
    suspended: { variant: 'destructive', label: 'Suspended' },
    offboarded: { variant: 'outline', label: 'Offboarded' },
  };
  const s = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
}

const vendorFields: FieldDef[] = [
  { name: 'name', label: 'Vendor Name', type: 'text', required: true, placeholder: 'Company name', max: 255 },
  { name: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'contact@vendor.com' },
  {
    name: 'risk_tier', label: 'Risk Tier', type: 'select', required: true,
    options: [
      { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' },
    ],
  },
  {
    name: 'status', label: 'Status', type: 'select', required: true,
    options: [
      { value: 'active', label: 'Active' }, { value: 'under_review', label: 'Under Review' },
      { value: 'suspended', label: 'Suspended' }, { value: 'offboarded', label: 'Offboarded' },
    ],
  },
  { name: 'contract_value', label: 'Contract Value ($)', type: 'number', min: 0 },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...', max: 2000 },
];

function VendorsIndexPage() {
  const navigate = useNavigate({ from: '/vendors/' });
  const { riskTier: riskTierFilter, status: statusFilter, q: search } = Route.useSearch();
  const { data: vendors, loading, insert, update, remove } = useSupabaseCrud('vendors');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const updateSearch = (updates: Record<string, string>) => {
    navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...updates }) });
  };

  const filtered = useMemo(() => {
    return vendors.filter(v => {
      if (riskTierFilter !== 'all' && v.risk_tier !== riskTierFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (search) return v.name.toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [vendors, riskTierFilter, statusFilter, search]);

  const activeCount = vendors.filter(v => v.status === 'active').length;
  const underReview = vendors.filter(v => v.status === 'under_review').length;
  const expiringContracts = vendors.filter(v => {
    if (!v.contract_expiry) return false;
    const daysLeft = Math.ceil((new Date(v.contract_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 90;
  }).length;

  const activeFilterCount = [riskTierFilter, statusFilter].filter(f => f !== 'all').length + (search ? 1 : 0);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <p className="text-sm text-muted-foreground">Third-party vendor risk management</p>
        </div>
        <div className="flex gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate({ search: { riskTier: 'all', status: 'all', q: '' } })}>
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </Button>
          )}
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-1" />Add Vendor</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary/40 transition-all" onClick={() => navigate({ search: { riskTier: 'all', status: 'all', q: '' } })}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{vendors.length}</p><p className="text-xs text-muted-foreground">Total Vendors</p></div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:border-primary/40 transition-all ${statusFilter === 'active' ? 'border-primary ring-1 ring-primary/30' : ''}`} onClick={() => updateSearch({ status: statusFilter === 'active' ? 'all' : 'active' })}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><ShieldCheck className="h-5 w-5 text-green-500" /></div>
            <div><p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-muted-foreground">Active</p></div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:border-primary/40 transition-all ${statusFilter === 'under_review' ? 'border-primary ring-1 ring-primary/30' : ''}`} onClick={() => updateSearch({ status: statusFilter === 'under_review' ? 'all' : 'under_review' })}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><ShieldAlert className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold">{underReview}</p><p className="text-xs text-muted-foreground">Under Review</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><AlertTriangle className="h-5 w-5 text-yellow-500" /></div>
            <div><p className="text-2xl font-bold">{expiringContracts}</p><p className="text-xs text-muted-foreground">Expiring Soon</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Vendor Directory</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search vendors..." className="pl-8 h-9" value={search} onChange={e => updateSearch({ q: e.target.value })} />
              </div>
              <select value={riskTierFilter} onChange={e => updateSearch({ riskTier: e.target.value })}
                className={`bg-card border rounded-lg px-3 py-1.5 text-sm text-foreground h-9 focus:outline-none focus:ring-2 focus:ring-primary/50 ${riskTierFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
                <option value="all">All Risk Tiers</option>
                <option value="critical">Critical</option><option value="high">High</option>
                <option value="medium">Medium</option><option value="low">Low</option>
              </select>
              <select value={statusFilter} onChange={e => updateSearch({ status: e.target.value })}
                className={`bg-card border rounded-lg px-3 py-1.5 text-sm text-foreground h-9 focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option><option value="under_review">Under Review</option>
                <option value="suspended">Suspended</option><option value="offboarded">Offboarded</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">{filtered.length} vendors matching filters</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead><TableHead>Risk Tier</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Contract Expiry</TableHead>
                <TableHead>Status</TableHead><TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(v => (
                <TableRow key={v.id} className="cursor-pointer" onClick={() => navigate({ to: '/vendors/$vendorId', params: { vendorId: v.id } })}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold">{v.name.charAt(0)}</div>
                      <p className="font-medium text-sm">{v.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>{riskTierBadge(v.risk_tier)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{v.contact_email ?? '—'}</TableCell>
                  <TableCell className="text-sm font-mono hidden lg:table-cell">
                    {v.contract_expiry ? new Date(v.contract_expiry).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>{statusBadge(v.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditing({ name: v.name, contact_email: v.contact_email, risk_tier: v.risk_tier, status: v.status, contract_value: v.contract_value, notes: v.notes, _id: v.id }); setFormOpen(true); }}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget({ id: v.id, title: v.name })}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No vendors match the current filters.{' '}
                    <button onClick={() => navigate({ search: { riskTier: 'all', status: 'all', q: '' } })} className="text-primary hover:underline cursor-pointer">Clear filters</button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title={editing ? 'Edit Vendor' : 'Add Vendor'} fields={vendorFields}
        initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'vendor'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
  );
}
