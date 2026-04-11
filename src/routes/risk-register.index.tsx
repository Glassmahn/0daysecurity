import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { risks } from '@/lib/mock-data-extended';
import { useState } from 'react';
import { AlertOctagon, Plus } from 'lucide-react';

export const Route = createFileRoute('/risk-register/')({
  component: RiskRegisterPage,
  head: () => ({ meta: [{ title: 'Risk Register — WatchDog Security' }] }),
});

const statusStyles: Record<string, string> = {
  identified: 'bg-status-warning/15 text-status-warning',
  mitigating: 'bg-status-in-progress/15 text-status-in-progress',
  accepted: 'bg-muted text-muted-foreground',
  resolved: 'bg-status-passing/15 text-status-passing',
};

function scoreColor(score: number) {
  if (score >= 15) return 'bg-severity-critical text-primary-foreground';
  if (score >= 10) return 'bg-severity-high text-primary-foreground';
  if (score >= 6) return 'bg-severity-medium text-primary-foreground';
  return 'bg-status-passing text-primary-foreground';
}

function RiskRegisterPage() {
  const [view, setView] = useState<'matrix' | 'table'>('matrix');
  const navigate = useNavigate();

  // Build 5x5 matrix
  const matrix: Record<string, typeof risks> = {};
  for (let l = 1; l <= 5; l++) {
    for (let i = 1; i <= 5; i++) {
      matrix[`${l}-${i}`] = risks.filter(r => r.likelihood === l && r.impact === i);
    }
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Risk Register</h1>
          <p className="text-sm text-muted-foreground">{risks.length} identified risks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-secondary rounded-md p-0.5">
            <button onClick={() => setView('matrix')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${view === 'matrix' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Matrix</button>
            <button onClick={() => setView('table')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Table</button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Add Risk
          </button>
        </div>
      </div>

      {view === 'matrix' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Risk Heat Map — Likelihood × Impact</h3>
          <div className="flex gap-2">
            {/* Y-axis label */}
            <div className="flex flex-col-reverse justify-between py-1 pr-2">
              {[1, 2, 3, 4, 5].map(l => (
                <div key={l} className="h-16 flex items-center text-xs text-muted-foreground">{l}</div>
              ))}
              <div className="h-6" />
            </div>

            <div className="flex-1">
              {/* Grid */}
              <div className="grid grid-cols-5 gap-1">
                {[5, 4, 3, 2, 1].map(likelihood =>
                  [1, 2, 3, 4, 5].map(impact => {
                    const cellRisks = matrix[`${likelihood}-${impact}`] || [];
                    const score = likelihood * impact;
                    const bg = score >= 15 ? 'bg-severity-critical/20 border-severity-critical/30' :
                               score >= 10 ? 'bg-severity-high/20 border-severity-high/30' :
                               score >= 6 ? 'bg-severity-medium/20 border-severity-medium/30' :
                               'bg-status-passing/10 border-status-passing/20';
                    return (
                      <div
                        key={`${likelihood}-${impact}`}
                        className={`h-16 rounded border ${bg} flex items-center justify-center text-xs transition-all ${cellRisks.length > 0 ? 'cursor-pointer hover:scale-105' : ''}`}
                        title={cellRisks.map(r => r.title).join('\n') || `L${likelihood} × I${impact}`}
                      >
                        {cellRisks.length > 0 && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreColor(score)}`}>
                            {cellRisks.length}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              {/* X-axis labels */}
              <div className="grid grid-cols-5 gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="text-center text-xs text-muted-foreground">{i}</div>
                ))}
              </div>
              <div className="text-center text-xs text-muted-foreground mt-1">Impact →</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">← Likelihood</div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Score</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">L</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">I</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Owner</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Controls</th>
            </tr>
          </thead>
          <tbody>
            {risks.sort((a, b) => b.riskScore - a.riskScore).map(r => (
              <tr key={r.id} className="border-b border-border hover:bg-surface transition-colors cursor-pointer" onClick={() => navigate({ to: '/risk-register/$riskId', params: { riskId: r.id } })}>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{r.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{r.category}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreColor(r.riskScore)}`}>{r.riskScore}</span>
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">{r.likelihood}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{r.impact}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.owner}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.linkedControls}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
