import { createFileRoute } from '@tanstack/react-router';
import { useState, useCallback, useEffect } from 'react';
import { Users, Bell, Key, CreditCard, Building2, Shield, Loader2, Clock, CheckCircle2, XCircle, Play, RefreshCw, Plus, Trash2, FileText, Copy, Webhook, RotateCcw, Download, AlertTriangle } from 'lucide-react';
import { RBACManager } from '@/components/settings/RBACManager';
import { UserManagement } from '@/components/settings/UserManagement';
import { AdminGuard, WriteGuard } from '@/components/guards/RoleGuards';
import { useNotificationPrefs, type NotificationPrefs } from '@/hooks/use-notification-prefs';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
  head: () => ({ meta: [{ title: 'Settings — ZeroDay Security' }] }),
});

const tabs = [
  { id: 'org', label: 'Organization', icon: Building2 },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'sso', label: 'SSO / SAML', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'jobs', label: 'Scheduled Jobs', icon: Clock },
  { id: 'custom-fields', label: 'Custom Fields', icon: FileText },
  { id: 'export', label: 'Data Export', icon: Download },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
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

function SSOConfigTab() {
  const [configs, setConfigs] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function fetchConfigs(cancelRef?: { current: boolean }) {
    setLoading(true);
    const { data, error } = await supabase.from('sso_configurations').select('id, status, provider, entity_id, sso_url');
    if (cancelRef?.current) return;
    if (error) toast.error('Failed to load SSO configs');
    else setConfigs(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchConfigs(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

  const fields: FieldDef[] = [
    { name: 'provider', label: 'Provider', type: 'select', required: true, options: [{ value: 'saml', label: 'SAML 2.0' }, { value: 'oidc', label: 'OpenID Connect' }] },
    { name: 'entity_id', label: 'Entity ID / Issuer', type: 'text', placeholder: 'https://your-idp.com/entity-id' },
    { name: 'sso_url', label: 'SSO URL', type: 'text', placeholder: 'https://your-idp.com/sso' },
    { name: 'certificate', label: 'Certificate', type: 'textarea', placeholder: 'Paste your IdP certificate...' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
  ];

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = editing?.id
      ? supabase.from('sso_configurations').update(values as TablesUpdate<'sso_configurations'>).eq('id', editing.id)
      : supabase.from('sso_configurations').insert(values as TablesInsert<'sso_configurations'>);
    const { error } = await payload;
    if (error) { toast.error('Failed to save SSO config'); return false; }
    toast.success(editing?.id ? 'SSO config updated' : 'SSO config created');
    await fetchConfigs();
    setEditing(null);
    return true;
  }

  if (loading) {
    return <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading SSO configurations...</div>;
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">SSO / SAML Configuration</h3>
            <p className="text-xs text-muted-foreground mt-1">Configure single sign-on providers for your organization</p>
          </div>
          <WriteGuard>
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Provider
            </button>
          </WriteGuard>
        </div>

        {configs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Shield className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No SSO providers configured</p>
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map(config => (
              <div key={config.id} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border/40">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${config.status === 'active' ? 'bg-status-passing' : 'bg-muted-foreground/40'}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{config.provider?.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{config.entity_id || config.sso_url ? (config.entity_id || config.sso_url) : 'No configuration'}</p>
                  </div>
                </div>
                <button onClick={() => { setEditing(config); setFormOpen(true); }} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <EntityFormDialog
        open={formOpen}
        onOpenChange={v => { setFormOpen(v); if (!v) setEditing(null); }}
        title={editing ? 'Edit SSO Provider' : 'Add SSO Provider'}
        fields={fields}
        initialValues={editing ?? undefined}
        onSubmit={handleSubmit}
        entityType="sso_configurations"
      />
    </>
  );
}

function NotificationsTab() {
  const { prefs, loading, saving, save } = useNotificationPrefs();
  const [local, setLocal] = useState<NotificationPrefs | null>(null);

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

  async function fetchRuns(cancelRef?: { current: boolean }) {
    setLoading(true);
    const query = supabase.from('job_runs' as unknown as 'compliance_snapshots')
      .select('id,job_name,status,started_at,finished_at,duration_ms,records_affected,error_message')
      .order('started_at', { ascending: false })
      .limit(50);
    const { data, error } = await query as unknown as { data: JobRun[] | null; error: unknown };
    if (cancelRef?.current) return;
    if (error) toast.error('Failed to load job runs');
    else setRuns((data ?? []) as JobRun[]);
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchRuns(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

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
            onClick={() => fetchRuns()}
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

const ENTITY_TYPE_OPTIONS = [
  { value: 'controls', label: 'Controls' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'assets', label: 'Assets' },
  { value: 'policies', label: 'Policies' },
];

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Select' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
];

function CustomFieldsTab() {
  const [fields, setFields] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [entityType, setEntityType] = useState('controls');
  const [fieldType, setFieldType] = useState('text');
  const [saving, setSaving] = useState(false);

  async function fetchFields(cancelRef?: { current: boolean }) {
    setLoading(true);
    const { data, error } = await supabase.from('custom_field_definitions')
      .select('id, field_name, entity_type, field_type, sort_order')
      .order('sort_order', { ascending: true });
    if (cancelRef?.current) return;
    if (error) toast.error('Failed to load custom fields');
    else setFields(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchFields(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

  async function handleAdd() {
    if (!fieldName.trim()) { toast.error('Field name is required'); return; }
    setSaving(true);
    const { error } = await supabase.from('custom_field_definitions').insert({
      field_name: fieldName.trim(),
      entity_type: entityType,
      field_type: fieldType,
      sort_order: fields.length,
    });
    setSaving(false);
    if (error) { toast.error('Failed: ' + error.message); return; }
    toast.success('Custom field added');
    setFieldName('');
    setShowForm(false);
    await fetchFields();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('custom_field_definitions').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Custom field deleted');
    await fetchFields();
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading custom fields…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Custom Fields</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Define custom fields for entities across the platform.</p>
        </div>
        <WriteGuard>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Add Field
          </button>
        </WriteGuard>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Field Name</label>
              <input value={fieldName} onChange={e => setFieldName(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="e.g. Department ID" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Entity Type</label>
              <select value={entityType} onChange={e => setEntityType(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                {ENTITY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Field Type</label>
              <select value={fieldType} onChange={e => setFieldType(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                {FIELD_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} disabled={saving || !fieldName.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
            <button onClick={() => { setShowForm(false); setFieldName(''); }}
              className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-accent transition-colors text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No custom fields defined yet.</p>
            <button onClick={() => setShowForm(true)} className="text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium text-xs">Add one</button>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Field Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Entity Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Field Type</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(f => (
                <tr key={f.id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{f.field_name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{f.entity_type}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{f.field_type}</td>
                  <td className="px-4 py-3 text-right">
                    <WriteGuard>
                      <button onClick={() => handleDelete(f.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </WriteGuard>
                  </td>
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
      {activeTab === 'org' && <OrganizationTab />}

      {activeTab === 'team' && <UserManagement />}

      {activeTab === 'roles' && <RBACManager />}

      {activeTab === 'sso' && <SSOConfigTab />}

      {activeTab === 'notifications' && <NotificationsTab />}

      {activeTab === 'jobs' && <ScheduledJobsTab />}

      {activeTab === 'custom-fields' && <CustomFieldsTab />}

      {activeTab === 'api' && <ApiKeysTab />}

      {activeTab === 'webhooks' && <WebhooksTab />}

      {activeTab === 'billing' && <BillingTab />}

      {activeTab === 'export' && <DataExportTab />}

      {activeTab === 'danger' && <DangerZoneTab />}
    </div>
    </AdminGuard>
  );
}

function OrganizationTab() {
  const [org, setOrg] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchOrg(cancelRef?: { current: boolean }) {
    const { data } = await supabase.from('organization_settings').select('id, name, industry, slug, primary_contact, plan, logo_url').limit(1).maybeSingle();
    if (cancelRef?.current) return;
    if (data) setOrg(data);
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchOrg(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from('organization_settings').update({
      name: org.name, industry: org.industry, slug: org.slug,
      primary_contact: org.primary_contact, plan: org.plan,
    }).eq('id', org.id);
    if (error) { toast.error('Failed to save: ' + error.message); } else { toast.success('Organization settings updated'); }
    setSaving(false);
  }

  if (loading) {
    return <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Organization Details</h3>
          <p className="text-xs text-muted-foreground mt-1">Edit your organization profile information</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded-md bg-primary/10 text-primary">{org.plan ?? 'enterprise'} plan</span>
          <WriteGuard>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </WriteGuard>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Organization Name</label>
          <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" value={org.name ?? ''} onChange={e => setOrg(s => ({ ...s, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Industry</label>
          <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" value={org.industry ?? ''} onChange={e => setOrg(s => ({ ...s, industry: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
          <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono" value={org.slug ?? ''} onChange={e => setOrg(s => ({ ...s, slug: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Primary Contact</label>
          <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" value={org.primary_contact ?? ''} onChange={e => setOrg(s => ({ ...s, primary_contact: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Plan</label>
          <select className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" value={org.plan ?? 'enterprise'} onChange={e => setOrg(s => ({ ...s, plan: e.target.value }))}>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Logo URL</label>
          <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono" placeholder="https://..." value={org.logo_url ?? ''} onChange={e => setOrg(s => ({ ...s, logo_url: e.target.value }))} />
        </div>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState<Array<{ id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  async function fetchKeys(cancelRef?: { current: boolean }) {
    setLoading(true);
    const { data } = await supabase.from('api_keys').select('id, name, key_prefix, created_at, last_used_at').order('created_at', { ascending: false });
    if (cancelRef?.current) return;
    setKeys(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchKeys(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

  async function handleCreate() {
    if (!newKeyName.trim()) { toast.error('Enter a key name'); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-api-key', {
        body: { name: newKeyName.trim() },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setRevealedKey(data.key);
      setNewKeyName('');
      toast.success('API key created — copy it now, it won\'t be shown again');
      await fetchKeys();
    } catch (err) {
      toast.error('Failed to create key: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) { toast.error('Failed to delete key'); return; }
    toast.success('API key deleted');
    await fetchKeys();
  }

  if (loading) {
    return <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading API keys...</div>;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
        <p className="text-xs text-muted-foreground mt-1">Manage API keys for programmatic access to the ZeroDay API</p>
      </div>

      {revealedKey && (
        <div className="bg-chart-1/10 border border-chart-1/30 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-chart-1">New API Key Created</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs font-mono break-all">{revealedKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success('Copied!'); }} className="p-1.5 rounded hover:bg-secondary transition-colors">
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">Make sure to copy this key now. For security, it will not be shown again.</p>
        </div>
      )}

      <WriteGuard>
        <div className="flex items-center gap-2">
          <input className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" placeholder="Enter a name for the new API key..." value={newKeyName} onChange={e => setNewKeyName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} disabled={creating || !newKeyName.trim()} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Create Key
          </button>
        </div>
      </WriteGuard>

      {keys.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No API keys created yet.</p>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{k.name}</p>
                  <p className="text-xs text-muted-foreground">Prefix: <code className="font-mono">{k.key_prefix}...</code> &middot; Created {new Date(k.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}` : 'Never used'}</span>
                <WriteGuard>
                  <button onClick={() => handleDelete(k.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </WriteGuard>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WebhooksTab() {
  const [endpoints, setEndpoints] = useState<Record<string, any>[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', url: '', events: '' });

  async function fetchData(cancelRef?: { current: boolean }) {
    setLoading(true);
    const [epRes, delRes] = await Promise.all([
      supabase.from('webhook_endpoints').select('id, name, status, url, events, last_sent_at, created_at').order('created_at', { ascending: false }),
      supabase.from('webhook_deliveries').select('id, status, event, response_code, attempted_at').order('attempted_at', { ascending: false }).limit(50),
    ]);
    if (cancelRef?.current) return;
    setEndpoints(epRes.data ?? []);
    setDeliveries(delRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchData(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

  async function handleCreate() {
    if (!formData.name.trim() || !formData.url.trim()) { toast.error('Name and URL are required'); return; }
    const events = formData.events.split(',').map(e => e.trim()).filter(Boolean);
    const { error } = await supabase.from('webhook_endpoints').insert({ name: formData.name, url: formData.url, events });
    if (error) { toast.error('Failed to create: ' + error.message); return; }
    toast.success('Webhook endpoint created');
    setShowForm(false);
    setFormData({ name: '', url: '', events: '' });
    fetchData();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
    if (error) { toast.error('Failed to delete: ' + error.message); return; }
    toast.success('Webhook deleted');
    fetchData();
  }

  async function handleTest() {
    const { error } = await supabase.functions.invoke('deliver-webhooks', {
      body: { event: 'test', payload: { message: 'Test webhook delivery' } },
    });
    if (error) { toast.error('Test failed: ' + error.message); return; }
    toast.success('Test webhook sent');
    fetchData();
  }

  async function handleRetry(deliveryId: string) {
    const { error } = await supabase.from('webhook_deliveries').update({ status: 'pending', attempted_at: new Date().toISOString() }).eq('id', deliveryId);
    if (error) { toast.error('Failed to retry: ' + error.message); return; }
    toast.success('Delivery queued for retry');
    fetchData();
  }

  if (loading) {
    return <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;
  }

  const allEvents = ['alert.created', 'finding.created', 'finding.status_changed', 'evidence.expired', 'evidence.needs_recollection', 'vendor_assessment.completed', 'access_review.due', 'policy.updated', 'control.status_changed'];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Webhook Endpoints</h3>
            <p className="text-xs text-muted-foreground mt-1">Configure endpoints to receive event-driven HTTP callbacks</p>
          </div>
          <WriteGuard>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> {showForm ? 'Cancel' : 'Add Endpoint'}
            </button>
          </WriteGuard>
        </div>

        {showForm && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" placeholder="Name (e.g. Slack Notifications)" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
            <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono" placeholder="URL (https://hooks.example.com/webhook)" value={formData.url} onChange={e => setFormData(f => ({ ...f, url: e.target.value }))} />
            <div>
              <input className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" placeholder="Events (comma-separated: alert.created, finding.created)" value={formData.events} onChange={e => setFormData(f => ({ ...f, events: e.target.value }))} />
              <p className="text-[10px] text-muted-foreground mt-1">Available: {allEvents.join(', ')}</p>
            </div>
            <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">Create</button>
          </div>
        )}

        {endpoints.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No webhook endpoints configured.</p>
        ) : (
          <div className="space-y-2">
            {endpoints.map(ep => (
              <div key={ep.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium text-foreground">{ep.name}</span>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${ep.status === 'active' ? 'bg-status-passing/12 text-status-passing' : 'bg-muted text-muted-foreground'}`}>{ep.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">{ep.url}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Events: {(ep.events ?? []).join(', ')} | {ep.last_sent_at ? `Last sent: ${new Date(ep.last_sent_at).toLocaleDateString()}` : 'Never sent'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleTest()} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Test"><Play className="h-3.5 w-3.5" /></button>
                  <WriteGuard>
                    <button onClick={() => handleDelete(ep.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </WriteGuard>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Recent Deliveries</h3>
          <p className="text-xs text-muted-foreground mt-1">Last 50 webhook delivery attempts</p>
        </div>
        {deliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No deliveries yet.</p>
        ) : (
          <div className="space-y-1">
            {deliveries.map(d => (
              <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {d.status === 'delivered' ? <CheckCircle2 className="h-3.5 w-3.5 text-status-passing shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                  <span className="font-medium text-foreground truncate">{d.event}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-muted-foreground truncate font-mono">{d.response_code ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-muted-foreground">{new Date(d.attempted_at).toLocaleDateString()} {new Date(d.attempted_at).toLocaleTimeString()}</span>
                  {d.status !== 'delivered' && (
                    <button onClick={() => handleRetry(d.id)} className="p-1 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Retry delivery">
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DataExportTab() {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState('');

  async function handleExport() {
    setExporting(true);
    setProgress('Fetching data from edge function...');
    try {
      const { data, error } = await supabase.functions.invoke('run-data-export', {
        body: { format },
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error('No data returned');

      setProgress('Preparing download...');

      const timestamp = new Date().toISOString().slice(0, 10);
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zeroday-export-${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([data as unknown as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zeroday-export-${timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      const count = data.record_counts
        ? Object.values(data.record_counts as Record<string, number>).reduce((a: number, b: number) => a + b, 0)
        : 0;
      toast.success(`Exported ${count.toLocaleString()} records across ${data.data ? Object.keys(data.data as Record<string, unknown>).length : 0} tables`);
    } catch (err) {
      toast.error('Export failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setExporting(false);
      setProgress('');
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Data Export</h3>
        <p className="text-xs text-muted-foreground mt-1">Export all organization data as JSON or CSV. Includes all tables scoped to your org.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface rounded-lg border border-border p-1">
          <button
            onClick={() => setFormat('json')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${format === 'json' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            JSON
          </button>
          <button
            onClick={() => setFormat('csv')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${format === 'csv' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            CSV
          </button>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? 'Exporting...' : 'Export All Data'}
        </button>
      </div>

      {progress && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {progress}
        </div>
      )}

      <div className="border border-border rounded-lg p-4 space-y-2">
        <p className="text-xs font-medium text-foreground">Tables included</p>
        <p className="text-xs text-muted-foreground">
          Controls, Evidence, Frameworks, Policies, Risks, Incidents, Assets, Vendors, Vendor Assessments,
          Alerts, Audits, Audit Findings, Knowledge Base, Training, Access Reviews,
          Personnel, Custom Fields, Compliance Snapshots, Integrations, and more.
        </p>
      </div>
    </div>
  );
}

function DangerZoneTab() {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('user_roles').select('org_id').limit(1).maybeSingle().then(({ data }) => {
      if (data) setOrgId(data.org_id);
    });
  }, []);

  async function handleDelete() {
    if (!orgId) { toast.error('Could not determine organization ID'); return; }
    if (confirmText !== `DELETE ${orgId}`) { toast.error(`Type DELETE ${orgId} to confirm`); return; }

    setDeleting(true);
    const redirectTimer = setTimeout(() => { window.location.href = '/'; }, 2000);
    try {
      const { data, error } = await supabase.functions.invoke('delete-organization', {
        body: { confirmation: confirmText },
      });
      if (error) throw new Error(error.message);
      if ((data as Record<string, unknown>)?.ok) {
        toast.success('Organization deleted. Redirecting...');
      } else {
        throw new Error((data as Record<string, unknown>)?.message as string ?? 'Unknown error');
      }
    } catch (err) {
      toast.error('Deletion failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-card border border-destructive/30 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Delete Organization</h3>
          <p className="text-xs text-muted-foreground">
            Permanently delete your entire organization and all associated data. This action cannot be undone.
          </p>
        </div>
      </div>

      <div className="border border-destructive/20 rounded-lg p-4 space-y-2 bg-destructive/5">
        <p className="text-xs font-medium text-destructive">What will be deleted:</p>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>All controls, policies, evidence, and framework mappings</li>
          <li>All incidents, alerts, risks, assets, and vendor records</li>
          <li>All audits, access reviews, training data, and personnel records</li>
          <li>All integrations, API keys, webhooks, and SSO configurations</li>
          <li>All custom fields, knowledge base articles, and compliance snapshots</li>
          <li>The organization itself and all user role assignments</li>
        </ul>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground block">
          Type <code className="font-mono text-destructive font-semibold">DELETE {orgId ?? '...'}</code> to confirm
        </label>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          onPaste={e => e.preventDefault()}
          placeholder={`DELETE ${orgId ?? '...'}`}
          className="w-full bg-input border border-destructive/40 rounded-md px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-destructive/50"
        />
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting || confirmText !== `DELETE ${orgId ?? ''}`}
        className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {deleting ? 'Deleting...' : 'Delete Organization'}
      </button>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Billing & Subscription</h3>
        <p className="text-xs text-muted-foreground mt-1">View and manage your subscription plan</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Current Plan</p>
          <p className="text-lg font-bold text-foreground">Enterprise</p>
          <p className="text-xs text-muted-foreground">Full GRC platform with all features</p>
        </div>
        <div className="border border-border rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-status-passing" />
            <p className="text-lg font-bold text-foreground">Active</p>
          </div>
          <p className="text-xs text-muted-foreground">Your subscription is in good standing</p>
        </div>
        <div className="border border-border rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase font-semibold">Manage</p>
          <a href="https://supabase.com/dashboard/project/wwbcttmmvyphhaabryvg/billing" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Open Supabase Dashboard &rarr;
          </a>
          <p className="text-xs text-muted-foreground">Manage invoices, payment methods, and plan changes</p>
        </div>
      </div>
    </div>
  );
}
