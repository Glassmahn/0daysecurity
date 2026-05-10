import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { Users, Bell, Key, CreditCard, Building2, Shield, Loader2 } from 'lucide-react';
import { RBACManager } from '@/components/settings/RBACManager';
import { UserManagement } from '@/components/settings/UserManagement';
import { AdminGuard } from '@/components/guards/RoleGuards';
import { useNotificationPrefs, type NotificationPrefs } from '@/hooks/use-notification-prefs';
import { toast } from 'sonner';

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
  head: () => ({ meta: [{ title: 'Settings — ZeroDay Security' }] }),
});

const tabs = [
  { id: 'org', label: 'Organization', icon: Building2 },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];


const NOTIFICATION_ROWS: Array<{
  label: string;
  emailKey: keyof NotificationPrefs;
  slackKey: keyof NotificationPrefs;
}> = [
  { label: 'Critical alerts',          emailKey: 'critical_alerts_email',   slackKey: 'critical_alerts_slack'   },
  { label: 'High severity alerts',     emailKey: 'high_alerts_email',        slackKey: 'high_alerts_slack'        },
  { label: 'Evidence expiring',        emailKey: 'evidence_expiring_email',  slackKey: 'evidence_expiring_slack'  },
  { label: 'Access review reminders',  emailKey: 'access_review_email',      slackKey: 'access_review_slack'      },
  { label: 'Policy review due',        emailKey: 'policy_review_email',      slackKey: 'policy_review_slack'      },
  { label: 'Weekly digest',            emailKey: 'weekly_digest_email',      slackKey: 'weekly_digest_slack'      },
];

function NotificationsTab() {
  const { prefs, loading, saving, save } = useNotificationPrefs();
  const [local, setLocal] = useState<NotificationPrefs | null>(null);

  // Merge server prefs into local state once loaded.
  const effective = local ?? prefs;

  const toggle = useCallback((key: keyof NotificationPrefs) => {
    setLocal(prev => {
      const base = prev ?? prefs;
      return { ...base, [key]: !base[key] };
    });
  }, [prefs]);

  const handleSave = async () => {
    const ok = await save(effective);
    if (ok) {
      toast.success('Notification preferences saved');
      setLocal(null);
    } else {
      toast.error('Failed to save preferences');
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading preferences…
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
      <div className="space-y-2">
        {NOTIFICATION_ROWS.map(row => (
          <div key={row.emailKey} className="flex items-center justify-between px-4 py-3 bg-surface rounded-lg">
            <span className="text-sm text-foreground">{row.label}</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={effective[row.emailKey] as boolean}
                  onChange={() => toggle(row.emailKey)}
                  className="rounded"
                />
                <span className="text-xs text-muted-foreground">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={effective[row.slackKey] as boolean}
                  onChange={() => toggle(row.slackKey)}
                  className="rounded"
                />
                <span className="text-xs text-muted-foreground">Slack</span>
              </label>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || local === null}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          Save Preferences
        </button>
        {local !== null && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground pt-1">
        Notification emails are sent daily at 08:00 UTC. Evidence expiry alerts trigger 30 days before the deadline.
      </p>
    </div>
  );
}

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('team');

  return (
    <AdminGuard fallback={
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-semibold text-foreground">Admin Only</h2>
          <p className="text-sm text-muted-foreground">Only administrators can access Settings.</p>
        </div>
      </div>
    }>
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage organization, team, and platform configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'org' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <h3 className="text-sm font-semibold text-foreground">Organization Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Organization Name</label>
              <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" defaultValue="Meridian Health Tech" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Industry</label>
              <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" defaultValue="Healthcare SaaS" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
              <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono" defaultValue="meridian-health-tech" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Primary Contact</label>
              <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" defaultValue="sarah.chen@meridian.io" />
            </div>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">Save Changes</button>
        </div>
      )}

      {activeTab === 'team' && <UserManagement />}

      {activeTab === 'roles' && <RBACManager />}

      {activeTab === 'notifications' && <NotificationsTab />}

      {activeTab === 'api' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
          <div className="px-4 py-3 bg-surface rounded-lg flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Production Key</div>
              <div className="font-mono text-xs text-muted-foreground mt-0.5">wdog_prod_••••••••••••••••</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Created: 2026-01-15</span>
              <button className="text-xs text-primary font-medium hover:underline">Reveal</button>
              <button className="text-xs text-status-failing font-medium hover:underline">Revoke</button>
            </div>
          </div>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-accent transition-colors">Generate New Key</button>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Billing & Subscription</h3>
          <div className="px-4 py-4 bg-surface rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">Enterprise Plan</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-status-passing/15 text-status-passing">active</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Unlimited users, all frameworks, priority support, SSO</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Next billing: May 1, 2026</span>
              <span>$2,500/month</span>
            </div>
          </div>
          <button className="text-xs text-primary font-medium hover:underline">Manage Subscription →</button>
        </div>
      )}
    </div>
    </AdminGuard>
  );
}
