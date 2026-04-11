import { createFileRoute } from '@tanstack/react-router';
import { teamMembers } from '@/lib/mock-data-extended';
import { useState } from 'react';
import { Settings as SettingsIcon, Users, Bell, Key, CreditCard, Building2, UserPlus, Shield } from 'lucide-react';

export const Route = createFileRoute('/settings/')({
  component: SettingsPage,
  head: () => ({ meta: [{ title: 'Settings — WatchDog Security' }] }),
});

const tabs = [
  { id: 'org', label: 'Organization', icon: Building2 },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

const roleStyles: Record<string, string> = {
  admin: 'bg-severity-critical/15 text-severity-critical',
  analyst: 'bg-status-in-progress/15 text-status-in-progress',
  auditor: 'bg-chart-5/15 text-chart-5',
  executive: 'bg-status-warning/15 text-status-warning',
  viewer: 'bg-muted text-muted-foreground',
};

const memberStatusStyles: Record<string, string> = {
  active: 'bg-status-passing/15 text-status-passing',
  invited: 'bg-status-warning/15 text-status-warning',
  deactivated: 'bg-muted text-muted-foreground',
};

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('team');

  return (
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

      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{teamMembers.length} members</span>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              <UserPlus className="h-4 w-4" /> Invite Member
            </button>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Last Active</th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map(m => (
                  <tr key={m.id} className="border-b border-border hover:bg-surface transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${roleStyles[m.role]}`}>{m.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${memberStatusStyles[m.status]}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.lastActive}</td>
                    <td className="px-4 py-3">
                      <button className="text-xs text-primary font-medium hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Role Permissions</h3>
          <div className="space-y-3">
            {[
              { role: 'Admin', desc: 'Full access to all modules, settings, and team management', modules: 'All' },
              { role: 'Analyst', desc: 'Dashboard, Alerts, Incidents, Assets, Controls — full write access', modules: 'Dashboard, Alerts, Incidents, Assets, Controls' },
              { role: 'Auditor', desc: 'Read-only access to Frameworks, Controls, Evidence, Policies, Audits', modules: 'Frameworks, Controls, Evidence, Policies, Audits' },
              { role: 'Executive', desc: 'Dashboard, Reports, Risk Register — read-only', modules: 'Dashboard, Reports, Risk Register' },
              { role: 'Viewer', desc: 'Dashboard read-only', modules: 'Dashboard' },
            ].map(r => (
              <div key={r.role} className="px-4 py-3 bg-surface rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-foreground">{r.role}</span>
                  <button className="text-xs text-primary font-medium hover:underline">Customize</button>
                </div>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { label: 'Critical alerts', email: true, slack: true },
              { label: 'High severity alerts', email: true, slack: false },
              { label: 'Evidence expiring', email: true, slack: false },
              { label: 'Access review reminders', email: true, slack: true },
              { label: 'Policy review due', email: false, slack: false },
              { label: 'Weekly digest', email: true, slack: false },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 bg-surface rounded-lg">
                <span className="text-sm text-foreground">{n.label}</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={n.email} className="rounded" />
                    <span className="text-xs text-muted-foreground">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked={n.slack} className="rounded" />
                    <span className="text-xs text-muted-foreground">Slack</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
  );
}
