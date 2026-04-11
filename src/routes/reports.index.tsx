import { createFileRoute } from '@tanstack/react-router';
import { BarChart3 } from 'lucide-react';

export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
  head: () => ({ meta: [{ title: 'Reports — WatchDog Security' }] }),
});

function ReportsPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Compliance reports and analytics</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Report Builder</h3>
        <p className="text-sm text-muted-foreground">Generate compliance summaries, trend reports, and scheduled exports in PDF/CSV.</p>
      </div>
    </div>
  );
}
