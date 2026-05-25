// Mock data for ZeroDay Security Dashboard - Meridian Health Tech

export interface KPIData {
  label: string;
  value: string | number;
  delta: number;
  deltaLabel: string;
  href: string;
  icon: string;
  isPositive: boolean;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  source: string;
  controlRef: string;
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';
  owner: string | null;
  openedAt: string;
  age: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  priority: 'p1' | 'p2' | 'p3' | 'p4';
  owner: string;
  slaDeadline: string;
  openedAt: string;
}

export interface Framework {
  id: string;
  name: string;
  standard: string;
  compliancePct: number;
  status: string;
  controlCounts: { passing: number; failing: number; inProgress: number; na: number };
  targetDate: string;
}

export interface Control {
  id: string;
  ref: string;
  title: string;
  framework: string;
  category: string;
  status: 'implemented' | 'in_progress' | 'failing' | 'not_implemented' | 'not_applicable';
  owner: string;
  implementationPct: number;
  lastTested: string;
  testFrequency: string;
  evidenceCount: number;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  environment: string;
  owner: string;
  riskScore: number;
  complianceStatus: string;
  lastScanned: string;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityType: string;
  timestamp: string;
  avatarInitials: string;
}

export interface PriorityItem {
  id: string;
  type: 'alert' | 'control' | 'evidence' | 'review';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  age: string;
  action: string;
}

export const kpiData: KPIData[] = [
  { label: 'Compliance Score', value: '73%', delta: 4.2, deltaLabel: 'vs last period', href: '/frameworks', icon: 'shield-check', isPositive: true },
  { label: 'Controls Passing', value: 31, delta: 3, deltaLabel: 'vs last period', href: '/controls', icon: 'check-circle', isPositive: true },
  { label: 'Controls Failing', value: 8, delta: -2, deltaLabel: 'vs last period', href: '/controls', icon: 'x-circle', isPositive: false },
  { label: 'Open Critical', value: 20, delta: 5, deltaLabel: 'vs last period', href: '/alerts', icon: 'alert-triangle', isPositive: false },
  { label: 'Open High', value: 30, delta: -3, deltaLabel: 'vs last period', href: '/alerts', icon: 'alert-circle', isPositive: false },
  { label: 'MTTA', value: '12m', delta: -18, deltaLabel: '% vs last period', href: '/alerts', icon: 'clock', isPositive: false },
  { label: 'Evidence Expiring', value: 14, delta: 6, deltaLabel: 'next 30 days', href: '/evidence', icon: 'file-warning', isPositive: false },
  { label: 'Overdue Reviews', value: 5, delta: 2, deltaLabel: 'vs last period', href: '/personnel', icon: 'user-x', isPositive: false },
];

export const frameworkPostureData = [
  { name: 'SOC 2 Type II', passing: 26, failing: 5, inProgress: 6, na: 3, total: 40 },
  { name: 'HIPAA', passing: 18, failing: 8, inProgress: 4, na: 2, total: 32 },
];

export const frameworks: Framework[] = [
  {
    id: 'fw-1', name: 'SOC 2 Type II', standard: 'SOC2', compliancePct: 78,
    status: 'in_progress', controlCounts: { passing: 26, failing: 5, inProgress: 6, na: 3 },
    targetDate: '2026-08-15',
  },
  {
    id: 'fw-2', name: 'HIPAA Security Rule', standard: 'HIPAA', compliancePct: 65,
    status: 'in_progress', controlCounts: { passing: 18, failing: 8, inProgress: 4, na: 2 },
    targetDate: '2026-10-01',
  },
];

export const priorityQueue: PriorityItem[] = [
  { id: 'pq-1', type: 'alert', severity: 'critical', title: 'Unencrypted PHI detected in S3 bucket', age: '2h', action: 'Investigate' },
  { id: 'pq-2', type: 'control', severity: 'critical', title: 'CC-7.2 Encryption at Rest — failing', age: '3d', action: 'Remediate' },
  { id: 'pq-3', type: 'alert', severity: 'critical', title: 'Root account login detected — AWS', age: '45m', action: 'Investigate' },
  { id: 'pq-4', type: 'evidence', severity: 'high', title: 'Penetration test report expiring in 5 days', age: '5d', action: 'Renew' },
  { id: 'pq-5', type: 'alert', severity: 'high', title: 'MFA disabled for admin user jdoe@meridian.io', age: '1d', action: 'Investigate' },
  { id: 'pq-6', type: 'review', severity: 'high', title: 'Quarterly access review overdue — Engineering', age: '7d', action: 'Start Review' },
  { id: 'pq-7', type: 'control', severity: 'medium', title: 'A1.1 Vulnerability Scanning — evidence gap', age: '12d', action: 'Upload Evidence' },
  { id: 'pq-8', type: 'alert', severity: 'high', title: 'Unusual data export volume from prod DB', age: '6h', action: 'Investigate' },
];

export const recentActivity: ActivityItem[] = [
  { id: 'a1', actor: 'Sarah Chen', action: 'resolved alert', entity: 'ALT-1042', entityType: 'alert', timestamp: '5 min ago', avatarInitials: 'SC' },
  { id: 'a2', actor: 'James Wilson', action: 'uploaded evidence for', entity: 'CC-6.1 Access Control', entityType: 'control', timestamp: '12 min ago', avatarInitials: 'JW' },
  { id: 'a3', actor: 'Maria Garcia', action: 'changed status to Investigating on', entity: 'INC-0023', entityType: 'incident', timestamp: '28 min ago', avatarInitials: 'MG' },
  { id: 'a4', actor: 'Alex Kim', action: 'approved policy', entity: 'Data Retention Policy v2.1', entityType: 'policy', timestamp: '1h ago', avatarInitials: 'AK' },
  { id: 'a5', actor: 'David Park', action: 'completed access review for', entity: 'Product Team', entityType: 'review', timestamp: '2h ago', avatarInitials: 'DP' },
  { id: 'a6', actor: 'Sarah Chen', action: 'escalated alert to incident', entity: 'ALT-1038 → INC-0024', entityType: 'incident', timestamp: '3h ago', avatarInitials: 'SC' },
  { id: 'a7', actor: 'System', action: 'auto-collected evidence from', entity: 'AWS CloudTrail', entityType: 'integration', timestamp: '3h ago', avatarInitials: 'SY' },
  { id: 'a8', actor: 'James Wilson', action: 'updated control status', entity: 'CC-7.1 Encryption in Transit', entityType: 'control', timestamp: '4h ago', avatarInitials: 'JW' },
];

export const alerts: Alert[] = [
  { id: 'ALT-1055', severity: 'critical', title: 'Unencrypted PHI detected in S3 bucket', source: 'AWS', controlRef: 'CC-7.2', status: 'open', owner: null, openedAt: '2026-04-11T08:15:00Z', age: '2h' },
  { id: 'ALT-1054', severity: 'critical', title: 'Root account login — AWS production', source: 'AWS CloudTrail', controlRef: 'CC-6.1', status: 'open', owner: null, openedAt: '2026-04-11T09:30:00Z', age: '45m' },
  { id: 'ALT-1053', severity: 'critical', title: 'WAF rule bypass attempt detected', source: 'Cloudflare', controlRef: 'CC-6.6', status: 'acknowledged', owner: 'Sarah Chen', openedAt: '2026-04-11T06:00:00Z', age: '4h' },
  { id: 'ALT-1052', severity: 'high', title: 'MFA disabled for admin user', source: 'Okta', controlRef: 'CC-6.1', status: 'open', owner: null, openedAt: '2026-04-10T14:00:00Z', age: '1d' },
  { id: 'ALT-1051', severity: 'high', title: 'Unusual data export from production database', source: 'Datadog', controlRef: 'CC-6.8', status: 'investigating', owner: 'James Wilson', openedAt: '2026-04-11T04:00:00Z', age: '6h' },
  { id: 'ALT-1050', severity: 'high', title: 'Expired SSL certificate on api.meridian.io', source: 'Internal Scanner', controlRef: 'CC-7.1', status: 'open', owner: 'Alex Kim', openedAt: '2026-04-10T10:00:00Z', age: '1d' },
  { id: 'ALT-1049', severity: 'medium', title: 'New IAM role created with admin privileges', source: 'AWS CloudTrail', controlRef: 'CC-6.3', status: 'open', owner: null, openedAt: '2026-04-10T08:00:00Z', age: '2d' },
  { id: 'ALT-1048', severity: 'medium', title: 'Security group rule allows 0.0.0.0/0 ingress', source: 'AWS Config', controlRef: 'CC-6.6', status: 'acknowledged', owner: 'David Park', openedAt: '2026-04-09T12:00:00Z', age: '2d' },
  { id: 'ALT-1047', severity: 'low', title: 'CloudTrail logging paused in us-west-2', source: 'AWS', controlRef: 'CC-7.3', status: 'open', owner: null, openedAt: '2026-04-09T06:00:00Z', age: '3d' },
  { id: 'ALT-1046', severity: 'low', title: 'Failed login attempts from unknown IP', source: 'Okta', controlRef: 'CC-6.1', status: 'dismissed', owner: 'Sarah Chen', openedAt: '2026-04-08T18:00:00Z', age: '3d' },
];

export const incidents: Incident[] = [
  { id: 'INC-0024', title: 'Potential PHI exposure via misconfigured S3', severity: 'critical', status: 'investigating', priority: 'p1', owner: 'Sarah Chen', slaDeadline: '2026-04-11T18:00:00Z', openedAt: '2026-04-11T07:00:00Z' },
  { id: 'INC-0023', title: 'Unauthorized root account access — AWS prod', severity: 'critical', status: 'open', priority: 'p1', owner: 'James Wilson', slaDeadline: '2026-04-11T20:00:00Z', openedAt: '2026-04-11T09:30:00Z' },
  { id: 'INC-0022', title: 'Admin MFA bypass incident', severity: 'high', status: 'investigating', priority: 'p2', owner: 'Maria Garcia', slaDeadline: '2026-04-12T14:00:00Z', openedAt: '2026-04-10T14:00:00Z' },
  { id: 'INC-0021', title: 'Suspicious data exfiltration attempt', severity: 'high', status: 'contained', priority: 'p2', owner: 'Alex Kim', slaDeadline: '2026-04-12T10:00:00Z', openedAt: '2026-04-10T04:00:00Z' },
  { id: 'INC-0020', title: 'SSL certificate expiry on production API', severity: 'medium', status: 'resolved', priority: 'p3', owner: 'David Park', slaDeadline: '2026-04-13T10:00:00Z', openedAt: '2026-04-09T10:00:00Z' },
  { id: 'INC-0019', title: 'Firewall misconfiguration — staging env', severity: 'medium', status: 'resolved', priority: 'p3', owner: 'Sarah Chen', slaDeadline: '2026-04-12T08:00:00Z', openedAt: '2026-04-08T08:00:00Z' },
  { id: 'INC-0018', title: 'Unauthorized IAM policy change', severity: 'high', status: 'resolved', priority: 'p2', owner: 'James Wilson', slaDeadline: '2026-04-10T16:00:00Z', openedAt: '2026-04-07T16:00:00Z' },
  { id: 'INC-0017', title: 'Endpoint malware detection — workstation', severity: 'low', status: 'closed', priority: 'p4', owner: 'Maria Garcia', slaDeadline: '2026-04-14T10:00:00Z', openedAt: '2026-04-06T10:00:00Z' },
];

export const controls: Control[] = [
  { id: 'c1', ref: 'CC-6.1', title: 'Logical Access Controls', framework: 'SOC 2', category: 'Access Control', status: 'implemented', owner: 'Sarah Chen', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'weekly', evidenceCount: 4 },
  { id: 'c2', ref: 'CC-6.2', title: 'User Authentication', framework: 'SOC 2', category: 'Access Control', status: 'implemented', owner: 'James Wilson', implementationPct: 100, lastTested: '2026-04-09', testFrequency: 'daily', evidenceCount: 3 },
  { id: 'c3', ref: 'CC-6.3', title: 'Role-Based Access', framework: 'SOC 2', category: 'Access Control', status: 'in_progress', owner: 'Alex Kim', implementationPct: 65, lastTested: '2026-04-05', testFrequency: 'monthly', evidenceCount: 2 },
  { id: 'c4', ref: 'CC-7.1', title: 'Encryption in Transit', framework: 'SOC 2', category: 'Encryption', status: 'implemented', owner: 'David Park', implementationPct: 100, lastTested: '2026-04-08', testFrequency: 'continuous', evidenceCount: 5 },
  { id: 'c5', ref: 'CC-7.2', title: 'Encryption at Rest', framework: 'SOC 2', category: 'Encryption', status: 'failing', owner: 'Sarah Chen', implementationPct: 40, lastTested: '2026-04-11', testFrequency: 'continuous', evidenceCount: 1 },
  { id: 'c6', ref: 'CC-6.6', title: 'Network Security', framework: 'SOC 2', category: 'Network', status: 'in_progress', owner: 'James Wilson', implementationPct: 75, lastTested: '2026-04-07', testFrequency: 'weekly', evidenceCount: 3 },
  { id: 'c7', ref: 'CC-7.3', title: 'Logging & Monitoring', framework: 'SOC 2', category: 'Monitoring', status: 'implemented', owner: 'Maria Garcia', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 6 },
  { id: 'c8', ref: 'CC-6.8', title: 'Data Loss Prevention', framework: 'SOC 2', category: 'Data Protection', status: 'not_implemented', owner: 'Alex Kim', implementationPct: 0, lastTested: '', testFrequency: 'monthly', evidenceCount: 0 },
  { id: 'c9', ref: 'HP-1.1', title: 'PHI Access Controls', framework: 'HIPAA', category: 'Privacy', status: 'implemented', owner: 'Sarah Chen', implementationPct: 100, lastTested: '2026-04-09', testFrequency: 'weekly', evidenceCount: 4 },
  { id: 'c10', ref: 'HP-1.2', title: 'PHI Encryption', framework: 'HIPAA', category: 'Privacy', status: 'failing', owner: 'David Park', implementationPct: 55, lastTested: '2026-04-11', testFrequency: 'continuous', evidenceCount: 2 },
  { id: 'c11', ref: 'HP-2.1', title: 'Workforce Training', framework: 'HIPAA', category: 'Administrative', status: 'in_progress', owner: 'Maria Garcia', implementationPct: 70, lastTested: '2026-04-06', testFrequency: 'quarterly', evidenceCount: 1 },
  { id: 'c12', ref: 'HP-3.1', title: 'Incident Response Plan', framework: 'HIPAA', category: 'Incident Response', status: 'implemented', owner: 'James Wilson', implementationPct: 100, lastTested: '2026-04-04', testFrequency: 'quarterly', evidenceCount: 3 },
];

export const assets: Asset[] = [
  { id: 'ast-1', name: 'prod-api-01', type: 'server', environment: 'Production', owner: 'David Park', riskScore: 85, complianceStatus: 'Non-compliant', lastScanned: '2026-04-11T08:00:00Z' },
  { id: 'ast-2', name: 'prod-db-primary', type: 'database', environment: 'Production', owner: 'Alex Kim', riskScore: 72, complianceStatus: 'Partial', lastScanned: '2026-04-11T06:00:00Z' },
  { id: 'ast-3', name: 'meridian-app', type: 'application', environment: 'Production', owner: 'Sarah Chen', riskScore: 45, complianceStatus: 'Compliant', lastScanned: '2026-04-10T22:00:00Z' },
  { id: 'ast-4', name: 'aws-s3-phi-bucket', type: 'cloud_resource', environment: 'Production', owner: 'James Wilson', riskScore: 95, complianceStatus: 'Non-compliant', lastScanned: '2026-04-11T09:00:00Z' },
  { id: 'ast-5', name: 'staging-k8s-cluster', type: 'cloud_resource', environment: 'Staging', owner: 'David Park', riskScore: 30, complianceStatus: 'Compliant', lastScanned: '2026-04-10T18:00:00Z' },
  { id: 'ast-6', name: 'corp-okta-tenant', type: 'saas_app', environment: 'Corporate', owner: 'Maria Garcia', riskScore: 20, complianceStatus: 'Compliant', lastScanned: '2026-04-11T07:00:00Z' },
  { id: 'ast-7', name: 'vpn-gateway', type: 'network', environment: 'Production', owner: 'Alex Kim', riskScore: 55, complianceStatus: 'Partial', lastScanned: '2026-04-10T12:00:00Z' },
  { id: 'ast-8', name: 'dev-workstation-pool', type: 'endpoint', environment: 'Corporate', owner: 'James Wilson', riskScore: 35, complianceStatus: 'Compliant', lastScanned: '2026-04-09T10:00:00Z' },
];

export const integrations = [
  { id: 'int-1', provider: 'aws', name: 'AWS', category: 'Cloud', status: 'connected', lastSync: '5 min ago', controlsMapped: 12 },
  { id: 'int-2', provider: 'okta', name: 'Okta', category: 'Identity', status: 'connected', lastSync: '12 min ago', controlsMapped: 8 },
  { id: 'int-3', provider: 'github', name: 'GitHub', category: 'Code', status: 'connected', lastSync: '1h ago', controlsMapped: 5 },
  { id: 'int-4', provider: 'datadog', name: 'Datadog', category: 'Monitoring', status: 'connected', lastSync: '3 min ago', controlsMapped: 6 },
  { id: 'int-5', provider: 'jira', name: 'Jira', category: 'Ticketing', status: 'error', lastSync: '2d ago', controlsMapped: 3 },
  { id: 'int-6', provider: 'slack', name: 'Slack', category: 'Communication', status: 'error', lastSync: '1d ago', controlsMapped: 0 },
  { id: 'int-7', provider: 'gcp', name: 'Google Cloud', category: 'Cloud', status: 'disconnected', lastSync: 'Never', controlsMapped: 0 },
  { id: 'int-8', provider: 'jamf', name: 'Jamf', category: 'MDM', status: 'disconnected', lastSync: 'Never', controlsMapped: 0 },
];
