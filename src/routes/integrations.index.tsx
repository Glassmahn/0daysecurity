import { createFileRoute } from '@tanstack/react-router';
import { integrations } from '@/lib/mock-data';
import { Plug, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const Route = createFileRoute('/integrations/')({
  component: IntegrationsPage,
  head: () => ({ meta: [{ title: 'Integrations — ZeroDay Security' }] }),
});

const statusConfig: Record<string, { icon: React.ElementType; style: string }> = {
  connected: { icon: CheckCircle, style: 'text-status-passing' },
  error: { icon: AlertCircle, style: 'text-status-failing' },
  disconnected: { icon: XCircle, style: 'text-muted-foreground' },
  syncing: { icon: RefreshCw, style: 'text-status-in-progress' },
};

function IntegrationsPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground">{integrations.filter(i => i.status === 'connected').length} of {integrations.length} connected</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map(i => {
          const cfg = statusConfig[i.status] || statusConfig.disconnected;
          const StatusIcon = cfg.icon;
          return (
            <div key={i.id} className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-surface flex items-center justify-center">
                  <Plug className="h-5 w-5 text-muted-foreground" />
                </div>
                <StatusIcon className={`h-4 w-4 ${cfg.style}`} />
              </div>
              <h3 className="font-semibold text-foreground">{i.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{i.category}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last sync: {i.lastSync}</span>
                <span className="text-muted-foreground">{i.controlsMapped} controls</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
