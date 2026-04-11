import { createFileRoute } from '@tanstack/react-router';
import { evidenceItems } from '@/lib/mock-data-extended';
import { useState } from 'react';
import { Upload, Paperclip, Zap } from 'lucide-react';

export const Route = createFileRoute('/evidence/')({
  component: EvidencePage,
  head: () => ({ meta: [{ title: 'Evidence — WatchDog Security' }] }),
});

const statusStyles: Record<string, string> = {
  valid: 'bg-status-passing/15 text-status-passing',
  expiring: 'bg-status-warning/15 text-status-warning',
  expired: 'bg-status-failing/15 text-status-failing',
  rejected: 'bg-severity-critical/15 text-severity-critical',
};

const typeStyles: Record<string, string> = {
  screenshot: 'bg-chart-1/15 text-chart-1',
  document: 'bg-chart-2/15 text-chart-2',
  api_pull: 'bg-chart-3/15 text-chart-3',
  config_export: 'bg-chart-4/15 text-chart-4',
  attestation: 'bg-chart-5/15 text-chart-5',
  log: 'bg-muted text-muted-foreground',
};

function EvidencePage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? evidenceItems : evidenceItems.filter(e => e.status === filter);

  const expiring7 = evidenceItems.filter(e => e.status === 'expiring').length;
  const expired = evidenceItems.filter(e => e.status === 'expired').length;
  const autoCount = evidenceItems.filter(e => e.autoCollected).length;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Evidence</h1>
          <p className="text-sm text-muted-foreground">{evidenceItems.length} evidence items</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Upload className="h-4 w-4" /> Upload Evidence
        </button>
      </div>

      {/* Banners */}
      {(expiring7 > 0 || expired > 0) && (
        <div className="flex gap-3 flex-wrap">
          {expired > 0 && (
            <div className="bg-severity-critical/10 border border-severity-critical/30 rounded-lg px-4 py-3 flex items-center gap-3 flex-1">
              <Paperclip className="h-4 w-4 text-severity-critical" />
              <span className="text-sm text-foreground"><strong>{expired}</strong> evidence items have expired</span>
              <button className="ml-auto text-xs text-primary font-medium" onClick={() => setFilter('expired')}>View →</button>
            </div>
          )}
          {expiring7 > 0 && (
            <div className="bg-severity-medium/10 border border-severity-medium/30 rounded-lg px-4 py-3 flex items-center gap-3 flex-1">
              <Paperclip className="h-4 w-4 text-severity-medium" />
              <span className="text-sm text-foreground"><strong>{expiring7}</strong> evidence items expiring soon</span>
              <button className="ml-auto text-xs text-primary font-medium" onClick={() => setFilter('expiring')}>View →</button>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1 bg-secondary rounded-md p-0.5 w-fit">
        {['all', 'valid', 'expiring', 'expired', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 text-xs font-medium rounded capitalize transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Control</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Source</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Collected</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Expires</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Auto</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className="border-b border-border hover:bg-surface transition-colors cursor-pointer">
                <td className="px-4 py-3 font-medium text-foreground">{e.title}</td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-mono text-xs text-primary">{e.controlRef}</div>
                    <div className="text-xs text-muted-foreground">{e.controlTitle}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeStyles[e.type]}`}>{e.type.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{e.source}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[e.status]}`}>{e.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{e.collectedAt}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{e.expiresAt}</td>
                <td className="px-4 py-3">
                  {e.autoCollected && <span title="Auto-collected"><Zap className="h-3.5 w-3.5 text-status-warning" /></span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground">
        {autoCount} of {evidenceItems.length} items auto-collected via integrations
      </div>
    </div>
  );
}
