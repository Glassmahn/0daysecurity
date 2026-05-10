import { Link } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle,
  FileText, Download, Upload, Building2, Globe, Mail, MapPin, Calendar,
  ClipboardList, Wrench, File, Image, RefreshCw,
  TrendingUp, TrendingDown, Minus, Star, Phone,
} from 'lucide-react';

/* ── Vendor Data ─────────────────────────────────────── */
const vendorsMap: Record<string, {
  id: string; name: string; category: string; riskTier: string; riskScore: number;
  status: string; soc2: boolean; iso27001: boolean; hipaa: boolean;
  contractEnd: string; lastAssessment: string; contact: string; location: string;
  dataAccess: string; trend: string; website: string; employees: string;
  founded: string; primaryContact: string; phone: string; description: string;
}> = {
  'V-001': { id: 'V-001', name: 'Amazon Web Services', category: 'Cloud Infrastructure', riskTier: 'critical', riskScore: 82, status: 'approved', soc2: true, iso27001: true, hipaa: true, contractEnd: '2027-03-15', lastAssessment: '2026-03-01', contact: 'enterprise@aws.amazon.com', location: 'Seattle, WA', dataAccess: 'PHI, PII, Financial', trend: 'stable', website: 'aws.amazon.com', employees: '1,500,000+', founded: '2006', primaryContact: 'Alex Rivera (TAM)', phone: '+1 (206) 555-0142', description: 'Primary cloud infrastructure provider hosting production workloads, databases, and storage. Handles all PHI/PII processing and data lake operations.' },
  'V-002': { id: 'V-002', name: 'Okta', category: 'Identity & Access', riskTier: 'high', riskScore: 71, status: 'approved', soc2: true, iso27001: true, hipaa: false, contractEnd: '2026-12-31', lastAssessment: '2026-02-15', contact: 'security@okta.com', location: 'San Francisco, CA', dataAccess: 'PII, Authentication', trend: 'improving', website: 'okta.com', employees: '6,000+', founded: '2009', primaryContact: 'Jessica Park (CSM)', phone: '+1 (415) 555-0198', description: 'Identity provider for SSO, MFA, and lifecycle management. All employee and customer authentication flows route through Okta.' },
  'V-003': { id: 'V-003', name: 'Snowflake', category: 'Data Warehouse', riskTier: 'high', riskScore: 68, status: 'approved', soc2: true, iso27001: true, hipaa: true, contractEnd: '2026-09-30', lastAssessment: '2026-01-20', contact: 'trust@snowflake.com', location: 'Bozeman, MT', dataAccess: 'PHI, PII, Analytics', trend: 'stable', website: 'snowflake.com', employees: '7,000+', founded: '2012', primaryContact: 'Michael Torres (AE)', phone: '+1 (406) 555-0234', description: 'Cloud data warehouse for analytics, reporting, and data science workloads. Contains replicated copies of production PHI and PII for analytics.' },
  'V-004': { id: 'V-004', name: 'SendGrid', category: 'Email Service', riskTier: 'medium', riskScore: 55, status: 'approved', soc2: true, iso27001: false, hipaa: false, contractEnd: '2026-06-30', lastAssessment: '2025-12-10', contact: 'security@sendgrid.com', location: 'Denver, CO', dataAccess: 'PII, Email Content', trend: 'declining', website: 'sendgrid.com', employees: '1,500+', founded: '2009', primaryContact: 'Rachel Kim (Support)', phone: '+1 (303) 555-0167', description: 'Transactional and marketing email platform. Processes customer email addresses, names, and email content including password resets and notifications.' },
  'V-005': { id: 'V-005', name: 'Jira (Atlassian)', category: 'Project Management', riskTier: 'low', riskScore: 38, status: 'approved', soc2: true, iso27001: true, hipaa: false, contractEnd: '2027-01-15', lastAssessment: '2026-02-28', contact: 'trust@atlassian.com', location: 'Sydney, AU', dataAccess: 'Internal Tickets', trend: 'stable', website: 'atlassian.com', employees: '11,000+', founded: '2002', primaryContact: 'Tom Zhang (CSM)', phone: '+61 2 5555 0189', description: 'Project management and issue tracking for engineering and operations teams. Contains internal tickets, sprint data, and project documentation.' },
  'V-006': { id: 'V-006', name: 'Acme Analytics', category: 'Business Intelligence', riskTier: 'medium', riskScore: 48, status: 'under_review', soc2: false, iso27001: false, hipaa: false, contractEnd: '—', lastAssessment: '2026-04-01', contact: 'info@acmeanalytics.io', location: 'Austin, TX', dataAccess: 'Analytics Data', trend: 'new', website: 'acmeanalytics.io', employees: '120', founded: '2022', primaryContact: 'Dana Lee (Sales)', phone: '+1 (512) 555-0211', description: 'Emerging BI platform under evaluation for product analytics. Currently in onboarding assessment phase — no production data access yet.' },
  'V-007': { id: 'V-007', name: 'PagerDuty', category: 'Incident Management', riskTier: 'medium', riskScore: 52, status: 'approved', soc2: true, iso27001: true, hipaa: false, contractEnd: '2026-11-30', lastAssessment: '2026-01-05', contact: 'security@pagerduty.com', location: 'San Francisco, CA', dataAccess: 'Alert Data, PII', trend: 'stable', website: 'pagerduty.com', employees: '1,100+', founded: '2009', primaryContact: 'Chris Nguyen (TAM)', phone: '+1 (415) 555-0276', description: 'Incident alerting and on-call management platform. Receives infrastructure alerts containing system names, IPs, and on-call personnel PII.' },
  'V-008': { id: 'V-008', name: 'Legacy Payroll Co', category: 'HR / Payroll', riskTier: 'critical', riskScore: 29, status: 'needs_action', soc2: false, iso27001: false, hipaa: false, contractEnd: '2026-05-31', lastAssessment: '2025-06-15', contact: 'support@legacypayroll.com', location: 'Chicago, IL', dataAccess: 'PII, Financial, SSN', trend: 'declining', website: 'legacypayroll.com', employees: '85', founded: '1998', primaryContact: 'Bob Harris (Account Mgr)', phone: '+1 (312) 555-0145', description: 'Payroll processing vendor handling employee compensation, tax withholdings, SSNs, and bank routing information. Flagged for critical security deficiencies.' },
};

/* ── Assessment Questionnaire ────────────────────────── */
const questionnaireMap: Record<string, Array<{ section: string; questions: Array<{ q: string; answer: string; score: number; maxScore: number; notes?: string; evidence?: string }> }>> = {
  'V-001': [
    { section: 'Data Security', questions: [
      { q: 'Is data encrypted at rest using AES-256 or equivalent?', answer: 'Yes', score: 5, maxScore: 5, evidence: 'AWS KMS documentation, SOC 2 report Section IV' },
      { q: 'Is data encrypted in transit using TLS 1.2+?', answer: 'Yes', score: 5, maxScore: 5, evidence: 'AWS TLS policy documentation' },
      { q: 'Are encryption keys managed with proper rotation schedules?', answer: 'Yes — 365-day automatic rotation', score: 5, maxScore: 5, evidence: 'KMS key policy export' },
      { q: 'Is there a data classification and handling policy?', answer: 'Yes — comprehensive classification framework', score: 5, maxScore: 5, evidence: 'AWS Shared Responsibility Model' },
    ]},
    { section: 'Access Control', questions: [
      { q: 'Is multi-factor authentication enforced for all administrative access?', answer: 'Yes', score: 5, maxScore: 5, evidence: 'IAM policy screenshots' },
      { q: 'Are access reviews conducted at least quarterly?', answer: 'Yes — monthly reviews for privileged access', score: 5, maxScore: 5, evidence: 'Access review logs Q1 2026' },
      { q: 'Is there a formal user provisioning/deprovisioning process?', answer: 'Yes — automated via CloudFormation/IAM', score: 4, maxScore: 5, notes: 'Some manual steps for legacy accounts' },
      { q: 'Is the principle of least privilege enforced?', answer: 'Yes', score: 5, maxScore: 5, evidence: 'IAM Analyzer reports' },
    ]},
    { section: 'Incident Response', questions: [
      { q: 'Is there a documented incident response plan?', answer: 'Yes', score: 5, maxScore: 5, evidence: 'AWS IR Plan v4.2' },
      { q: 'Are security incidents communicated within 72 hours?', answer: 'Yes — within 24 hours for critical', score: 5, maxScore: 5, evidence: 'SLA agreement Section 8.3' },
      { q: 'Is there a dedicated security operations center (SOC)?', answer: 'Yes — 24/7 SOC', score: 5, maxScore: 5, evidence: 'AWS Security Hub documentation' },
    ]},
    { section: 'Business Continuity', questions: [
      { q: 'Is there a disaster recovery plan with defined RTO/RPO?', answer: 'Yes — RTO: 4h, RPO: 1h for critical services', score: 5, maxScore: 5, evidence: 'AWS DR playbook' },
      { q: 'Are backups tested regularly?', answer: 'Yes — monthly restore tests', score: 5, maxScore: 5, evidence: 'Backup test reports' },
      { q: 'Is there geographic redundancy for critical systems?', answer: 'Yes — multi-region active-active', score: 5, maxScore: 5, evidence: 'Architecture diagrams' },
    ]},
  ],
  'V-008': [
    { section: 'Data Security', questions: [
      { q: 'Is data encrypted at rest using AES-256 or equivalent?', answer: 'Partial — AES-128 on some systems', score: 2, maxScore: 5, notes: 'Legacy database uses AES-128; migration planned but no timeline' },
      { q: 'Is data encrypted in transit using TLS 1.2+?', answer: 'Partial — TLS 1.1 on legacy API', score: 2, maxScore: 5, notes: 'Main portal uses TLS 1.2, but legacy SFTP endpoint uses TLS 1.1' },
      { q: 'Are encryption keys managed with proper rotation schedules?', answer: 'No — manual key management', score: 1, maxScore: 5, notes: 'No automated rotation; keys last rotated 18 months ago' },
      { q: 'Is there a data classification and handling policy?', answer: 'No formal policy', score: 0, maxScore: 5, notes: 'Verbal guidelines only; no documented policy' },
    ]},
    { section: 'Access Control', questions: [
      { q: 'Is multi-factor authentication enforced for all administrative access?', answer: 'No', score: 0, maxScore: 5, notes: 'MFA not available on their platform' },
      { q: 'Are access reviews conducted at least quarterly?', answer: 'No — annual only', score: 1, maxScore: 5, notes: 'Last review was 14 months ago' },
      { q: 'Is there a formal user provisioning/deprovisioning process?', answer: 'Partial', score: 2, maxScore: 5, notes: 'Manual process with no audit trail' },
      { q: 'Is the principle of least privilege enforced?', answer: 'No', score: 1, maxScore: 5, notes: 'Shared admin accounts in use' },
    ]},
    { section: 'Incident Response', questions: [
      { q: 'Is there a documented incident response plan?', answer: 'No', score: 0, maxScore: 5, notes: 'No formal IR plan exists' },
      { q: 'Are security incidents communicated within 72 hours?', answer: 'No SLA defined', score: 0, maxScore: 5, notes: 'No contractual obligation for notification' },
      { q: 'Is there a dedicated security operations center (SOC)?', answer: 'No', score: 0, maxScore: 5, notes: 'IT team handles security as secondary responsibility' },
    ]},
    { section: 'Business Continuity', questions: [
      { q: 'Is there a disaster recovery plan with defined RTO/RPO?', answer: 'Partial — undocumented', score: 1, maxScore: 5, notes: 'Verbal DR plan; no defined RTO/RPO' },
      { q: 'Are backups tested regularly?', answer: 'No', score: 0, maxScore: 5, notes: 'Backups exist but never tested' },
      { q: 'Is there geographic redundancy for critical systems?', answer: 'No — single data center', score: 0, maxScore: 5, notes: 'All infrastructure in one facility' },
    ]},
  ],
};

// Default questionnaire for vendors without specific entries
const defaultQuestionnaire = (): Array<{ section: string; questions: Array<{ q: string; answer: string; score: number; maxScore: number; notes?: string; evidence?: string }> }> => [
  { section: 'Data Security', questions: [
    { q: 'Is data encrypted at rest using AES-256 or equivalent?', answer: 'Yes', score: 4, maxScore: 5 },
    { q: 'Is data encrypted in transit using TLS 1.2+?', answer: 'Yes', score: 5, maxScore: 5 },
    { q: 'Are encryption keys managed with proper rotation schedules?', answer: 'Yes', score: 4, maxScore: 5 },
    { q: 'Is there a data classification and handling policy?', answer: 'Yes', score: 3, maxScore: 5 },
  ]},
  { section: 'Access Control', questions: [
    { q: 'Is multi-factor authentication enforced?', answer: 'Yes', score: 4, maxScore: 5 },
    { q: 'Are access reviews conducted at least quarterly?', answer: 'Yes', score: 4, maxScore: 5 },
    { q: 'Is there a formal provisioning/deprovisioning process?', answer: 'Yes', score: 3, maxScore: 5 },
  ]},
  { section: 'Incident Response', questions: [
    { q: 'Is there a documented incident response plan?', answer: 'Yes', score: 4, maxScore: 5 },
    { q: 'Are incidents communicated within 72 hours?', answer: 'Yes', score: 4, maxScore: 5 },
  ]},
];

/* ── Remediation Tracking ────────────────────────────── */
const remediationMap: Record<string, Array<{ id: string; finding: string; severity: string; status: string; assignee: string; created: string; dueDate: string; steps: Array<{ step: string; status: string; completedDate?: string; assignee: string }> }>> = {
  'V-001': [
    { id: 'VR-101', finding: 'Legacy account manual provisioning', severity: 'low', status: 'in_progress', assignee: 'Cloud Engineering', created: '2026-03-01', dueDate: '2026-06-01',
      steps: [
        { step: 'Identify all legacy accounts requiring migration', status: 'done', completedDate: '2026-03-10', assignee: 'Cloud Engineering' },
        { step: 'Create CloudFormation templates for remaining accounts', status: 'in_progress', assignee: 'Cloud Engineering' },
        { step: 'Migrate accounts to automated provisioning', status: 'pending', assignee: 'Cloud Engineering' },
        { step: 'Verify and close finding', status: 'pending', assignee: 'Sarah Chen' },
      ],
    },
  ],
  'V-008': [
    { id: 'VR-801', finding: 'No MFA available on platform', severity: 'critical', status: 'blocked', assignee: 'Legacy Payroll Co', created: '2025-06-15', dueDate: '2025-12-31',
      steps: [
        { step: 'Request MFA implementation from vendor', status: 'done', completedDate: '2025-06-20', assignee: 'Maria Lopez' },
        { step: 'Vendor to provide MFA implementation timeline', status: 'done', completedDate: '2025-08-01', assignee: 'Legacy Payroll Co' },
        { step: 'Implement MFA on vendor platform', status: 'blocked', assignee: 'Legacy Payroll Co' },
        { step: 'Verify MFA enforcement', status: 'pending', assignee: 'Security Team' },
      ],
    },
    { id: 'VR-802', finding: 'TLS 1.1 on legacy SFTP endpoint', severity: 'high', status: 'not_started', assignee: 'Legacy Payroll Co', created: '2025-06-15', dueDate: '2026-03-31',
      steps: [
        { step: 'Notify vendor of TLS 1.1 deprecation requirement', status: 'done', completedDate: '2025-07-01', assignee: 'Maria Lopez' },
        { step: 'Vendor to upgrade SFTP endpoint to TLS 1.2+', status: 'pending', assignee: 'Legacy Payroll Co' },
        { step: 'Test connectivity after upgrade', status: 'pending', assignee: 'IT Operations' },
        { step: 'Update integration configuration', status: 'pending', assignee: 'DevOps Team' },
      ],
    },
    { id: 'VR-803', finding: 'No incident response plan', severity: 'critical', status: 'not_started', assignee: 'Legacy Payroll Co', created: '2025-06-15', dueDate: '2026-06-30',
      steps: [
        { step: 'Require vendor to develop formal IR plan', status: 'pending', assignee: 'Maria Lopez' },
        { step: 'Review vendor IR plan', status: 'pending', assignee: 'Security Team' },
        { step: 'Include IR SLA in contract renewal', status: 'pending', assignee: 'Legal' },
      ],
    },
    { id: 'VR-804', finding: 'Encryption key rotation overdue', severity: 'high', status: 'in_progress', assignee: 'Legacy Payroll Co', created: '2025-06-15', dueDate: '2026-04-30',
      steps: [
        { step: 'Request immediate key rotation', status: 'done', completedDate: '2025-07-15', assignee: 'Maria Lopez' },
        { step: 'Vendor to rotate all encryption keys', status: 'in_progress', assignee: 'Legacy Payroll Co' },
        { step: 'Verify rotation completion and schedule', status: 'pending', assignee: 'Security Team' },
      ],
    },
  ],
};

/* ── Compliance Documents ────────────────────────────── */
const documentsMap: Record<string, Array<{ id: string; name: string; type: string; category: string; size: string; uploadedBy: string; date: string; status: string; expiryDate?: string }>> = {
  'V-001': [
    { id: 'DOC-101', name: 'AWS SOC 2 Type II Report 2025.pdf', type: 'pdf', category: 'SOC 2', size: '4.8 MB', uploadedBy: 'Sarah Chen', date: '2026-02-15', status: 'current', expiryDate: '2027-02-15' },
    { id: 'DOC-102', name: 'AWS ISO 27001 Certificate.pdf', type: 'pdf', category: 'ISO 27001', size: '1.2 MB', uploadedBy: 'Sarah Chen', date: '2026-01-20', status: 'current', expiryDate: '2027-01-20' },
    { id: 'DOC-103', name: 'AWS HIPAA BAA Signed.pdf', type: 'pdf', category: 'HIPAA', size: '890 KB', uploadedBy: 'Legal Team', date: '2025-06-01', status: 'current', expiryDate: '2027-06-01' },
    { id: 'DOC-104', name: 'AWS Data Processing Agreement.pdf', type: 'pdf', category: 'DPA', size: '2.1 MB', uploadedBy: 'Legal Team', date: '2025-06-01', status: 'current', expiryDate: '2027-03-15' },
    { id: 'DOC-105', name: 'AWS Penetration Test Report Q4 2025.pdf', type: 'pdf', category: 'Pen Test', size: '6.3 MB', uploadedBy: 'Sarah Chen', date: '2026-01-10', status: 'current' },
    { id: 'DOC-106', name: 'AWS Architecture Diagram.png', type: 'image', category: 'Architecture', size: '3.4 MB', uploadedBy: 'Cloud Engineering', date: '2026-03-01', status: 'current' },
    { id: 'DOC-107', name: 'AWS Vendor Risk Assessment.xlsx', type: 'spreadsheet', category: 'Assessment', size: '420 KB', uploadedBy: 'Sarah Chen', date: '2026-03-01', status: 'current' },
  ],
  'V-008': [
    { id: 'DOC-801', name: 'Legacy Payroll Security Questionnaire Response.pdf', type: 'pdf', category: 'Assessment', size: '1.5 MB', uploadedBy: 'Maria Lopez', date: '2025-06-15', status: 'expired', expiryDate: '2026-06-15' },
    { id: 'DOC-802', name: 'Payroll Service Agreement.pdf', type: 'pdf', category: 'Contract', size: '3.2 MB', uploadedBy: 'Legal Team', date: '2024-05-31', status: 'expiring_soon', expiryDate: '2026-05-31' },
    { id: 'DOC-803', name: 'Legacy Payroll Data Flow Diagram.pdf', type: 'pdf', category: 'Architecture', size: '780 KB', uploadedBy: 'Maria Lopez', date: '2025-06-15', status: 'needs_update' },
  ],
};

const defaultDocuments = (): Array<{ id: string; name: string; type: string; category: string; size: string; uploadedBy: string; date: string; status: string; expiryDate?: string }> => [
  { id: 'DOC-DEFAULT-1', name: 'Vendor Security Questionnaire.pdf', type: 'pdf', category: 'Assessment', size: '1.1 MB', uploadedBy: 'Security Team', date: '2026-01-15', status: 'current' },
  { id: 'DOC-DEFAULT-2', name: 'Service Agreement.pdf', type: 'pdf', category: 'Contract', size: '2.4 MB', uploadedBy: 'Legal Team', date: '2025-08-01', status: 'current' },
  { id: 'DOC-DEFAULT-3', name: 'Data Processing Agreement.pdf', type: 'pdf', category: 'DPA', size: '1.8 MB', uploadedBy: 'Legal Team', date: '2025-08-01', status: 'current' },
];

/* ── Helpers ──────────────────────────────────────────── */
function riskTierBadge(tier: string) {
  const map: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = { critical: 'destructive', high: 'default', medium: 'secondary', low: 'outline' };
  return <Badge variant={map[tier] ?? 'outline'} className="capitalize text-xs">{tier}</Badge>;
}

function statusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    approved: { variant: 'default', label: 'Approved' },
    under_review: { variant: 'secondary', label: 'Under Review' },
    needs_action: { variant: 'destructive', label: 'Needs Action' },
  };
  const s = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
}

function trendIcon(trend: string) {
  if (trend === 'improving') return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  if (trend === 'new') return <Star className="h-3.5 w-3.5 text-yellow-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function scoreColor(score: number) {
  if (score >= 4) return 'text-green-500';
  if (score >= 3) return 'text-yellow-500';
  return 'text-destructive';
}

function docStatusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    current: { variant: 'default', label: 'Current' },
    expiring_soon: { variant: 'secondary', label: 'Expiring Soon' },
    expired: { variant: 'destructive', label: 'Expired' },
    needs_update: { variant: 'outline', label: 'Needs Update' },
  };
  const s = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
}

function remStatusBadge(status: string) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    completed: { variant: 'default', label: 'Completed' },
    in_progress: { variant: 'secondary', label: 'In Progress' },
    not_started: { variant: 'outline', label: 'Not Started' },
    blocked: { variant: 'destructive', label: 'Blocked' },
  };
  const s = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
}

function severityBadge(severity: string) {
  const map: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = { critical: 'destructive', high: 'default', medium: 'secondary', low: 'outline' };
  return <Badge variant={map[severity] ?? 'outline'} className="capitalize text-xs">{severity}</Badge>;
}

function stepStatusIcon(status: string) {
  if (status === 'done') return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
  if (status === 'in_progress') return <RefreshCw className="h-4 w-4 text-primary animate-spin shrink-0" />;
  if (status === 'blocked') return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function fileIcon(type: string) {
  if (type === 'pdf') return <FileText className="h-4 w-4 text-red-400" />;
  if (type === 'image') return <Image className="h-4 w-4 text-blue-400" />;
  if (type === 'spreadsheet') return <File className="h-4 w-4 text-green-400" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

/* ── Component ───────────────────────────────────────── */
export function VendorDetailView({ vendorId }: { vendorId: string }) {
  const vendor = vendorsMap[vendorId];

  if (!vendor) {
    return (
      <div className="p-6 space-y-4">
        <Link to="/vendors" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Vendors</Link>
        <Card><CardContent className="p-12 text-center"><p className="text-muted-foreground">Vendor "{vendorId}" not found.</p></CardContent></Card>
      </div>
    );
  }

  const questionnaire = questionnaireMap[vendorId] ?? defaultQuestionnaire();
  const remediations = remediationMap[vendorId] ?? [];
  const documents = documentsMap[vendorId] ?? defaultDocuments();

  const totalScore = questionnaire.reduce((sum, s) => sum + s.questions.reduce((qs, q) => qs + q.score, 0), 0);
  const maxScore = questionnaire.reduce((sum, s) => sum + s.questions.reduce((qs, q) => qs + q.maxScore, 0), 0);
  const scorePct = Math.round((totalScore / maxScore) * 100);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-3">
        <Link to="/vendors" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Vendors
        </Link>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold">{vendor.name.charAt(0)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{vendor.name}</h1>
                  {statusBadge(vendor.status)}
                  {riskTierBadge(vendor.riskTier)}
                </div>
                <p className="text-sm text-muted-foreground">{vendor.category}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mt-2">{vendor.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export</Button>
            <Button size="sm"><RefreshCw className="h-4 w-4 mr-1" />Reassess</Button>
          </div>
        </div>

        {/* Info strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Risk Score</p>
            <p className={`text-xl font-bold ${vendor.riskScore >= 70 ? 'text-green-500' : vendor.riskScore >= 50 ? 'text-yellow-500' : 'text-destructive'}`}>{vendor.riskScore}/100</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Contract End</p>
            <p className="text-sm font-medium">{vendor.contractEnd}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Last Assessment</p>
            <p className="text-sm font-medium">{vendor.lastAssessment}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">Data Access</p>
            <p className="text-sm font-medium">{vendor.dataAccess}</p>
          </CardContent></Card>
        </div>

        {/* Contact strip */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vendor.location}</span>
          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{vendor.contact}</span>
          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{vendor.phone}</span>
          <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{vendor.website}</span>
          <span className="flex items-center gap-1">{trendIcon(vendor.trend)} Trend: {vendor.trend}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="questionnaire" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questionnaire" className="gap-1"><ClipboardList className="h-3.5 w-3.5" />Assessment</TabsTrigger>
          <TabsTrigger value="remediation" className="gap-1"><Wrench className="h-3.5 w-3.5" />Remediation ({remediations.length})</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1"><FileText className="h-3.5 w-3.5" />Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="overview" className="gap-1"><Building2 className="h-3.5 w-3.5" />Overview</TabsTrigger>
        </TabsList>

        {/* ── Assessment Questionnaire ── */}
        <TabsContent value="questionnaire">
          <div className="space-y-4">
            {/* Score summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Assessment Score</p>
                    <p className="text-xs text-muted-foreground">Based on {questionnaire.reduce((s, sec) => s + sec.questions.length, 0)} questions across {questionnaire.length} sections</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={scorePct} className="w-32 h-2" />
                    <span className={`text-2xl font-bold ${scorePct >= 80 ? 'text-green-500' : scorePct >= 60 ? 'text-yellow-500' : 'text-destructive'}`}>{scorePct}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {questionnaire.map((section, si) => {
              const sectionScore = section.questions.reduce((s, q) => s + q.score, 0);
              const sectionMax = section.questions.reduce((s, q) => s + q.maxScore, 0);
              const sectionPct = Math.round((sectionScore / sectionMax) * 100);
              return (
                <Card key={si}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{section.section}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Progress value={sectionPct} className="w-20 h-1.5" />
                        <span className={`text-sm font-bold ${sectionPct >= 80 ? 'text-green-500' : sectionPct >= 60 ? 'text-yellow-500' : 'text-destructive'}`}>{sectionScore}/{sectionMax}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {section.questions.map((q, qi) => (
                      <div key={qi} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{q.q}</p>
                          <span className={`text-sm font-bold shrink-0 ${scoreColor(q.score)}`}>{q.score}/{q.maxScore}</span>
                        </div>
                        <p className="text-sm text-foreground">{q.answer}</p>
                        {q.notes && <p className="text-xs text-yellow-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{q.notes}</p>}
                        {q.evidence && <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" />Evidence: {q.evidence}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Remediation Tracking ── */}
        <TabsContent value="remediation">
          {remediations.length === 0 ? (
            <Card><CardContent className="p-12 text-center space-y-2">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-sm font-medium">No open remediations</p>
              <p className="text-xs text-muted-foreground">All findings have been addressed.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {remediations.map(r => {
                const completedSteps = r.steps.filter(s => s.status === 'done').length;
                const progress = Math.round((completedSteps / r.steps.length) * 100);
                return (
                  <Card key={r.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">{r.finding}</CardTitle>
                            {remStatusBadge(r.status)}
                            {severityBadge(r.severity)}
                          </div>
                          <CardDescription className="text-xs">
                            {r.id} · Assigned to {r.assignee} · Due {r.dueDate}
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

        {/* ── Compliance Documents ── */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Compliance Documents</CardTitle>
                  <CardDescription>Certificates, reports, agreements, and audit artifacts</CardDescription>
                </div>
                <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" />Upload</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Document</TableHead><TableHead>Category</TableHead><TableHead>Size</TableHead>
                  <TableHead>Uploaded By</TableHead><TableHead>Date</TableHead><TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {documents.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {fileIcon(doc.type)}
                          <span className="text-sm font-medium">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{doc.category}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.size}</TableCell>
                      <TableCell className="text-sm">{doc.uploadedBy}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.date}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.expiryDate ?? '—'}</TableCell>
                      <TableCell>{docStatusBadge(doc.status)}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" className="h-7"><Download className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Overview ── */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Vendor Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Primary Contact', value: vendor.primaryContact, icon: <Mail className="h-4 w-4" /> },
                  { label: 'Phone', value: vendor.phone, icon: <Phone className="h-4 w-4" /> },
                  { label: 'Website', value: vendor.website, icon: <Globe className="h-4 w-4" /> },
                  { label: 'Location', value: vendor.location, icon: <MapPin className="h-4 w-4" /> },
                  { label: 'Employees', value: vendor.employees, icon: <Building2 className="h-4 w-4" /> },
                  { label: 'Founded', value: vendor.founded, icon: <Calendar className="h-4 w-4" /> },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">{item.icon}{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Certifications & Compliance</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { cert: 'SOC 2 Type II', has: vendor.soc2 },
                  { cert: 'ISO 27001', has: vendor.iso27001 },
                  { cert: 'HIPAA BAA', has: vendor.hipaa },
                ].map(c => (
                  <div key={c.cert} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm">{c.cert}</span>
                    {c.has ? (
                      <Badge variant="default" className="text-xs gap-1"><CheckCircle className="h-3 w-3" />Verified</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" />Missing</Badge>
                    )}
                  </div>
                ))}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Data Access Classification</p>
                  <div className="flex flex-wrap gap-1">
                    {vendor.dataAccess.split(', ').map(d => (
                      <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-base">Contract Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Contract End</p><p className="text-sm font-medium">{vendor.contractEnd}</p></div>
                  <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium">{vendor.contact}</p></div>
                  <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Category</p><p className="text-sm font-medium">{vendor.category}</p></div>
                  <div className="space-y-0.5"><p className="text-xs text-muted-foreground">Risk Trend</p><div className="flex items-center gap-1">{trendIcon(vendor.trend)}<span className="text-sm font-medium capitalize">{vendor.trend}</span></div></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
