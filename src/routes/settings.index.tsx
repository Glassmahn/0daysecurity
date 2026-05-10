import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useEffect } from 'react';
import { Users, Bell, Key, CreditCard, Building2, Shield, Loader2, Clock, CheckCircle2, XCircle, Play, RefreshCw } from 'lucide-react';
import { RBACManager } from '@/components/settings/RBACManager';
import { UserManagement } from '@/components/settings/UserManagement';
import { AdminGuard } from '@/components/guards/RoleGuards';
import { useNotificationPrefs, type NotificationPrefs } from '@/hooks/use-notification-prefs';
import { supabase } from '@/integrations/supabase/client';
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
  { id: 'jobs', label: 'Scheduled Jobs', icon: Clock },
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

interface JobRun {
  id: string;
  job_name: string;
  status: 'success' | 'failure' | 'partial';
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  records_affected: number;
  error_message: string | null;
}

const JOB_LABELS: Record<string, string> = {
  'evidence-expiry-scan': 'Evidence Expiry Scan',
  'alert-escalation': 'Alert Escalation',
  'vendor-contract-review': 'Vendor Contract Review',
  'compliance-snapshot': 'Compliance Snapshot',
};

function ScheduledJobsTab() {
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  async function fetchRuns() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('job_runs')
      .select('id,job_name,status,started_at,finished_at,duration_ms,records_affected,error_message')
      .order('started_at', { ascending: false })
      .limit(50);
    if (error) toast.error('Failed to load job runs');
    else setRuns(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchRuns(); }, []);

  async function handleTrigger() {
    setTriggering(true);
    try {
      const { error } = await supabase.functions.invoke('run-scheduled-jobs');
      if (error) throw new Error(error.message);
      toast.success('Jobs triggered — refreshing…');
      await fetchRuns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to trigger jobs');
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Scheduled Jobs</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Jobs run daily at 06:00 UTC via pg_cron. Last 50 runs shown.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRuns}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors text-muted-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {triggering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Run Now
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading runs…
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Clock className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No job runs yet. Click "Run Now" to trigger.</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Job</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Started</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Duration</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Records</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, i) => (
                <tr key={run.id} className={`border-b border-border last:border-0 hover:bg-surface/50 transition-colors ${i % 2 === 0 ? '' : 'bg-surface/20'}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{JOB_LABELS[run.job_name] ?? run.job_name}</td>
                  <td className="px-4 py-3">
                    {run.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-status-passing">
                        <CheckCircle2 className="h-3 w-3" />Success
                      </span>
                    ) : run.status === 'failure' ? (
                      <span className="inline-flex items-center gap-1 text-status-failing" title={run.error_message ?? undefined}>
                        <XCircle className="h-3 w-3" />Failed
                      </span>
                    ) : (
                      <span className="text-status-in-progress">Partial</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(run.started_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {run.duration_ms != null ? `${run.duration_ms.toLocaleString()} ms` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground font-medium">{run.records_affected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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

      {activeTab === 'jobs' && <ScheduledJobsTab />}

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
