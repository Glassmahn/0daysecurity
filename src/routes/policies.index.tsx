import { createFileRoute } from '@tanstack/react-router';
import { FileText } from 'lucide-react';

export const Route = createFileRoute('/policies/')({
  component: PoliciesPage,
  head: () => ({ meta: [{ title: 'Policies — WatchDog Security' }] }),
});

function PoliciesPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Policies</h1>
        <p className="text-sm text-muted-foreground">12 policies managed</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Policy Library</h3>
        <p className="text-sm text-muted-foreground">Draft, review, approve, and publish security policies with version control.</p>
      </div>
    </div>
  );
}
