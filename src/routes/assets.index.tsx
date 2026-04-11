import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { assets } from '@/lib/mock-data';

export const Route = createFileRoute('/assets/')({
  component: AssetsPage,
  head: () => ({
    meta: [
      { title: 'Assets — WatchDog Security' },
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
  server: 'bg-chart-1/15 text-chart-1',
  database: 'bg-chart-5/15 text-chart-5',
  application: 'bg-chart-2/15 text-chart-2',
  cloud_resource: 'bg-chart-3/15 text-chart-3',
  saas_app: 'bg-chart-4/15 text-chart-4',
  network: 'bg-primary/15 text-primary',
  endpoint: 'bg-muted text-muted-foreground',
};

function AssetsPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Assets</h1>
        <p className="text-sm text-muted-foreground">{assets.length} monitored assets</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Environment</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Owner</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Risk Score</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a.id} className="border-b border-border hover:bg-surface transition-colors cursor-pointer">
                <td className="px-4 py-3 font-medium text-foreground">{a.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeStyles[a.type] || 'bg-muted text-muted-foreground'}`}>
                    {a.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.environment}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.owner}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 bg-surface rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${riskColor(a.riskScore)}`} style={{ width: `${a.riskScore}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{a.riskScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.complianceStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
