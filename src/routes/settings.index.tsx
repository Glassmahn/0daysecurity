import { createFileRoute } from '@tanstack/react-router';
import { Settings } from 'lucide-react';

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
  head: () => ({ meta: [{ title: 'Settings — WatchDog Security' }] }),
});

function SettingsPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Organization and team configuration</p>
      </div>
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Organization Settings</h3>
        <p className="text-sm text-muted-foreground">Team members, roles, notifications, API keys, and billing management.</p>
      </div>
    </div>
  );
}
