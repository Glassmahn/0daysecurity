import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Monitor, Search, Plus, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { RouteGuard } from '@/components/guards/RoleGuards';
import { EntityFormDialog } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import type { Tables } from '@/integrations/supabase/types';

export const Route = createFileRoute('/assets/')({
  component: AssetsPage,
  head: () => ({
    meta: [
      { title: 'Assets \u2014 ZeroDay Security' },
      { name: 'description', content: 'Monitored assets inventory' },
    ],
  }),
});

function riskColor(score: string | null) {
  if (score === 'critical') return 'bg-severity-critical';
  if (score === 'high') return 'bg-severity-high';
  if (score === 'medium') return 'bg-severity-medium';
  return 'bg-status-passing';
}

function riskValue(score: string | null) {
  if (score === 'critical') return 85;
  if (score === 'high') return 70;
  if (score === 'medium') return 45;
  return 20;
}

const typeStyles: Record<string, string> = {
  server: 'bg-chart-1/12 text-chart-1',
  database: 'bg-chart-5/12 text-chart-5',
  cloud_resource: 'bg-chart-3/12 text-chart-3',
  saas_app: 'bg-chart-4/12 text-chart-4',
  device: 'bg-primary/12 text-primary',
  data_store: 'bg-chart-2/12 text-chart-2',
};

const assetFieldDefs = [
  { name: 'name', label: 'Name', type: 'text' as const, required: true, placeholder: 'Asset name' },
  { name: 'type', label: 'Type', type: 'select' as const, options: [
    { value: 'server', label: 'Server' },
    { value: 'saas_app', label: 'SaaS App' },
    { value: 'database', label: 'Database' },
    { value: 'cloud_resource', label: 'Cloud Resource' },
    { value: 'device', label: 'Device' },
    { value: 'data_store', label: 'Data Store' },
  ]},
  { name: 'data_classification', label: 'Data Classification', type: 'select' as const, options: [
    { value: 'public', label: 'Public' },
    { value: 'internal', label: 'Internal' },
    { value: 'confidential', label: 'Confidential' },
    { value: 'restricted', label: 'Restricted' },
    { value: 'pii', label: 'PII' },
  ]},
  { name: 'criticality', label: 'Criticality', type: 'select' as const, options: [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]},
  { name: 'status', label: 'Status', type: 'select' as const, options: [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'decommissioned', label: 'Decommissioned' },
  ]},
  { name: 'ip_address', label: 'IP Address', type: 'text' as const, placeholder: '10.0.0.1' },
  { name: 'location', label: 'Location', type: 'text' as const, placeholder: 'us-east-1' },
];

function AssetsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Tables<'assets'> | null>(null);


  const { data: dbAssets, loading, error, refetch, insert, update, remove } = useSupabaseCrud('assets', 'name', true);

  const assets = dbAssets ?? [];
  const types = ['all', ...Array.from(new Set(assets.map(a => String(a.type ?? ''))))];

  const filtered = assets.filter(a => {
    const name = String(a.name ?? '');
    const type = String(a.type ?? '');
    return name.toLowerCase().includes(search.toLowerCase()) && (typeFilter === 'all' || type === typeFilter);
  });

  async function handleSubmit(values: Record<string, unknown>) {
    if (editAsset) {
      return update(editAsset.id, values);
    }
    return insert(values);
  }

  function handleEdit(a: Tables<'assets'>) {
    setEditAsset(a);
    setDialogOpen(true);
  }

  const [deleteAsset, setDeleteAsset] = useState<any>(null);

  function handleDelete(a: Tables<'assets'>) {
    setDeleteAsset(a);
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-destructive">Failed to load assets</p>
        <p className="text-xs text-muted-foreground max-w-md text-center">{error}</p>
        <button onClick={refetch} className="text-xs text-primary hover:underline cursor-pointer">Try again</button>
      </div>
    );
  }

  return (
    <RouteGuard allowedRoles={['admin', 'analyst']}>
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Assets</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} of {assets.length} monitored assets{loading && <span className="inline-flex items-center gap-1 ml-2 text-xs"><Loader2 className="h-3 w-3 animate-spin" />refreshing</span>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              aria-label="Search assets"
              placeholder="Search assets\u2026"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-48"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-sm bg-surface border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            {types.map((t: string) => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button
            onClick={() => { setEditAsset(null); setDialogOpen(true); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Asset
          </button>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
        {loading && dbAssets.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left bg-surface/50">
                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Name</th>
                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Type</th>
                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Location</th>
                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Status</th>
                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Criticality</th>
                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">IP Address</th>
                <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {assets.length === 0
                          ? 'No assets yet'
                          : 'No assets match the current filters'}
                      </p>
                      {(search || typeFilter !== 'all') && (
                        <button
                          onClick={() => { setSearch(''); setTypeFilter('all'); }}
                          className="text-xs text-primary hover:underline cursor-pointer"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(a => {
                const aId = a.id;
                const aName = a.name;
                const aType = a.type ?? 'unknown';
                const aLocation = a.location;
                const aStatus = a.status ?? 'unknown';
                const aCrit = a.criticality;
                const aIp = a.ip_address;
                return (
                <tr key={aId} tabIndex={0} role="link" className="border-b border-border/40 hover:bg-primary/[0.03] transition-colors"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate({ to: '/assets/$assetId', params: { assetId: aId } }); } }}>
                  <td className="px-4 py-3.5 font-medium text-foreground cursor-pointer"
                    onClick={() => navigate({ to: '/assets/$assetId', params: { assetId: aId } })}>
                    {aName}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${typeStyles[aType] || 'bg-muted text-muted-foreground'}`}>
                      {aType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{aLocation || '\u2014'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      aStatus === 'active' ? 'bg-status-passing/15 text-status-passing' :
                      aStatus === 'inactive' ? 'bg-muted text-muted-foreground' :
                      aStatus === 'maintenance' ? 'bg-status-warning/15 text-status-warning' :
                      'bg-severity-critical/15 text-severity-critical'
                    }`}>{aStatus}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${riskColor(aCrit)}`} style={{ width: `${riskValue(aCrit)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{aCrit ?? '\u2014'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{aIp || '\u2014'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(a)} className="p-1.5 hover:bg-accent rounded-md transition-colors" title="Edit">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(a)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              }))}
            </tbody>
          </table>
        )}
      </div>

      <EntityFormDialog
        open={dialogOpen}
        onOpenChange={(o: boolean) => { setDialogOpen(o); if (!o) setEditAsset(null); }}
        title={editAsset ? 'Edit Asset' : 'Add Asset'}
        fields={assetFieldDefs}
        initialValues={editAsset ? Object.fromEntries(assetFieldDefs.map(f => [f.name, (editAsset as Record<string, unknown>)[f.name] ?? ''])) : undefined}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={!!deleteAsset}
        onOpenChange={(o: boolean) => { if (!o) setDeleteAsset(null); }}
        title="Delete Asset"
        description={`Are you sure you want to delete "${deleteAsset?.name}"? This action cannot be undone.`}
        onConfirm={async () => {
          if (deleteAsset) {
            const ok = await remove(deleteAsset.id);
            if (ok) setDeleteAsset(null);
            return ok;
          }
          return false;
        }}
      />
    </div>
    </RouteGuard>
  );
}
