import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import {
  CheckCircle, XCircle, AlertCircle, RefreshCw, Plug,
  Settings, Loader2, Link2Off, Zap,
} from 'lucide-react';
import { useIntegrations, type Integration } from '@/hooks/use-integrations';
import { IntegrationConfigModal } from '@/components/integrations/IntegrationConfigModal';
import { PROVIDER_META, CATEGORY_ORDER } from '@/components/integrations/providerMeta';
import { AdminGuard } from '@/components/guards/RoleGuards';
import { format } from 'date-fns';
export const Route = createFileRoute('/integrations/')({
  component: IntegrationsPage,
  head: () => ({ meta: [{ title: 'Integrations — ZeroDay Security' }] }),
});

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; style: string; dot: string }> = {
  connected:    { icon: CheckCircle, label: 'Connected',    style: 'text-status-passing',    dot: 'bg-status-passing' },
  error:        { icon: AlertCircle, label: 'Error',        style: 'text-status-failing',    dot: 'bg-status-failing' },
  disconnected: { icon: XCircle,     label: 'Disconnected', style: 'text-muted-foreground',  dot: 'bg-muted-foreground/40' },
  syncing:      { icon: RefreshCw,   label: 'Syncing…',    style: 'text-status-in-progress', dot: 'bg-status-in-progress' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Cloud: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Identity: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Security: 'bg-red-500/10 text-red-400 border-red-500/20',
  Monitoring: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Communication: 'bg-green-500/10 text-green-400 border-green-500/20',
  Code: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  Ticketing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  MDM: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Compliance: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

function IntegrationCard({
  integration,
  onConfigure,
  onDisconnect,
  onSync,
  syncingId,
}: {
  integration: Integration;
  onConfigure: (i: Integration) => void;
  onDisconnect: (i: Integration) => void;
  onSync?: (i: Integration) => void;
  syncingId?: string | null;
}) {
  const cfg = statusConfig[integration.status] ?? statusConfig.disconnected;
  const StatusIcon = cfg.icon;
  const meta = PROVIDER_META[integration.provider];
  const catColor = CATEGORY_COLORS[integration.category] ?? 'bg-muted text-muted-foreground border-border';
  const isConnected = integration.status === 'connected';
  const isSyncing = integration.status === 'syncing' || syncingId === integration.id;
  const hasConnector = meta && ['aws', 'okta', 'github', 'datadog', 'gcp', 'crowdstrike', 'qualys', 'jamf', 'vanta', 'pagerduty'].includes(integration.provider);

  return (
    <div className={`bg-card border rounded-xl p-5 flex flex-col gap-4 transition-all hover:shadow-md ${isConnected ? 'border-primary/20' : 'border-border'}`}>
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isConnected ? 'bg-primary/10' : 'bg-surface'}`}>
            <Plug className={`h-5 w-5 ${isConnected ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{integration.name}</h3>
            <span className={`inline-flex items-center text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border mt-0.5 ${catColor}`}>
              {integration.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${cfg.dot} ${integration.status === 'syncing' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium ${cfg.style}`}>{cfg.label}</span>
          <StatusIcon className={`h-3.5 w-3.5 ${cfg.style} ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
        </div>
      </div>

      {/* Description */}
      {meta && <p className="text-xs text-muted-foreground leading-relaxed">{meta.description}</p>}

      {/* Error message */}
      {integration.error_message && (
        <div className="flex items-start gap-2 bg-status-failing/5 border border-status-failing/20 rounded-lg px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-status-failing shrink-0 mt-0.5" />
          <p className="text-xs text-status-failing">{integration.error_message}</p>
        </div>
      )}

      {/* Stats */}
      {isConnected && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-surface rounded-lg px-3 py-2">
            <div className="text-muted-foreground">Controls mapped</div>
            <div className="font-semibold text-foreground mt-0.5">{integration.controls_mapped}</div>
          </div>
          <div className="bg-surface rounded-lg px-3 py-2">
            <div className="text-muted-foreground">Last synced</div>
            <div className="font-semibold text-foreground mt-0.5">
              {integration.last_synced_at
                ? format(new Date(integration.last_synced_at), 'MMM d, HH:mm')
                : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-1">
        {isConnected ? (
          <>
            {hasConnector && (
              <button
                onClick={() => onSync?.(integration)}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-primary/30 rounded-lg text-xs font-medium hover:bg-primary/5 transition-colors text-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing…' : 'Sync Now'}
              </button>
            )}
            <button
              onClick={() => onConfigure(integration)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />Configure
            </button>
            <button
              onClick={() => onDisconnect(integration)}
              disabled={isSyncing}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-status-failing/30 rounded-lg text-xs font-medium hover:bg-status-failing/5 transition-colors text-status-failing disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Link2Off className="h-3.5 w-3.5" />Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={() => onConfigure(integration)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />Connect
          </button>
        )}
      </div>
    </div>
  );
}

function IntegrationsContent() {
  const { integrations, loading, refetch, connect, disconnect, triggerSync } = useIntegrations();
  const [configTarget, setConfigTarget] = useState<Integration | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = new Set(integrations.map(i => i.category));
    return ['All', ...CATEGORY_ORDER.filter(c => cats.has(c))];
  }, [integrations]);

  const filtered = useMemo(() =>
    categoryFilter === 'All' ? integrations : integrations.filter(i => i.category === categoryFilter),
    [integrations, categoryFilter]
  );

  const stats = useMemo(() => ({
    connected: integrations.filter(i => i.status === 'connected').length,
    total: integrations.length,
    errors: integrations.filter(i => i.status === 'error').length,
    controls: integrations.reduce((s, i) => s + i.controls_mapped, 0),
  }), [integrations]);

  async function handleSync(integration: Integration) {
    setSyncingId(integration.id);
    await triggerSync(integration.id, integration.provider);
    setSyncingId(null);
  }

  async function handleDisconnect(integration: Integration) {
    setDisconnecting(integration.id);
    await disconnect(integration.id, integration.name);
    setDisconnecting(null);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading integrations…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            {stats.connected} of {stats.total} connected · {stats.controls} controls mapped
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors text-muted-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Connected', value: stats.connected, color: 'text-status-passing' },
          { label: 'Total Available', value: stats.total, color: 'text-foreground' },
          { label: 'Errors', value: stats.errors, color: stats.errors > 0 ? 'text-status-failing' : 'text-muted-foreground' },
          { label: 'Controls Mapped', value: stats.controls, color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              categoryFilter === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {categoryFilter === 'All'
                ? 'No integrations available'
                : `No integrations match "${categoryFilter}"`}
            </p>
            {categoryFilter !== 'All' && (
              <button
                onClick={() => setCategoryFilter('All')}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          filtered.map(integration => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConfigure={setConfigTarget}
              onDisconnect={handleDisconnect}
              onSync={handleSync}
              syncingId={syncingId}
            />
          ))
        )}
      </div>

      {disconnecting && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 shadow-lg text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Disconnecting…
        </div>
      )}

      {/* Config modal */}
      {configTarget && (
        <IntegrationConfigModal
          integration={configTarget}
          open={true}
          onClose={() => setConfigTarget(null)}
          onSave={async (config) => {
            const ok = await connect(configTarget.id, configTarget.name, config);
            if (ok) setConfigTarget(null);
            return ok;
          }}
        />
      )}
    </div>
  );
}

function IntegrationsPage() {
  return (
    <AdminGuard
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <div className="text-4xl">🔒</div>
            <h2 className="text-lg font-semibold text-foreground">Admin Only</h2>
            <p className="text-sm text-muted-foreground">Only administrators can manage integrations.</p>
          </div>
        </div>
      }
    >
      <IntegrationsContent />
    </AdminGuard>
  );
}
