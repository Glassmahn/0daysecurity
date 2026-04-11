import { createFileRoute } from '@tanstack/react-router';
import { reportTemplates } from '@/lib/mock-data-extended';
import { BarChart3, Download, Calendar, Play } from 'lucide-react';

export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
  head: () => ({ meta: [{ title: 'Reports — WatchDog Security' }] }),
});

function ReportsPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">{reportTemplates.length} report templates available</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <BarChart3 className="h-4 w-4" /> Custom Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.map(rpt => (
          <div key={rpt.id} className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">{rpt.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{rpt.description}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{rpt.format}</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              {rpt.frequency && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="capitalize">{rpt.frequency}</span>
                </div>
              )}
              {rpt.lastGenerated && (
                <span>Last: {rpt.lastGenerated}</span>
              )}
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors">
                <Play className="h-3 w-3" /> Generate
              </button>
              {rpt.lastGenerated && (
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-medium hover:bg-accent transition-colors">
                  <Download className="h-3 w-3" /> Download Last
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Scheduled Reports */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Scheduled Reports</h3>
        <div className="space-y-3">
          {reportTemplates.filter(r => r.frequency).map(rpt => (
            <div key={rpt.id} className="flex items-center justify-between px-4 py-3 bg-surface rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-foreground font-medium">{rpt.name}</span>
                  <span className="text-xs text-muted-foreground ml-2 capitalize">({rpt.frequency})</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Next: auto-scheduled</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-status-passing/15 text-status-passing">active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
