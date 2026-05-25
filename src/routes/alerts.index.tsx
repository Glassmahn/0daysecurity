import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Fragment, useMemo, useState, useEffect } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { SEVERITY, SEVERITY_LEVELS } from '@/lib/constants';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, Plus, Pencil, Trash2, Download, AlertTriangle, Filter, AlertCircle, ChevronDown, ChevronRight, User, Monitor, Shield } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
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
import { WriteGuard, RouteGuard } from '@/components/guards/RoleGuards';

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
      { title: 'Alerts — ZeroDay Security' },
      { name: 'description', content: 'Security alerts queue and triage' },
    ],
  }),
});

const severityStyles: Record<string, string> = {
  critical: 'bg-severity-critical/12 text-severity-critical',
  high: 'bg-severity-high/12 text-severity-high',
  medium: 'bg-severity-medium/12 text-severity-medium',
  low: 'bg-severity-low/12 text-severity-low',
  info: 'bg-severity-info/12 text-severity-info',
};

const statusStyles: Record<string, string> = {
  new: 'bg-status-failing/12 text-status-failing',
  acknowledged: 'bg-status-warning/12 text-status-warning',
  resolved: 'bg-status-passing/12 text-status-passing',
  dismissed: 'bg-muted text-muted-foreground',
};

const alertStatusOptions = [
  { value: 'new', label: 'New' }, { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' }, { value: 'dismissed', label: 'Dismissed' },
];

function AlertsPage() {
  const navigate = useNavigate({ from: '/alerts/' });
  const { severity: severityFilter, status: statusFilter, q: search } = Route.useSearch();
  const { data: alerts, loading, error, refetch, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('alerts');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [personnel, setPersonnel] = useState<{ id: string; name: string }[]>([]);
  const [assetNames, setAssetNames] = useState<Record<string, string>>({});
  const [controlNames, setControlNames] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('personnel').select('id, name').order('name').then(({ data }) => setPersonnel(data ?? []));
  }, []);

  function resolveName(id: string | null, map: Record<string, string>): string {
    return id ? map[id] ?? id.slice(0, 8) : '—';
  }

  async function handleAssign(alertId: string, userId: string) {
    const ok = await update(alertId, { assigned_to: userId || null });
    if (ok) refetch();
  }

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
    [SEVERITY.CRITICAL]: alerts.filter(a => a.severity === SEVERITY.CRITICAL).length,
    [SEVERITY.HIGH]: alerts.filter(a => a.severity === SEVERITY.HIGH).length,
    [SEVERITY.MEDIUM]: alerts.filter(a => a.severity === SEVERITY.MEDIUM).length,
    [SEVERITY.LOW]: alerts.filter(a => a.severity === SEVERITY.LOW).length,
  }), [alerts]);

  const personnelOpts = personnel.map(p => ({ value: p.id, label: p.name }));
  const controlOpts: { value: string; label: string }[] = [];
  const assetOpts: { value: string; label: string }[] = [];

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
      name: 'status', label: 'Status', type: 'select', required: true, options: alertStatusOptions,
    },
    { name: 'source', label: 'Source', type: 'text', placeholder: 'e.g. security, infrastructure', max: 100 },
    { name: 'assigned_to', label: 'Assign To', type: 'select', options: personnelOpts },
    { name: 'affected_control_id', label: 'Affected Control', type: 'select', options: controlOpts },
    { name: 'affected_asset_id', label: 'Affected Asset', type: 'select', options: assetOpts },
  ];

  async function loadRelated(alert: any) {
    if (alert.affected_asset_id && !assetNames[alert.affected_asset_id]) {
      const { data } = await supabase.from('assets').select('id, name').eq('id', alert.affected_asset_id).maybeSingle();
      if (data) setAssetNames(prev => ({ ...prev, [data.id]: data.name }));
    }
    if (alert.affected_control_id && !controlNames[alert.affected_control_id]) {
      const { data } = await supabase.from('controls').select('id, code, title').eq('id', alert.affected_control_id).maybeSingle();
      if (data) setControlNames(prev => ({ ...prev, [data.id]: `${data.code} — ${data.title}` }));
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-destructive">Failed to load alerts</p>
        <p className="text-xs text-muted-foreground max-w-md text-center">{error}</p>
        <button onClick={refetch} className="text-xs text-primary hover:underline cursor-pointer">Try again</button>
      </div>
    );
  }

  if (loading && !alerts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading alerts…</p>
      </div>
    );
  }

  return (
    <RouteGuard allowedRoles={['admin', 'analyst']}>
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Alerts</h1>
            <p className="text-sm text-muted-foreground">{alerts.length} total alerts{loading && <span className="inline-flex items-center gap-1 ml-2 text-xs"><Loader2 className="h-3 w-3 animate-spin" />refreshing</span>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={() => navigate({ search: { severity: 'all', status: 'all', q: '' } })}
              className="text-xs text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium">
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => exportToCsv('alerts', filtered as Record<string, unknown>[], [
              { key: 'title', label: 'Title' }, { key: 'severity', label: 'Severity' }, { key: 'status', label: 'Status' },
              { key: 'source', label: 'Source' }, { key: 'message', label: 'Message' }, { key: 'created_at', label: 'Created' },
              { key: 'assigned_to', label: 'Assigned To' },
            ])} className="flex items-center gap-1.5 px-3.5 py-2 border border-border/60 rounded-xl text-sm font-medium hover:bg-accent hover:border-primary/30 transition-all text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <WriteGuard>
            <button onClick={() => { setEditing(null); setFormOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-glow transition-all">
              <Plus className="h-4 w-4" /> New Alert
            </button>
          </WriteGuard>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {SEVERITY_LEVELS.map(sev => (
          <button key={sev} onClick={() => updateSearch({ severity: severityFilter === sev ? 'all' : sev })}
            className={`bg-card border rounded-xl p-4 text-left hover:border-primary/40 hover:shadow-glow transition-all cursor-pointer ${severityFilter === sev ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
            <div className={`text-2xl font-display font-bold ${severityFilter === sev ? 'text-primary' : ''}`}>{severityCounts[sev]}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`h-2 w-2 rounded-full ${sev === 'critical' ? 'bg-severity-critical' : sev === 'high' ? 'bg-severity-high' : sev === 'medium' ? 'bg-severity-medium' : 'bg-severity-low'}`} />
              <span className="text-[11px] text-muted-foreground font-medium capitalize">{sev}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" aria-label="Search alerts" placeholder="Search alerts..." value={search} onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />
        </div>
        <select value={severityFilter} onChange={e => updateSearch({ severity: e.target.value })}
          className={`bg-card border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${severityFilter !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option><option value="high">High</option>
          <option value="medium">Medium</option><option value="low">Low</option><option value="info">Info</option>
        </select>
        <select value={statusFilter} onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${statusFilter !== 'all' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/60'}`}>
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

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left bg-surface/50">
              <th scope="col" className="px-3 py-3.5 w-10">
                <input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                  onChange={bulk.toggleAll} className="rounded-md border-border" />
              </th>
              <th scope="col" className="px-2 py-3.5 w-8"></th>
              <SortableHeader label="Severity" column="severity" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Title" column="title" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Source" column="source" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
              <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Assigned" column="assigned_to" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden lg:table-cell" />
              <SortableHeader label="Age" column="created_at" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paged.map(alert => (
              <Fragment key={alert.id}>
                <tr className={`border-b border-border/40 hover:bg-primary/[0.03] transition-colors cursor-pointer ${bulk.isSelected(alert.id) ? 'bg-primary/5' : ''} ${expandedId === alert.id ? 'bg-primary/[0.02]' : ''}`}
                  onClick={() => {
                    const next = expandedId === alert.id ? null : alert.id;
                    setExpandedId(next);
                    if (next) loadRelated(alert);
                  }}>
                  <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={bulk.isSelected(alert.id)} onChange={() => bulk.toggle(alert.id)} className="rounded-md border-border" />
                  </td>
                  <td className="px-2 py-3.5 text-muted-foreground">
                    {expandedId === alert.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${severityStyles[alert.severity] ?? ''}`}>{alert.severity}</span>
                  </td>
                  <td className="px-4 py-3.5 text-foreground font-medium">{alert.title}</td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{alert.source ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusStyles[alert.status] ?? ''}`}>{alert.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">{resolveName(alert.assigned_to, personMap(personnel))}</td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs">{formatDistanceToNow(new Date(alert.created_at), { addSuffix: false })}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <WriteGuard>
                        <button onClick={() => { setEditing({ title: alert.title, message: alert.message, severity: alert.severity, status: alert.status, source: alert.source, assigned_to: alert.assigned_to ?? '', affected_control_id: alert.affected_control_id ?? '', affected_asset_id: alert.affected_asset_id ?? '', _id: alert.id }); setFormOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget({ id: alert.id, title: alert.title })}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </WriteGuard>
                    </div>
                  </td>
                </tr>
                {expandedId === alert.id && (
                  <tr className="border-b border-border/40 bg-surface/30">
                    <td colSpan={9} className="p-0">
                      <div className="px-12 py-4 space-y-3 animate-slide-in">
                        {alert.message && (
                          <div>
                            <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Description</p>
                            <p className="text-sm text-foreground bg-card border border-border/60 rounded-lg p-3">{alert.message}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-card border border-border/60 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase mb-1">
                              <User className="h-3 w-3" /> Assigned To
                            </div>
                            <select
                              value={alert.assigned_to ?? ''}
                              onChange={e => handleAssign(alert.id, e.target.value)}
                              className="w-full mt-1 px-2 py-1.5 text-sm bg-background border border-border/60 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                              onClick={e => e.stopPropagation()}
                            >
                              <option value="">Unassigned</option>
                              {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div className="bg-card border border-border/60 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase mb-1">
                              <Shield className="h-3 w-3" /> Affected Control
                            </div>
                            <p className="text-sm text-foreground mt-1">{resolveName(alert.affected_control_id, controlNames)}</p>
                          </div>
                          <div className="bg-card border border-border/60 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold uppercase mb-1">
                              <Monitor className="h-3 w-3" /> Affected Asset
                            </div>
                            <p className="text-sm text-foreground mt-1">{resolveName(alert.affected_asset_id, assetNames)}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
              <Filter className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p>No alerts match the current filters.</p>
            <button onClick={() => navigate({ search: { severity: 'all', status: 'all', q: '' } })} className="text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium text-xs">Clear filters</button>
          </div>
        )}
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title={editing ? 'Edit Alert' : 'New Alert'} fields={alertFields}
        initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals; if (_id) return update(String(_id), data); return insert(data); }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'alert'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
    </RouteGuard>
  );
}

function personMap(personnel: { id: string; name: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of personnel) map[p.id] = p.name;
  return map;
}


