import { createFileRoute } from '@tanstack/react-router';
import { Users } from 'lucide-react';

export const Route = createFileRoute('/personnel/')({
  component: PersonnelPage,
  head: () => ({ meta: [{ title: 'Personnel — WatchDog Security' }] }),
});

function PersonnelPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Personnel</h1>
        <p className="text-sm text-muted-foreground">25 team members tracked</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Personnel Management</h3>
        <p className="text-sm text-muted-foreground">Access reviews, security training tracking, and background check management.</p>
      </div>
    </div>
  );
}
