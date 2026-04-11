import { Link } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw,
  Terminal, Paperclip, Bug, Wrench, Cpu, User, FileText, Download,
  ChevronRight, Shield, Calendar, ExternalLink, Image, File,
} from 'lucide-react';

/* ── Test Run Data ───────────────────────────────────── */
const testRunsMap: Record<string, {
  id: string; name: string; control: string; status: string; method: string;
  tester: string; date: string; duration: string; findings: number;
  description: string; framework: string; environment: string; version: string;
}> = {
  'TR-001': { id: 'TR-001', name: 'SOC 2 Access Control Quarterly', control: 'AC-1', status: 'passed', method: 'automated', tester: 'System', date: '2026-04-10', duration: '3m 42s', findings: 0, description: 'Quarterly validation of logical access controls against SOC 2 CC6.1 requirements. Tests user provisioning, deprovisioning, access reviews, and privilege escalation controls.', framework: 'SOC 2', environment: 'Production', version: 'v3.2.1' },
  'TR-002': { id: 'TR-002', name: 'Encryption At Rest Validation', control: 'SC-3', status: 'failed', method: 'automated', tester: 'System', date: '2026-04-09', duration: '5m 18s', findings: 3, description: 'Automated scan of all storage volumes, databases, and object stores to verify AES-256 encryption at rest. Checks key rotation schedules and certificate validity.', framework: 'HIPAA', environment: 'Production', version: 'v2.8.0' },
  'TR-003': { id: 'TR-003', name: 'Change Management Walkthrough', control: 'CC-8.1', status: 'passed', method: 'manual', tester: 'Sarah Chen', date: '2026-04-08', duration: '45m', findings: 0, description: 'Manual walkthrough of change management process including CAB review, approval workflows, rollback procedures, and post-implementation verification.', framework: 'SOC 2', environment: 'All', version: 'v1.5.0' },
  'TR-004': { id: 'TR-004', name: 'Incident Response Tabletop', control: 'IR-1', status: 'in_progress', method: 'manual', tester: 'James Wilson', date: '2026-04-11', duration: '—', findings: 0, description: 'Tabletop exercise simulating a ransomware attack scenario. Tests communication chains, escalation procedures, containment strategies, and recovery processes.', framework: 'NIST CSF', environment: 'Simulation', version: 'v4.0.0' },
  'TR-005': { id: 'TR-005', name: 'Vendor Risk Assessment Review', control: 'VR-2', status: 'passed', method: 'manual', tester: 'Maria Lopez', date: '2026-04-07', duration: '1h 12m', findings: 1, description: 'Review of third-party vendor security assessments, SOC 2 reports, and contractual security obligations. Includes data flow analysis and risk scoring.', framework: 'SOC 2', environment: 'N/A', version: 'v2.1.0' },
  'TR-006': { id: 'TR-006', name: 'Password Policy Compliance Scan', control: 'AC-7', status: 'failed', method: 'automated', tester: 'System', date: '2026-04-06', duration: '2m 05s', findings: 12, description: 'Automated scan of Active Directory and IAM configurations to verify password complexity, rotation, MFA enforcement, and account lockout policies.', framework: 'PCI DSS', environment: 'Production', version: 'v3.0.2' },
  'TR-007': { id: 'TR-007', name: 'Data Backup Integrity Check', control: 'BC-3', status: 'passed', method: 'automated', tester: 'System', date: '2026-04-05', duration: '8m 33s', findings: 0, description: 'Validates backup integrity by performing checksum verification, test restores, and RPO/RTO compliance checks across all critical data stores.', framework: 'ISO 22301', environment: 'DR Site', version: 'v1.9.4' },
  'TR-008': { id: 'TR-008', name: 'Physical Security Walkthrough', control: 'PE-1', status: 'exception', method: 'manual', tester: 'David Park', date: '2026-04-04', duration: '2h', findings: 2, description: 'On-site inspection of physical security controls including badge access, CCTV coverage, visitor logs, server room environmental controls, and clean desk policy.', framework: 'SOC 2', environment: 'Office / Data Center', version: 'v2.3.0' },
};

/* ── Execution Logs ──────────────────────────────────── */
const executionLogsMap: Record<string, Array<{ timestamp: string; level: string; message: string; source: string }>> = {
  'TR-001': [
    { timestamp: '2026-04-10 09:00:01', level: 'info', source: 'scheduler', message: 'Test run TR-001 initiated by automated scheduler (cron: 0 9 1 */3 *)' },
    { timestamp: '2026-04-10 09:00:03', level: 'info', source: 'auth', message: 'Connected to IAM provider (Okta) via API — 342 user accounts loaded' },
    { timestamp: '2026-04-10 09:00:15', level: 'info', source: 'access-review', message: 'Scanning role-based access matrix... 28 roles, 342 users, 1,247 permissions' },
    { timestamp: '2026-04-10 09:01:02', level: 'info', source: 'access-review', message: 'Privilege escalation check: 0 violations detected across 42 admin accounts' },
    { timestamp: '2026-04-10 09:01:45', level: 'info', source: 'provisioning', message: 'Deprovisioning audit: 12 terminated employees verified — all access revoked within SLA' },
    { timestamp: '2026-04-10 09:02:30', level: 'info', source: 'mfa', message: 'MFA enforcement check: 342/342 accounts (100%) have MFA enabled' },
    { timestamp: '2026-04-10 09:03:18', level: 'info', source: 'review-cycle', message: 'Quarterly access review completion: 28/28 departments reviewed, 0 exceptions' },
    { timestamp: '2026-04-10 09:03:42', level: 'success', source: 'engine', message: 'Test run TR-001 completed successfully — PASSED (0 findings, 7 checks)' },
  ],
  'TR-002': [
    { timestamp: '2026-04-09 14:00:01', level: 'info', source: 'scheduler', message: 'Test run TR-002 initiated by automated scheduler' },
    { timestamp: '2026-04-09 14:00:05', level: 'info', source: 'scanner', message: 'Connected to AWS account — scanning 48 storage resources across 3 regions' },
    { timestamp: '2026-04-09 14:01:12', level: 'info', source: 'scanner', message: 'S3 bucket scan: 32/34 buckets encrypted with AES-256 (SSE-S3/SSE-KMS)' },
    { timestamp: '2026-04-09 14:01:13', level: 'error', source: 'scanner', message: 'FINDING: s3://staging-data-lake — No encryption configured (Bucket Policy missing)' },
    { timestamp: '2026-04-09 14:01:14', level: 'error', source: 'scanner', message: 'FINDING: s3://temp-analytics-export — AES-128 detected, does not meet AES-256 requirement' },
    { timestamp: '2026-04-09 14:02:45', level: 'info', source: 'scanner', message: 'RDS instance scan: 8/8 instances using AES-256 encryption — PASS' },
    { timestamp: '2026-04-09 14:03:50', level: 'info', source: 'key-mgmt', message: 'KMS key rotation check: 11/12 keys within rotation schedule' },
    { timestamp: '2026-04-09 14:03:51', level: 'warn', source: 'key-mgmt', message: 'FINDING: KMS key arn:aws:kms:us-east-1:***:key/abc123 — last rotated 400 days ago (SLA: 365 days)' },
    { timestamp: '2026-04-09 14:05:18', level: 'error', source: 'engine', message: 'Test run TR-002 completed — FAILED (3 findings: 2 critical, 1 warning)' },
  ],
  'TR-006': [
    { timestamp: '2026-04-06 06:00:01', level: 'info', source: 'scheduler', message: 'Test run TR-006 initiated — Password Policy Compliance Scan' },
    { timestamp: '2026-04-06 06:00:04', level: 'info', source: 'ad-connector', message: 'Connected to Active Directory — 892 user accounts, 156 service accounts' },
    { timestamp: '2026-04-06 06:00:30', level: 'warn', source: 'policy-check', message: '8 accounts found with passwords older than 90 days (max: 90 days)' },
    { timestamp: '2026-04-06 06:00:45', level: 'error', source: 'policy-check', message: '3 service accounts without MFA enabled — policy violation' },
    { timestamp: '2026-04-06 06:01:10', level: 'error', source: 'policy-check', message: '1 admin account with password complexity below minimum (12 chars, special required)' },
    { timestamp: '2026-04-06 06:02:05', level: 'error', source: 'engine', message: 'Test run TR-006 completed — FAILED (12 findings: 4 critical, 8 warnings)' },
  ],
};

// Default logs for tests without specific entries
const defaultLogs = (id: string, name: string, status: string): Array<{ timestamp: string; level: string; message: string; source: string }> => [
  { timestamp: '2026-04-10 09:00:00', level: 'info', source: 'scheduler', message: `Test run ${id} initiated — ${name}` },
  { timestamp: '2026-04-10 09:00:05', level: 'info', source: 'engine', message: 'Environment validation passed, beginning test execution...' },
  { timestamp: '2026-04-10 09:15:00', level: 'info', source: 'engine', message: 'All test steps completed, generating report...' },
  { timestamp: '2026-04-10 09:15:30', level: status === 'passed' ? 'success' : status === 'failed' ? 'error' : 'info', source: 'engine', message: `Test run ${id} completed — ${status.toUpperCase()}` },
];

/* ── Evidence Attachments ────────────────────────────── */
const evidenceMap: Record<string, Array<{ id: string; name: string; type: string; size: string; uploadedBy: string; date: string; status: string }>> = {
  'TR-001': [
    { id: 'EV-101', name: 'access_review_report_Q1_2026.pdf', type: 'pdf', size: '2.4 MB', uploadedBy: 'System', date: '2026-04-10', status: 'verified' },
    { id: 'EV-102', name: 'okta_user_export_20260410.csv', type: 'csv', size: '856 KB', uploadedBy: 'System', date: '2026-04-10', status: 'verified' },
    { id: 'EV-103', name: 'privilege_escalation_scan.json', type: 'json', size: '124 KB', uploadedBy: 'System', date: '2026-04-10', status: 'verified' },
    { id: 'EV-104', name: 'mfa_enforcement_screenshot.png', type: 'image', size: '340 KB', uploadedBy: 'System', date: '2026-04-10', status: 'verified' },
  ],
  'TR-002': [
    { id: 'EV-201', name: 'encryption_scan_results.json', type: 'json', size: '1.1 MB', uploadedBy: 'System', date: '2026-04-09', status: 'verified' },
    { id: 'EV-202', name: 's3_bucket_inventory.csv', type: 'csv', size: '45 KB', uploadedBy: 'System', date: '2026-04-09', status: 'verified' },
    { id: 'EV-203', name: 'kms_key_rotation_report.pdf', type: 'pdf', size: '890 KB', uploadedBy: 'System', date: '2026-04-09', status: 'needs_review' },
    { id: 'EV-204', name: 'failed_bucket_screenshot.png', type: 'image', size: '520 KB', uploadedBy: 'Sarah Chen', date: '2026-04-09', status: 'verified' },
    { id: 'EV-205', name: 'remediation_plan_encryption.docx', type: 'doc', size: '78 KB', uploadedBy: 'James Wilson', date: '2026-04-10', status: 'pending' },
  ],
  'TR-006': [
    { id: 'EV-601', name: 'ad_password_policy_export.xml', type: 'json', size: '230 KB', uploadedBy: 'System', date: '2026-04-06', status: 'verified' },
    { id: 'EV-602', name: 'mfa_compliance_report.pdf', type: 'pdf', size: '1.8 MB', uploadedBy: 'System', date: '2026-04-06', status: 'verified' },
    { id: 'EV-603', name: 'stale_password_accounts.csv', type: 'csv', size: '12 KB', uploadedBy: 'System', date: '2026-04-06', status: 'verified' },
  ],
};

const defaultEvidence = (id: string): Array<{ id: string; name: string; type: string; size: string; uploadedBy: string; date: string; status: string }> => [
  { id: `EV-${id}-1`, name: `test_report_${id.toLowerCase()}.pdf`, type: 'pdf', size: '1.2 MB', uploadedBy: 'System', date: '2026-04-10', status: 'verified' },
  { id: `EV-${id}-2`, name: `execution_log_${id.toLowerCase()}.json`, type: 'json', size: '340 KB', uploadedBy: 'System', date: '2026-04-10', status: 'verified' },
];

/* ── Findings ────────────────────────────────────────── */
const findingsMap: Record<string, Array<{ id: string; title: string; severity: string; category: string; asset: string; description: string; cve?: string; status: string; assignee: string }>> = {
  'TR-002': [
    { id: 'F-201', title: 'S3 Bucket Missing Encryption', severity: 'critical', category: 'Data Protection', asset: 's3://staging-data-lake', description: 'Staging data lake bucket has no server-side encryption configured. Contains processed analytics data that may include PII.', status: 'open', assignee: 'DevOps Team' },
    { id: 'F-202', title: 'Insufficient Encryption Standard', severity: 'high', category: 'Data Protection', asset: 's3://temp-analytics-export', description: 'Temporary analytics export bucket using AES-128 encryption instead of required AES-256 (SSE-KMS).', status: 'in_remediation', assignee: 'Cloud Engineering' },
    { id: 'F-203', title: 'KMS Key Rotation Overdue', severity: 'medium', category: 'Key Management', asset: 'KMS key abc123', description: 'KMS encryption key has not been rotated in 400 days, exceeding the 365-day rotation policy.', cve: 'CWE-324', status: 'in_remediation', assignee: 'Security Team' },
  ],
  'TR-005': [
    { id: 'F-501', title: 'Vendor Missing Updated SOC 2 Report', severity: 'low', category: 'Vendor Risk', asset: 'Acme Analytics', description: 'Vendor Acme Analytics has not provided an updated SOC 2 Type II report for the current audit period.', status: 'open', assignee: 'Maria Lopez' },
  ],
  'TR-006': [
    { id: 'F-601', title: 'Stale Passwords — 8 Accounts', severity: 'high', category: 'Access Control', asset: 'Active Directory', description: '8 user accounts have passwords exceeding the 90-day maximum age policy. Accounts span Engineering and Marketing departments.', status: 'in_remediation', assignee: 'IT Operations' },
    { id: 'F-602', title: 'Service Accounts Without MFA', severity: 'critical', category: 'Authentication', asset: 'Active Directory', description: '3 service accounts (svc-deploy, svc-monitoring, svc-backup) do not have MFA enabled, violating security policy.', status: 'open', assignee: 'DevOps Team' },
    { id: 'F-603', title: 'Weak Admin Password', severity: 'critical', category: 'Access Control', asset: 'Active Directory', description: 'Admin account "legacy-admin" has a password that does not meet the 12-character minimum complexity requirement.', status: 'remediated', assignee: 'IT Operations' },
    { id: 'F-604', title: 'Inactive Accounts Not Disabled', severity: 'medium', category: 'Access Control', asset: 'Active Directory', description: '5 accounts with no login activity in 60+ days remain enabled. Policy requires disabling after 45 days of inactivity.', status: 'open', assignee: 'IT Operations' },
    { id: 'F-605', title: 'Missing Password History Enforcement', severity: 'medium', category: 'Access Control', asset: 'Active Directory', description: 'Password history enforcement is set to 3 previous passwords; policy requires minimum of 12.', status: 'in_remediation', assignee: 'IT Operations' },
    { id: 'F-606', title: 'Account Lockout Threshold Too High', severity: 'low', category: 'Access Control', asset: 'Active Directory', description: 'Account lockout threshold set to 10 failed attempts; policy recommends maximum of 5.', status: 'open', assignee: 'IT Operations' },
  ],
  'TR-008': [
    { id: 'F-801', title: 'CCTV Coverage Gap — Loading Dock', severity: 'medium', category: 'Physical Security', asset: 'Building A — Loading Dock', description: 'Camera #14 has a 15-degree blind spot covering the east side of the loading dock entrance.', status: 'in_remediation', assignee: 'Facilities' },
    { id: 'F-802', title: 'Visitor Log Gap', severity: 'low', category: 'Physical Security', asset: 'Building A — Lobby', description: 'Visitor log entries for March 28 are missing checkout times for 3 visitors. Front desk process needs reinforcement.', status: 'open', assignee: 'Facilities' },
  ],
};

/* ── Remediation Workflow ────────────────────────────── */
const remediationMap: Record<string, Array<{ findingId: string; title: string; status: string; priority: string; assignee: string; created: string; dueDate: string; steps: Array<{ step: string; status: string; completedDate?: string; assignee: string }> }>> = {
  'TR-002': [
    {
      findingId: 'F-201', title: 'Enable S3 Encryption — staging-data-lake', status: 'in_progress', priority: 'critical',
      assignee: 'DevOps Team', created: '2026-04-09', dueDate: '2026-04-16',
      steps: [
        { step: 'Create remediation ticket (JIRA-4521)', status: 'done', completedDate: '2026-04-09', assignee: 'Sarah Chen' },
        { step: 'Assess data sensitivity classification', status: 'done', completedDate: '2026-04-10', assignee: 'Data Team' },
        { step: 'Enable SSE-KMS encryption on bucket', status: 'in_progress', assignee: 'DevOps Team' },
        { step: 'Re-encrypt existing objects', status: 'pending', assignee: 'DevOps Team' },
        { step: 'Verify encryption with re-scan', status: 'pending', assignee: 'System' },
        { step: 'Close finding and update evidence', status: 'pending', assignee: 'Sarah Chen' },
      ],
    },
    {
      findingId: 'F-202', title: 'Upgrade Encryption — temp-analytics-export', status: 'in_progress', priority: 'high',
      assignee: 'Cloud Engineering', created: '2026-04-09', dueDate: '2026-04-18',
      steps: [
        { step: 'Create remediation ticket (JIRA-4522)', status: 'done', completedDate: '2026-04-09', assignee: 'Sarah Chen' },
        { step: 'Update bucket policy to SSE-KMS (AES-256)', status: 'in_progress', assignee: 'Cloud Engineering' },
        { step: 'Re-encrypt existing objects', status: 'pending', assignee: 'Cloud Engineering' },
        { step: 'Run verification scan', status: 'pending', assignee: 'System' },
      ],
    },
    {
      findingId: 'F-203', title: 'Rotate KMS Key abc123', status: 'in_progress', priority: 'medium',
      assignee: 'Security Team', created: '2026-04-09', dueDate: '2026-04-23',
      steps: [
        { step: 'Schedule key rotation window', status: 'done', completedDate: '2026-04-10', assignee: 'Security Team' },
        { step: 'Perform key rotation via AWS KMS', status: 'in_progress', assignee: 'Security Team' },
        { step: 'Verify dependent services still functional', status: 'pending', assignee: 'DevOps Team' },
        { step: 'Update key rotation schedule to automatic', status: 'pending', assignee: 'Security Team' },
      ],
    },
  ],
  'TR-006': [
    {
      findingId: 'F-601', title: 'Force Password Reset — 8 Stale Accounts', status: 'in_progress', priority: 'high',
      assignee: 'IT Operations', created: '2026-04-06', dueDate: '2026-04-13',
      steps: [
        { step: 'Notify affected users via email', status: 'done', completedDate: '2026-04-06', assignee: 'IT Operations' },
        { step: 'Force password reset on next login', status: 'done', completedDate: '2026-04-07', assignee: 'IT Operations' },
        { step: 'Verify all 8 accounts have new passwords', status: 'in_progress', assignee: 'IT Operations' },
        { step: 'Re-run compliance scan', status: 'pending', assignee: 'System' },
      ],
    },
    {
      findingId: 'F-602', title: 'Enable MFA on Service Accounts', status: 'not_started', priority: 'critical',
      assignee: 'DevOps Team', created: '2026-04-06', dueDate: '2026-04-11',
      steps: [
        { step: 'Evaluate MFA options for service accounts', status: 'pending', assignee: 'DevOps Team' },
        { step: 'Implement certificate-based auth or hardware tokens', status: 'pending', assignee: 'DevOps Team' },
        { step: 'Test service account connectivity post-MFA', status: 'pending', assignee: 'QA Team' },
        { step: 'Update runbooks and documentation', status: 'pending', assignee: 'DevOps Team' },
      ],
    },
    {
      findingId: 'F-603', title: 'Reset Weak Admin Password', status: 'completed', priority: 'critical',
      assignee: 'IT Operations', created: '2026-04-06', dueDate: '2026-04-07',
      steps: [
        { step: 'Force immediate password reset', status: 'done', completedDate: '2026-04-06', assignee: 'IT Operations' },
        { step: 'Verify new password meets complexity requirements', status: 'done', completedDate: '2026-04-06', assignee: 'IT Operations' },
        { step: 'Review account activity for anomalies', status: 'done', completedDate: '2026-04-07', assignee: 'Security Team' },
      ],
    },
  ],
};

/* ── Helpers ──────────────────────────────────────────── */
function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: React.ReactNode }> = {
    passed: { variant: 'default', label: 'Passed', icon: <CheckCircle className="h-3 w-3" /> },
    failed: { variant: 'destructive', label: 'Failed', icon: <XCircle className="h-3 w-3" /> },
    in_progress: { variant: 'secondary', label: 'In Progress', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
    exception: { variant: 'outline', label: 'Exception', icon: <AlertTriangle className="h-3 w-3" /> },
  };
  const s = map[status] ?? { variant: 'outline' as const, label: status, icon: null };
  return <Badge variant={s.variant} className="gap-1">{s.icon}{s.label}</Badge>;
}

function severityBadge(severity: string) {
  const map: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
    critical: 'destructive', high: 'default', medium: 'secondary', low: 'outline',
  };
  return <Badge variant={map[severity] ?? 'outline'} className="capitalize text-xs">{severity}</Badge>;
}

function logLevelColor(level: string) {
  const map: Record<string, string> = {
    info: 'text-blue-400', warn: 'text-yellow-400', error: 'text-red-400', success: 'text-green-400',
  };
  return map[level] ?? 'text-muted-foreground';
}

function fileIcon(type: string) {
  if (type === 'pdf') return <FileText className="h-4 w-4 text-red-400" />;
  if (type === 'image') return <Image className="h-4 w-4 text-blue-400" />;
  if (type === 'csv') return <File className="h-4 w-4 text-green-400" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function remediationStatusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    completed: { variant: 'default', label: 'Completed' },
    in_progress: { variant: 'secondary', label: 'In Progress' },
    not_started: { variant: 'outline', label: 'Not Started' },
  };
  const s = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
}

function stepStatusIcon(status: string) {
  if (status === 'done') return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
  if (status === 'in_progress') return <RefreshCw className="h-4 w-4 text-primary animate-spin shrink-0" />;
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
}

/* ── Component ───────────────────────────────────────── */
export function TestDetailView({ testId }: { testId: string }) {
  const test = testRunsMap[testId];

  if (!test) {
    return (
      <div className="p-6 space-y-4">
        <Link to="/tests" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Tests</Link>
        <Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">Test run "{testId}" not found.</p></CardContent></Card>
      </div>
    );
  }

  const logs = executionLogsMap[testId] ?? defaultLogs(test.id, test.name, test.status);
  const evidence = evidenceMap[testId] ?? defaultEvidence(test.id);
  const findings = findingsMap[testId] ?? [];
  const remediations = remediationMap[testId] ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-3">
        <Link to="/tests" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Tests
        </Link>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{test.name}</h1>
              {statusBadge(test.status)}
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">{test.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export</Button>
            <Button size="sm"><RefreshCw className="h-4 w-4 mr-1" />Re-run</Button>
          </div>
        </div>

        {/* Meta strip */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-mono font-medium text-foreground">{test.id}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />{test.framework}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Badge variant="outline" className="text-xs">{test.control}</Badge>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {test.method === 'automated' ? <Cpu className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            {test.method === 'automated' ? 'Automated' : 'Manual'} · {test.tester}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />{test.date}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />{test.duration}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs" className="gap-1"><Terminal className="h-3.5 w-3.5" />Execution Logs</TabsTrigger>
          <TabsTrigger value="evidence" className="gap-1"><Paperclip className="h-3.5 w-3.5" />Evidence ({evidence.length})</TabsTrigger>
          <TabsTrigger value="findings" className="gap-1"><Bug className="h-3.5 w-3.5" />Findings ({findings.length})</TabsTrigger>
          <TabsTrigger value="remediation" className="gap-1"><Wrench className="h-3.5 w-3.5" />Remediation ({remediations.length})</TabsTrigger>
        </TabsList>

        {/* ── Execution Logs ── */}
        <TabsContent value="logs">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Execution Log</CardTitle>
              <CardDescription>Step-by-step execution trace for this test run</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/30 border p-4 font-mono text-xs space-y-1.5 max-h-[500px] overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 leading-relaxed">
                    <span className="text-muted-foreground shrink-0 w-[140px]">{log.timestamp.split(' ')[1]}</span>
                    <span className={`shrink-0 w-[60px] uppercase font-semibold ${logLevelColor(log.level)}`}>{log.level}</span>
                    <span className="text-muted-foreground shrink-0 w-[100px]">[{log.source}]</span>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Evidence ── */}
        <TabsContent value="evidence">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Evidence Attachments</CardTitle>
                  <CardDescription>Documents and artifacts collected during test execution</CardDescription>
                </div>
                <Button variant="outline" size="sm"><Paperclip className="h-4 w-4 mr-1" />Attach File</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>File</TableHead><TableHead>Type</TableHead><TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {evidence.map(e => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {fileIcon(e.type)}
                          <span className="text-sm font-medium">{e.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs uppercase">{e.type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.size}</TableCell>
                      <TableCell className="text-sm">{e.uploadedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.date}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === 'verified' ? 'default' : e.status === 'needs_review' ? 'secondary' : 'outline'} className="text-xs capitalize">
                          {e.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {e.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell><Button variant="ghost" size="sm" className="h-7"><Download className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Findings ── */}
        <TabsContent value="findings">
          {findings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                <p className="text-sm font-medium">No findings</p>
                <p className="text-xs text-muted-foreground">This test run completed with zero findings.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['critical', 'high', 'medium', 'low'].map(sev => {
                  const count = findings.filter(f => f.severity === sev).length;
                  return (
                    <Card key={sev}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <span className="text-sm capitalize">{sev}</span>
                        <span className="text-lg font-bold">{count}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Findings Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>ID</TableHead><TableHead>Finding</TableHead><TableHead>Severity</TableHead>
                      <TableHead>Category</TableHead><TableHead>Asset</TableHead><TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {findings.map(f => (
                        <TableRow key={f.id}>
                          <TableCell className="font-mono text-xs">{f.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{f.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{f.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>{severityBadge(f.severity)}</TableCell>
                          <TableCell className="text-sm">{f.category}</TableCell>
                          <TableCell className="text-sm font-mono text-xs">{f.asset}</TableCell>
                          <TableCell className="text-sm">{f.assignee}</TableCell>
                          <TableCell>
                            <Badge variant={f.status === 'remediated' ? 'default' : f.status === 'in_remediation' ? 'secondary' : 'outline'} className="text-xs capitalize">
                              {f.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Remediation ── */}
        <TabsContent value="remediation">
          {remediations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                <p className="text-sm font-medium">No remediation required</p>
                <p className="text-xs text-muted-foreground">All checks passed — no remediation workflows needed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {remediations.map(r => {
                const completedSteps = r.steps.filter(s => s.status === 'done').length;
                const progress = Math.round((completedSteps / r.steps.length) * 100);
                return (
                  <Card key={r.findingId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">{r.title}</CardTitle>
                            {remediationStatusBadge(r.status)}
                            {severityBadge(r.priority)}
                          </div>
                          <CardDescription className="text-xs">
                            Finding {r.findingId} · Assigned to {r.assignee} · Due {r.dueDate}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{progress}%</p>
                          <Progress value={progress} className="w-24 h-1.5 mt-1" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {r.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-3 py-1.5">
                            {stepStatusIcon(step.status)}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${step.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{step.step}</p>
                              <p className="text-xs text-muted-foreground">
                                {step.assignee}{step.completedDate ? ` · Completed ${step.completedDate}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
