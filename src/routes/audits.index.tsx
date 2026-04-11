import { createFileRoute } from '@tanstack/react-router';
import { audits } from '@/lib/mock-data-extended';
import { ClipboardCheck, AlertTriangle, FileCheck, Shield } from 'lucide-react';

export const Route = createFileRoute('/audits/')({
  component: AuditsPage,
  head: () => ({ meta: [{ title: 'Audits — WatchDog Security' }] }),
});

const statusStyles: Record<string, string> = {
  preparing: 'bg-status-warning/15 text-status-warning',
  in_progress: 'bg-status-in-progress/15 text-status-in-progress',
  review: 'bg-chart-5/15 text-chart-5',
  completed: 'bg-status-passing/15 text-status-passing',
};

function AuditsPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Audits</h1>
        <p className="text-sm text-muted-foreground">Audit preparation and readiness tracking</p>
      </div>

      {/* Audit cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {audits.map(audit => (
          <div key={audit.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">{audit.frameworkName}</h3>
                  <p className="text-xs text-muted-foreground">{audit.auditFirm} — {audit.auditorName}</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[audit.status]}`}>{audit.status}</span>
            </div>

            {/* Readiness */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Readiness Score</span>
                <span className="text-sm font-bold text-foreground">{audit.readinessScore}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${audit.readinessScore >= 80 ? 'bg-status-passing' : audit.readinessScore >= 60 ? 'bg-status-warning' : 'bg-status-failing'}`}
                  style={{ width: `${audit.readinessScore}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <AlertTriangle className="h-3 w-3 text-status-failing" />
                  <span className="text-sm font-bold text-foreground">{audit.evidenceGaps}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Evidence Gaps</span>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <FileCheck className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{audit.findingsCount}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Findings</span>
              </div>
              <div className="bg-surface rounded-lg px-3 py-2 text-center">
                <div className="text-sm font-bold text-foreground mb-0.5">{audit.startDate}</div>
                <span className="text-[10px] text-muted-foreground">Start Date</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Audit Preparation Checklist</h3>
        <div className="space-y-3">
          {[
            { label: 'All controls implemented and tested', done: false },
            { label: 'Evidence collected for all mapped controls', done: false },
            { label: 'Access reviews completed for all personnel', done: false },
            { label: 'Security training up to date for all staff', done: false },
            { label: 'All policies published and acknowledged', done: true },
            { label: 'Risk register reviewed and updated', done: true },
            { label: 'Incident response plan tested (tabletop exercise)', done: true },
            { label: 'Penetration test completed within last 12 months', done: false },
            { label: 'Business continuity plan reviewed', done: true },
            { label: 'Vendor security assessments complete', done: false },
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${item.done ? 'bg-status-passing border-status-passing' : 'border-border group-hover:border-muted-foreground'}`}>
                {item.done && (
                  <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
