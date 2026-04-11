import { createFileRoute } from '@tanstack/react-router';
import { frameworks } from '@/lib/mock-data';
import { Shield, ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/frameworks/')({
  component: FrameworksPage,
  head: () => ({
    meta: [
      { title: 'Frameworks — WatchDog Security' },
      { name: 'description', content: 'Compliance frameworks overview' },
    ],
  }),
});

const standardColors: Record<string, string> = {
  SOC2: 'bg-chart-1/15 text-chart-1',
  HIPAA: 'bg-chart-2/15 text-chart-2',
};

function FrameworksPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Frameworks</h1>
        <p className="text-sm text-muted-foreground">{frameworks.length} active frameworks</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {frameworks.map(fw => (
          <div key={fw.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-all group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">{fw.name}</h3>
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${standardColors[fw.standard] || 'bg-muted text-muted-foreground'}`}>
                    {fw.standard}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            {/* Progress ring (simplified as bar) */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-3xl font-bold text-foreground">{fw.compliancePct}%</span>
                <span className="text-xs text-muted-foreground">Target: {fw.targetDate}</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${fw.compliancePct}%` }}
                />
              </div>
            </div>

            {/* Control counts */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-status-passing/10 rounded px-2 py-1.5">
                <div className="text-sm font-bold text-status-passing">{fw.controlCounts.passing}</div>
                <div className="text-[10px] text-muted-foreground">Passing</div>
              </div>
              <div className="bg-status-failing/10 rounded px-2 py-1.5">
                <div className="text-sm font-bold text-status-failing">{fw.controlCounts.failing}</div>
                <div className="text-[10px] text-muted-foreground">Failing</div>
              </div>
              <div className="bg-status-in-progress/10 rounded px-2 py-1.5">
                <div className="text-sm font-bold text-status-in-progress">{fw.controlCounts.inProgress}</div>
                <div className="text-[10px] text-muted-foreground">In Prog</div>
              </div>
              <div className="bg-status-na/10 rounded px-2 py-1.5">
                <div className="text-sm font-bold text-status-na">{fw.controlCounts.na}</div>
                <div className="text-[10px] text-muted-foreground">N/A</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
