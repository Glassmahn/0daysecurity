import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { evidenceItems } from '@/lib/mock-data-extended';
import { evidenceTypes } from '@/lib/framework-catalog';
import { Search, Upload, Zap, AlertTriangle, Clock, CheckCircle, XCircle, FileText, Image, Settings, PenTool, ScrollText, Scan, GraduationCap, UserCheck, ShieldAlert, Building2, GitPullRequest, Database, Network, Ticket, CloudDownload } from 'lucide-react';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';

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
      { name: 'description', content: 'Evidence management with 16 collection types' },
    ],
  }),
});

const statusConfig: Record<string, { style: string; icon: React.ElementType; label: string }> = {
  valid: { style: 'bg-status-passing/15 text-status-passing', icon: CheckCircle, label: 'Valid' },
  expiring: { style: 'bg-status-in-progress/15 text-status-in-progress', icon: Clock, label: 'Expiring' },
  expired: { style: 'bg-status-failing/15 text-status-failing', icon: XCircle, label: 'Expired' },
  rejected: { style: 'bg-muted text-muted-foreground', icon: AlertTriangle, label: 'Rejected' },
};

const typeIcons: Record<string, React.ElementType> = {
  screenshot: Image,
  document: FileText,
  api_pull: CloudDownload,
  config_export: Settings,
  attestation: PenTool,
  log: ScrollText,
  scan_result: Scan,
  training_record: GraduationCap,
  access_review: UserCheck,
  pen_test: ShieldAlert,
  risk_assessment: AlertTriangle,
  vendor_report: Building2,
  code_review: GitPullRequest,
  backup_verification: Database,
  network_diagram: Network,
  change_ticket: Ticket,
};

function EvidencePage() {
  const navigate = useNavigate({ from: '/evidence/' });
  const { status: statusFilter, type: typeFilter, source: autoFilter, q: search } = Route.useSearch();

  const filtered = useMemo(() => {
    return evidenceItems.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      if (autoFilter === 'auto' && !e.autoCollected) return false;
      if (autoFilter === 'manual' && e.autoCollected) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.title.toLowerCase().includes(q) || e.controlRef.toLowerCase().includes(q) || e.source.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter, typeFilter, autoFilter]);

  const updateSearch = (updates: Record<string, string>) => {
    navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...updates }) });
  };

  const activeFilterCount = [statusFilter, typeFilter, autoFilter].filter(f => f !== 'all').length + (search ? 1 : 0);

  const stats = {
    total: evidenceItems.length,
    valid: evidenceItems.filter(e => e.status === 'valid').length,
    expiring: evidenceItems.filter(e => e.status === 'expiring').length,
    expired: evidenceItems.filter(e => e.status === 'expired').length,
    auto: evidenceItems.filter(e => e.autoCollected).length,
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Evidence</h1>
          <p className="text-sm text-muted-foreground">{evidenceItems.length} items · {evidenceTypes.length} collection types supported</p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={() => navigate({ search: { status: 'all', type: 'all', source: 'all', q: '' } })}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Upload className="h-4 w-4" />
            Upload Evidence
          </button>
        </div>
      </div>

      {(stats.expiring > 0 || stats.expired > 0) && (
        <div className="flex gap-3 flex-wrap">
          {stats.expiring > 0 && (
            <button
              onClick={() => updateSearch({ status: 'expiring' })}
              className={`flex-1 min-w-[200px] flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${statusFilter === 'expiring' ? 'bg-status-in-progress/20 border-2 border-status-in-progress/40' : 'bg-status-in-progress/10 border border-status-in-progress/20'}`}
            >
              <Clock className="h-4 w-4 text-status-in-progress" />
              <span className="text-sm text-status-in-progress font-medium">{stats.expiring} evidence items expiring soon</span>
            </button>
          )}
          {stats.expired > 0 && (
            <button
              onClick={() => updateSearch({ status: 'expired' })}
              className={`flex-1 min-w-[200px] flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${statusFilter === 'expired' ? 'bg-status-failing/20 border-2 border-status-failing/40' : 'bg-status-failing/10 border border-status-failing/20'}`}
            >
              <XCircle className="h-4 w-4 text-status-failing" />
              <span className="text-sm text-status-failing font-medium">{stats.expired} evidence items expired</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {([
          { key: 'all', label: 'Total', value: stats.total, color: '' },
          { key: 'valid', label: 'Valid', value: stats.valid, color: 'text-status-passing' },
          { key: 'expiring', label: 'Expiring', value: stats.expiring, color: 'text-status-in-progress' },
          { key: 'expired', label: 'Expired', value: stats.expired, color: 'text-status-failing' },
        ] as const).map(item => (
          <button
            key={item.key}
            onClick={() => updateSearch({ status: statusFilter === item.key ? 'all' : item.key })}
            className={`bg-card border rounded-lg p-3 text-center hover:border-primary/40 transition-all cursor-pointer ${statusFilter === item.key && item.key !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
          >
            <div className={`text-xl font-bold ${item.color || 'text-foreground'}`}>{item.value}</div>
            <div className="text-[10px] text-muted-foreground">{item.label}</div>
          </button>
        ))}
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Zap className="h-3.5 w-3.5 text-chart-1" />
            <span className="text-xl font-bold text-foreground">{stats.auto}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Auto-Collected</div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Supported Evidence Types</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {evidenceTypes.map(et => {
            const Icon = typeIcons[et.id] || FileText;
            const count = evidenceItems.filter(e => e.type === et.id).length;
            return (
              <button
                key={et.id}
                onClick={() => updateSearch({ type: typeFilter === et.id ? 'all' : et.id })}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all text-center cursor-pointer ${
                  typeFilter === et.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/40'
                }`}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-medium text-foreground leading-tight">{et.label}</span>
                <span className="text-[9px] text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search evidence..."
            value={search}
            onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
        >
          <option value="all">All Statuses</option>
          <option value="valid">Valid</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={autoFilter}
          onChange={e => updateSearch({ source: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${autoFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
        >
          <option value="all">All Sources</option>
          <option value="auto">Auto-Collected</option>
          <option value="manual">Manual Upload</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} evidence items matching filters</p>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Control</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Source</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Collected</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Expires</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const sc = statusConfig[e.status];
              const StatusIcon = sc.icon;
              const TypeIcon = typeIcons[e.type] || FileText;
              return (
                <tr key={e.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate({ to: '/evidence/$evidenceId', params: { evidenceId: e.id } })}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{e.title}</span>
                      {e.autoCollected && <Zap className="h-3 w-3 text-chart-1 shrink-0" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="font-mono text-xs text-primary">{e.controlRef}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">{e.type.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{e.source}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${sc.style}`}>
                      <StatusIcon className="h-3 w-3" />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{e.collectedAt}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{e.expiresAt}</td>
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
      </div>
    </div>
  );
}
