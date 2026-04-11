import { createFileRoute } from '@tanstack/react-router';
import { ClipboardCheck } from 'lucide-react';

export const Route = createFileRoute('/audits/')({
  component: AuditsPage,
  head: () => ({ meta: [{ title: 'Audits — WatchDog Security' }] }),
});

function AuditsPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Audits</h1>
        <p className="text-sm text-muted-foreground">Audit preparation and management</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Audit Room</h3>
        <p className="text-sm text-muted-foreground">Evidence packages, auditor access, findings tracking, and readiness scoring.</p>
      </div>
    </div>
  );
}
