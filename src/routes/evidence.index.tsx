import { createFileRoute } from '@tanstack/react-router';
import { Paperclip, Upload } from 'lucide-react';

export const Route = createFileRoute('/evidence/')({
  component: EvidencePage,
  head: () => ({ meta: [{ title: 'Evidence — WatchDog Security' }] }),
});

function EvidencePage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Evidence</h1>
          <p className="text-sm text-muted-foreground">120 evidence items across all controls</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Upload className="h-4 w-4" /> Upload Evidence
        </button>
      </div>

      {/* Expiry banner */}
      <div className="bg-severity-medium/10 border border-severity-medium/30 rounded-lg px-4 py-3 flex items-center gap-3">
        <Paperclip className="h-4 w-4 text-severity-medium" />
        <span className="text-sm text-foreground"><strong>14</strong> evidence items expiring in the next 30 days</span>
        <button className="ml-auto text-xs text-primary font-medium">View expiring →</button>
      </div>

      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Paperclip className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Evidence Library</h3>
        <p className="text-sm text-muted-foreground mb-4">Full evidence management with auto-collection coming soon.</p>
        <p className="text-xs text-muted-foreground">Drag and drop files here or click Upload Evidence above.</p>
      </div>
    </div>
  );
}
