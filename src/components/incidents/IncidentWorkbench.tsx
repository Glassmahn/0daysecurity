import { useState, useEffect } from 'react';

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}
import { Link } from '@tanstack/react-router';
import { incidents, controls, assets, alerts } from '@/lib/mock-data';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Clock,
  Shield,
  AlertTriangle,
  FileText,
  Users,
  Server,
  CheckCircle2,
  Circle,
  MessageSquare,
  Paperclip,
  ExternalLink,
} from 'lucide-react';

// --- Mock enrichment data per incident ---
const incidentDetails: Record<string, {
  description: string;
  timeline: { time: string; event: string; actor: string; type: 'action' | 'detection' | 'escalation' | 'update' | 'resolution' }[];
  evidence: { id: string; name: string; type: string; addedAt: string; addedBy: string }[];
  relatedControls: string[];
  relatedAssets: string[];
  relatedAlerts: string[];
  checklist: { id: string; label: string; done: boolean }[];
}> = {
  'INC-0024': {
    description: 'An S3 bucket containing PHI data was found publicly accessible due to a misconfigured bucket policy. CloudTrail logs show the policy was changed 48 hours ago during a deployment pipeline run.',
    timeline: [
      { time: '2026-04-11T07:00:00Z', event: 'AWS GuardDuty alert: S3 bucket policy allows public access', actor: 'System', type: 'detection' },
      { time: '2026-04-11T07:05:00Z', event: 'Alert triaged and incident created — severity set to Critical', actor: 'Sarah Chen', type: 'action' },
      { time: '2026-04-11T07:12:00Z', event: 'Escalated to CISO and Legal', actor: 'Sarah Chen', type: 'escalation' },
      { time: '2026-04-11T07:30:00Z', event: 'S3 bucket access revoked — Block Public Access enabled', actor: 'James Wilson', type: 'action' },
      { time: '2026-04-11T08:00:00Z', event: 'CloudTrail analysis: policy changed by CI/CD service role', actor: 'Alex Kim', type: 'update' },
      { time: '2026-04-11T09:15:00Z', event: 'Access log review: 3 external IPs accessed bucket in 48h window', actor: 'David Park', type: 'update' },
      { time: '2026-04-11T10:00:00Z', event: 'Breach notification process initiated per HIPAA §164.408', actor: 'Maria Garcia', type: 'escalation' },
    ],
    evidence: [
      { id: 'ev-1', name: 'CloudTrail-S3-policy-change.json', type: 'Log', addedAt: '2026-04-11T07:35:00Z', addedBy: 'Alex Kim' },
      { id: 'ev-2', name: 'GuardDuty-finding-export.pdf', type: 'Report', addedAt: '2026-04-11T07:10:00Z', addedBy: 'System' },
      { id: 'ev-3', name: 'S3-access-logs-48h.csv', type: 'Log', addedAt: '2026-04-11T09:20:00Z', addedBy: 'David Park' },
      { id: 'ev-4', name: 'Screenshot-bucket-policy-before.png', type: 'Screenshot', addedAt: '2026-04-11T07:40:00Z', addedBy: 'Sarah Chen' },
      { id: 'ev-5', name: 'Breach-impact-assessment.docx', type: 'Document', addedAt: '2026-04-11T10:05:00Z', addedBy: 'Maria Garcia' },
    ],
    relatedControls: ['c5', 'c4', 'c9', 'c10'],
    relatedAssets: ['ast-4', 'ast-1'],
    relatedAlerts: ['ALT-0042', 'ALT-0041'],
    checklist: [
      { id: 'ch-1', label: 'Contain — isolate affected systems', done: true },
      { id: 'ch-2', label: 'Preserve evidence — snapshot logs & configs', done: true },
      { id: 'ch-3', label: 'Notify incident commander & CISO', done: true },
      { id: 'ch-4', label: 'Root cause analysis', done: false },
      { id: 'ch-5', label: 'Impact assessment — data scope & affected individuals', done: false },
      { id: 'ch-6', label: 'Regulatory notification (HIPAA 60-day rule)', done: false },
      { id: 'ch-7', label: 'Remediation plan & preventive controls', done: false },
      { id: 'ch-8', label: 'Post-incident review & lessons learned', done: false },
    ],
  },
  'INC-0023': {
    description: 'Root account login detected on AWS production account without MFA. The root credentials were used to modify IAM policies at 09:28 UTC.',
    timeline: [
      { time: '2026-04-11T09:30:00Z', event: 'CloudTrail alert: Root account console login without MFA', actor: 'System', type: 'detection' },
      { time: '2026-04-11T09:32:00Z', event: 'Incident created — P1 Critical', actor: 'James Wilson', type: 'action' },
      { time: '2026-04-11T09:35:00Z', event: 'Root account password rotated', actor: 'James Wilson', type: 'action' },
      { time: '2026-04-11T09:40:00Z', event: 'IAM policy changes reverted', actor: 'Alex Kim', type: 'action' },
    ],
    evidence: [
      { id: 'ev-6', name: 'Root-login-cloudtrail.json', type: 'Log', addedAt: '2026-04-11T09:33:00Z', addedBy: 'System' },
      { id: 'ev-7', name: 'IAM-policy-diff.txt', type: 'Document', addedAt: '2026-04-11T09:42:00Z', addedBy: 'Alex Kim' },
    ],
    relatedControls: ['c1', 'c2', 'c7'],
    relatedAssets: ['ast-1', 'ast-4'],
    relatedAlerts: ['ALT-0042'],
    checklist: [
      { id: 'ch-1', label: 'Contain — rotate credentials & revoke sessions', done: true },
      { id: 'ch-2', label: 'Preserve evidence — snapshot logs', done: true },
      { id: 'ch-3', label: 'Notify incident commander', done: false },
      { id: 'ch-4', label: 'Root cause analysis', done: false },
      { id: 'ch-5', label: 'Enable MFA on root account', done: false },
      { id: 'ch-6', label: 'Post-incident review', done: false },
    ],
  },
};

// Generic fallback for incidents without enrichment
function getDetails(id: string) {
  return incidentDetails[id] || {
    description: 'Detailed information for this incident is being gathered.',
    timeline: [
      { time: new Date().toISOString(), event: 'Incident created', actor: 'System', type: 'detection' as const },
    ],
    evidence: [],
    relatedControls: [],
    relatedAssets: [],
    relatedAlerts: [],
    checklist: [
      { id: 'ch-1', label: 'Contain — isolate affected systems', done: false },
      { id: 'ch-2', label: 'Preserve evidence', done: false },
      { id: 'ch-3', label: 'Notify stakeholders', done: false },
      { id: 'ch-4', label: 'Root cause analysis', done: false },
      { id: 'ch-5', label: 'Remediation & review', done: false },
    ],
  };
}

const severityStyles: Record<string, string> = {
  critical: 'bg-severity-critical/15 text-severity-critical border-severity-critical/30',
  high: 'bg-severity-high/15 text-severity-high border-severity-high/30',
  medium: 'bg-severity-medium/15 text-severity-medium border-severity-medium/30',
  low: 'bg-severity-low/15 text-severity-low border-severity-low/30',
};

const statusStyles: Record<string, string> = {
  open: 'bg-status-failing/15 text-status-failing',
  investigating: 'bg-status-in-progress/15 text-status-in-progress',
  contained: 'bg-status-warning/15 text-status-warning',
  resolved: 'bg-status-passing/15 text-status-passing',
  closed: 'bg-muted text-muted-foreground',
};

const timelineTypeIcons: Record<string, typeof AlertTriangle> = {
  detection: AlertTriangle,
  action: Shield,
  escalation: Users,
  update: MessageSquare,
  resolution: CheckCircle2,
};

const timelineTypeColors: Record<string, string> = {
  detection: 'text-severity-critical',
  action: 'text-primary',
  escalation: 'text-severity-high',
  update: 'text-muted-foreground',
  resolution: 'text-status-passing',
};

export function IncidentWorkbench({ incidentId }: { incidentId: string }) {
  const [sbIncident, setSbIncident] = useState<typeof incidents[0] | null>(null);
  const [sbLoading, setSbLoading] = useState(false);
  const mockIncident = incidents.find((i) => i.id === incidentId);
  const incident = mockIncident ?? sbIncident;

  useEffect(() => {
    if (mockIncident) return;
    setSbLoading(true);
    supabase.from('incidents').select('*').eq('id', incidentId).maybeSingle().then(({ data }) => {
      if (data) {
        setSbIncident({
          id: data.id,
          title: data.title ?? 'Untitled Incident',
          severity: data.severity ?? 'medium',
          status: data.status ?? 'open',
          priority: 'p2',
          owner: 'Unassigned',
          slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          openedAt: data.created_at ?? new Date().toISOString(),
        } as typeof incidents[0]);
      }
      setSbLoading(false);
    });
  }, [incidentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const details = getDetails(incidentId);
  const [checkState, setCheckState] = useState<Record<string, boolean>>(
    Object.fromEntries(details.checklist.map((c) => [c.id, c.done]))
  );

  if (!incident) {
    if (sbLoading) {
      return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading…</div>;
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Incident not found</p>
        <Link to="/incidents" className="text-primary hover:underline text-sm">
          ← Back to incidents
        </Link>
      </div>
    );
  }

  const completedChecks = Object.values(checkState).filter(Boolean).length;
  const totalChecks = details.checklist.length;
  const slaDate = new Date(incident.slaDeadline);
  const now = new Date('2026-04-11T11:00:00Z');
  const slaRemaining = Math.max(0, Math.round((slaDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const slaBreach = slaDate < now;

  const relatedControlData = details.relatedControls
    .map((cid) => controls.find((c) => c.id === cid))
    .filter(Boolean);
  const relatedAssetData = details.relatedAssets
    .map((aid) => assets.find((a) => a.id === aid))
    .filter(Boolean);
  const relatedAlertData = details.relatedAlerts
    .map((aid) => alerts.find((a) => a.id === aid))
    .filter(Boolean);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/incidents" className="mt-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-muted-foreground">{incident.id}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${severityStyles[incident.severity]}`}>
              {incident.severity}
            </span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[incident.status]}`}>
              {incident.status}
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {incident.priority}
            </span>
          </div>
          <h1 className="text-lg font-bold text-foreground mt-1">{incident.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{details.description}</p>
        </div>
      </div>

      {/* SLA + owner strip */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-medium text-foreground">{incident.owner}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">SLA:</span>
          <span className={`font-medium ${slaBreach ? 'text-severity-critical' : slaRemaining <= 4 ? 'text-severity-high' : 'text-foreground'}`}>
            {slaBreach ? 'BREACHED' : `${slaRemaining}h remaining`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Response:</span>
          <span className="font-medium text-foreground">{completedChecks}/{totalChecks} steps</span>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Immutable Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-6">
                    {details.timeline.map((entry, idx) => {
                      const Icon = timelineTypeIcons[entry.type] || Circle;
                      const color = timelineTypeColors[entry.type] || 'text-muted-foreground';
                      return (
                        <div key={idx} className="relative flex gap-4 pl-1">
                          <div className={`relative z-10 flex items-center justify-center w-[30px] h-[30px] rounded-full bg-card border border-border ${color}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm text-foreground">{entry.event}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{fmtTime(entry.time)} UTC</span>
                              <span>·</span>
                              <span>{entry.actor}</span>
                              <span className={`uppercase text-[9px] font-semibold px-1 py-0.5 rounded ${
                                entry.type === 'detection' ? 'bg-severity-critical/10 text-severity-critical' :
                                entry.type === 'escalation' ? 'bg-severity-high/10 text-severity-high' :
                                entry.type === 'action' ? 'bg-primary/10 text-primary' :
                                entry.type === 'resolution' ? 'bg-status-passing/10 text-status-passing' :
                                'bg-muted text-muted-foreground'
                              }`}>{entry.type}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Evidence panel */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Evidence ({details.evidence.length})</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Paperclip className="h-3 w-3 mr-1" />
                  Attach
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {details.evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No evidence attached yet</p>
              ) : (
                <div className="space-y-2">
                  {details.evidence.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors cursor-pointer group">
                      <div className="flex items-center justify-center w-8 h-8 rounded bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ev.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ev.type} · {ev.addedBy} · {fmtTime(ev.addedAt)}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Checklist + related entities */}
        <div className="space-y-6">
          {/* Response checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Response Checklist</CardTitle>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(completedChecks / totalChecks) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {details.checklist.map((item) => (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={checkState[item.id]}
                      onCheckedChange={(checked) =>
                        setCheckState((prev) => ({ ...prev, [item.id]: !!checked }))
                      }
                      className="mt-0.5"
                    />
                    <span className={`text-sm transition-colors ${checkState[item.id] ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related entities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Related Entities</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="controls" className="w-full">
                <TabsList className="w-full h-8">
                  <TabsTrigger value="controls" className="text-xs flex-1">Controls ({relatedControlData.length})</TabsTrigger>
                  <TabsTrigger value="assets" className="text-xs flex-1">Assets ({relatedAssetData.length})</TabsTrigger>
                  <TabsTrigger value="alerts" className="text-xs flex-1">Alerts ({relatedAlertData.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="controls" className="space-y-2 mt-3">
                  {relatedControlData.map((ctrl) => ctrl && (
                    <div key={ctrl.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface transition-colors">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{ctrl.ref} — {ctrl.title}</p>
                        <p className="text-[10px] text-muted-foreground">{ctrl.framework}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] h-5">{ctrl.status.replace('_', ' ')}</Badge>
                    </div>
                  ))}
                  {relatedControlData.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No related controls</p>
                  )}
                </TabsContent>

                <TabsContent value="assets" className="space-y-2 mt-3">
                  {relatedAssetData.map((asset) => asset && (
                    <div key={asset.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface transition-colors">
                      <Server className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{asset.name}</p>
                        <p className="text-[10px] text-muted-foreground">{asset.type} · {asset.environment}</p>
                      </div>
                      <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${
                        asset.riskScore >= 80 ? 'bg-severity-critical/15 text-severity-critical' :
                        asset.riskScore >= 50 ? 'bg-severity-medium/15 text-severity-medium' :
                        'bg-status-passing/15 text-status-passing'
                      }`}>{asset.riskScore}</span>
                    </div>
                  ))}
                  {relatedAssetData.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No related assets</p>
                  )}
                </TabsContent>

                <TabsContent value="alerts" className="space-y-2 mt-3">
                  {relatedAlertData.map((alert) => alert && (
                    <div key={alert.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface transition-colors">
                      <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{alert.title}</p>
                        <p className="text-[10px] text-muted-foreground">{alert.id} · {alert.source}</p>
                      </div>
                    </div>
                  ))}
                  {relatedAlertData.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No related alerts</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
