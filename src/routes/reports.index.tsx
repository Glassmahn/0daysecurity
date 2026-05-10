import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { reportTemplates } from '@/lib/mock-data-extended';
import { generateReport } from '@/lib/pdf-report';
import { BarChart3, Download, Calendar, Play, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
  head: () => ({ meta: [{ title: 'Reports — ZeroDay Security' }] }),
});

const FORMAT_COLORS: Record<string, string> = {
  pdf: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  csv: 'bg-green-500/10 text-green-400 border border-green-500/20',
};

function ReportCard({ rpt }: { rpt: typeof reportTemplates[number] }) {
  const [generating, setGenerating] = useState(false);

  const canGenerate = ['rpt-1', 'rpt-2', 'rpt-3', 'rpt-4', 'rpt-5', 'rpt-7', 'rpt-8'].includes(rpt.id);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateReport(rpt.id);
      toast.success(`${rpt.name} downloaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-all group flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{rpt.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rpt.description}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ml-2 ${FORMAT_COLORS[rpt.format] ?? 'bg-muted text-muted-foreground'}`}>
          {rpt.format}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
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

      <div className="flex items-center gap-2 mt-auto pt-1">
        {canGenerate ? (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Play className="h-3 w-3" />}
            {generating ? 'Generating…' : rpt.format === 'csv' ? 'Export CSV' : 'Generate PDF'}
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-medium opacity-50 cursor-not-allowed"
          >
            <Play className="h-3 w-3" /> Generate
          </button>
        )}
        {rpt.lastGenerated && canGenerate && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-medium hover:bg-accent transition-colors text-muted-foreground disabled:opacity-50"
          >
            <Download className="h-3 w-3" /> Download
          </button>
        )}
      </div>
    </div>
  );
}

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
          <ReportCard key={rpt.id} rpt={rpt} />
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
