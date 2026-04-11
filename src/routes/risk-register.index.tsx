import { createFileRoute } from '@tanstack/react-router';
import { AlertOctagon } from 'lucide-react';

export const Route = createFileRoute('/risk-register/')({
  component: RiskRegisterPage,
  head: () => ({ meta: [{ title: 'Risk Register — WatchDog Security' }] }),
});

function RiskRegisterPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Risk Register</h1>
        <p className="text-sm text-muted-foreground">15 identified risks</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <AlertOctagon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Risk Assessment</h3>
        <p className="text-sm text-muted-foreground">5×5 risk matrix, mitigation tracking, and control linkage.</p>
      </div>
    </div>
  );
}
