import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { assets } from '@/lib/mock-data';
import { Monitor, Search } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/assets/')({
  component: AssetsPage,
  head: () => ({
    meta: [
      { title: 'Assets — ZeroDay Security' },
      { name: 'description', content: 'Monitored assets inventory' },
    ],
  }),
});

function riskColor(score: number) {
  if (score >= 80) return 'bg-severity-critical';
  if (score >= 60) return 'bg-severity-high';
  if (score >= 40) return 'bg-severity-medium';
  return 'bg-status-passing';
}

const typeStyles: Record<string, string> = {
  server: 'bg-chart-1/12 text-chart-1',
  database: 'bg-chart-5/12 text-chart-5',
  application: 'bg-chart-2/12 text-chart-2',
  cloud_resource: 'bg-chart-3/12 text-chart-3',
  saas_app: 'bg-chart-4/12 text-chart-4',
  network: 'bg-primary/12 text-primary',
  endpoint: 'bg-muted text-muted-foreground',
};

function AssetsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const types = ['all', ...Array.from(new Set(assets.map(a => a.type)))];
  const filtered = assets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.owner.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Assets</h1>
            <p className="text-sm text-muted-foreground">{filtered.length} of {assets.length} monitored assets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search assets…"
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
            {types.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left bg-surface/50">
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Name</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Environment</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Owner</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Risk Score</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-border/40 hover:bg-primary/[0.03] transition-colors cursor-pointer" onClick={() => navigate({ to: '/assets/$assetId', params: { assetId: a.id } })}>
                <td className="px-4 py-3.5 font-medium text-foreground">{a.name}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${typeStyles[a.type] || 'bg-muted text-muted-foreground'}`}>
                    {a.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{a.environment}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{a.owner}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${riskColor(a.riskScore)}`} style={{ width: `${a.riskScore}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{a.riskScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{a.complianceStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
