// Extended mock data for all modules

export interface EvidenceItem {
  id: string;
  title: string;
  controlRef: string;
  controlTitle: string;
  type: 'screenshot' | 'document' | 'api_pull' | 'config_export' | 'attestation' | 'log';
  source: string;
  status: 'valid' | 'expiring' | 'expired' | 'rejected';
  collectedAt: string;
  expiresAt: string;
  autoCollected: boolean;
}

export interface PersonnelMember {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  accessReviewStatus: 'current' | 'overdue' | 'pending';
  trainingStatus: 'completed' | 'in_progress' | 'overdue' | 'not_started';
  lastAccessReview: string;
  lastTrainingCompleted: string;
  backgroundCheckDate: string;
}

export interface Policy {
  id: string;
  title: string;
  category: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  owner: string;
  approvedAt: string | null;
  nextReviewDate: string;
  linkedControls: number;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  status: 'identified' | 'mitigating' | 'accepted' | 'resolved';
  owner: string;
  mitigationPlan: string;
  linkedControls: number;
}

export interface Audit {
  id: string;
  frameworkName: string;
  standard: string;
  auditorName: string;
  auditFirm: string;
  status: 'preparing' | 'in_progress' | 'review' | 'completed';
  startDate: string;
  endDate: string;
  findingsCount: number;
  readinessScore: number;
  evidenceGaps: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  lastGenerated: string | null;
  frequency: string | null;
  format: 'pdf' | 'csv';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'auditor' | 'executive' | 'viewer';
  lastActive: string;
  status: 'active' | 'invited' | 'deactivated';
}

export const evidenceItems: EvidenceItem[] = [
  { id: 'ev-1', title: 'AWS CloudTrail Logging Config', controlRef: 'CC-7.3', controlTitle: 'Logging & Monitoring', type: 'config_export', source: 'AWS', status: 'valid', collectedAt: '2026-04-10', expiresAt: '2026-07-10', autoCollected: true },
  { id: 'ev-2', title: 'MFA Enrollment Report', controlRef: 'CC-6.1', controlTitle: 'Logical Access Controls', type: 'api_pull', source: 'Okta', status: 'valid', collectedAt: '2026-04-09', expiresAt: '2026-05-09', autoCollected: true },
  { id: 'ev-3', title: 'Penetration Test Report Q1 2026', controlRef: 'CC-6.6', controlTitle: 'Network Security', type: 'document', source: 'Manual Upload', status: 'expiring', collectedAt: '2026-01-15', expiresAt: '2026-04-15', autoCollected: false },
  { id: 'ev-4', title: 'SSL Certificate Inventory', controlRef: 'CC-7.1', controlTitle: 'Encryption in Transit', type: 'api_pull', source: 'Internal Scanner', status: 'valid', collectedAt: '2026-04-08', expiresAt: '2026-07-08', autoCollected: true },
  { id: 'ev-5', title: 'S3 Encryption Policy Screenshot', controlRef: 'CC-7.2', controlTitle: 'Encryption at Rest', type: 'screenshot', source: 'Manual Upload', status: 'expired', collectedAt: '2025-12-01', expiresAt: '2026-03-01', autoCollected: false },
  { id: 'ev-6', title: 'Employee Background Check Attestation', controlRef: 'HP-2.1', controlTitle: 'Workforce Training', type: 'attestation', source: 'HR', status: 'valid', collectedAt: '2026-03-20', expiresAt: '2027-03-20', autoCollected: false },
  { id: 'ev-7', title: 'HIPAA Training Completion Report', controlRef: 'HP-2.1', controlTitle: 'Workforce Training', type: 'document', source: 'BambooHR', status: 'valid', collectedAt: '2026-04-01', expiresAt: '2027-04-01', autoCollected: true },
  { id: 'ev-8', title: 'Access Review Log — March', controlRef: 'CC-6.3', controlTitle: 'Role-Based Access', type: 'log', source: 'Okta', status: 'valid', collectedAt: '2026-03-31', expiresAt: '2026-06-30', autoCollected: true },
  { id: 'ev-9', title: 'Incident Response Plan v3.0', controlRef: 'HP-3.1', controlTitle: 'Incident Response Plan', type: 'document', source: 'Manual Upload', status: 'valid', collectedAt: '2026-02-15', expiresAt: '2027-02-15', autoCollected: false },
  { id: 'ev-10', title: 'Vulnerability Scan Report — April', controlRef: 'CC-6.6', controlTitle: 'Network Security', type: 'api_pull', source: 'CrowdStrike', status: 'expiring', collectedAt: '2026-04-01', expiresAt: '2026-04-15', autoCollected: true },
  { id: 'ev-11', title: 'Data Retention Policy Acknowledgment', controlRef: 'HP-1.1', controlTitle: 'PHI Access Controls', type: 'attestation', source: 'Manual Upload', status: 'expired', collectedAt: '2025-10-15', expiresAt: '2026-04-15', autoCollected: false },
  { id: 'ev-12', title: 'Firewall Rules Export', controlRef: 'CC-6.6', controlTitle: 'Network Security', type: 'config_export', source: 'Cloudflare', status: 'valid', collectedAt: '2026-04-07', expiresAt: '2026-07-07', autoCollected: true },
  { id: 'ev-13', title: 'GitHub Branch Protection Settings', controlRef: 'CC-6.1', controlTitle: 'Logical Access Controls', type: 'config_export', source: 'GitHub', status: 'valid', collectedAt: '2026-04-05', expiresAt: '2026-07-05', autoCollected: true },
  { id: 'ev-14', title: 'SOC 2 Readiness Assessment', controlRef: 'CC-7.2', controlTitle: 'Encryption at Rest', type: 'document', source: 'Manual Upload', status: 'rejected', collectedAt: '2026-03-10', expiresAt: '2026-06-10', autoCollected: false },
  { id: 'ev-15', title: 'PHI Access Log — Q1', controlRef: 'HP-1.2', controlTitle: 'PHI Encryption', type: 'log', source: 'Datadog', status: 'expiring', collectedAt: '2026-01-01', expiresAt: '2026-04-20', autoCollected: true },
];

export const personnelMembers: PersonnelMember[] = [
  { id: 'p-1', name: 'Sarah Chen', email: 'sarah.chen@meridian.io', department: 'Security', title: 'Security Lead', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-01', lastTrainingCompleted: '2026-03-15', backgroundCheckDate: '2024-06-01' },
  { id: 'p-2', name: 'James Wilson', email: 'james.wilson@meridian.io', department: 'Security', title: 'Security Analyst', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-01', lastTrainingCompleted: '2026-03-15', backgroundCheckDate: '2024-08-15' },
  { id: 'p-3', name: 'Maria Garcia', email: 'maria.garcia@meridian.io', department: 'Security', title: 'Incident Responder', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-03-28', lastTrainingCompleted: '2026-03-10', backgroundCheckDate: '2025-01-10' },
  { id: 'p-4', name: 'Alex Kim', email: 'alex.kim@meridian.io', department: 'Engineering', title: 'Platform Engineer', accessReviewStatus: 'overdue', trainingStatus: 'overdue', lastAccessReview: '2025-12-15', lastTrainingCompleted: '2025-11-01', backgroundCheckDate: '2024-03-20' },
  { id: 'p-5', name: 'David Park', email: 'david.park@meridian.io', department: 'Engineering', title: 'DevOps Lead', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-03-30', lastTrainingCompleted: '2026-02-28', backgroundCheckDate: '2023-09-01' },
  { id: 'p-6', name: 'Emily Johnson', email: 'emily.j@meridian.io', department: 'Engineering', title: 'Senior Developer', accessReviewStatus: 'pending', trainingStatus: 'in_progress', lastAccessReview: '2026-01-15', lastTrainingCompleted: '2025-12-20', backgroundCheckDate: '2024-07-10' },
  { id: 'p-7', name: 'Robert Taylor', email: 'robert.t@meridian.io', department: 'Engineering', title: 'Backend Developer', accessReviewStatus: 'overdue', trainingStatus: 'not_started', lastAccessReview: '2025-10-01', lastTrainingCompleted: '', backgroundCheckDate: '2025-06-01' },
  { id: 'p-8', name: 'Lisa Wang', email: 'lisa.wang@meridian.io', department: 'Product', title: 'Product Manager', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-02', lastTrainingCompleted: '2026-03-20', backgroundCheckDate: '2024-11-15' },
  { id: 'p-9', name: 'Michael Brown', email: 'michael.b@meridian.io', department: 'Product', title: 'UX Designer', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-03-25', lastTrainingCompleted: '2026-03-18', backgroundCheckDate: '2025-02-01' },
  { id: 'p-10', name: 'Jennifer Lee', email: 'jennifer.l@meridian.io', department: 'HR', title: 'HR Director', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-05', lastTrainingCompleted: '2026-04-01', backgroundCheckDate: '2023-05-15' },
  { id: 'p-11', name: 'Chris Anderson', email: 'chris.a@meridian.io', department: 'Finance', title: 'CFO', accessReviewStatus: 'pending', trainingStatus: 'in_progress', lastAccessReview: '2026-02-01', lastTrainingCompleted: '2025-12-15', backgroundCheckDate: '2023-01-10' },
  { id: 'p-12', name: 'Amanda Martinez', email: 'amanda.m@meridian.io', department: 'Legal', title: 'General Counsel', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-03-30', lastTrainingCompleted: '2026-03-25', backgroundCheckDate: '2023-03-01' },
  { id: 'p-13', name: 'Kevin Thompson', email: 'kevin.t@meridian.io', department: 'Engineering', title: 'QA Lead', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-01', lastTrainingCompleted: '2026-03-10', backgroundCheckDate: '2024-09-20' },
  { id: 'p-14', name: 'Priya Patel', email: 'priya.p@meridian.io', department: 'Engineering', title: 'Frontend Developer', accessReviewStatus: 'overdue', trainingStatus: 'overdue', lastAccessReview: '2025-11-01', lastTrainingCompleted: '2025-09-15', backgroundCheckDate: '2025-04-01' },
  { id: 'p-15', name: 'Daniel Harris', email: 'daniel.h@meridian.io', department: 'Support', title: 'Support Manager', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-03-28', lastTrainingCompleted: '2026-02-20', backgroundCheckDate: '2024-12-01' },
  { id: 'p-16', name: 'Rachel Cooper', email: 'rachel.c@meridian.io', department: 'Marketing', title: 'Marketing Lead', accessReviewStatus: 'pending', trainingStatus: 'not_started', lastAccessReview: '2026-01-20', lastTrainingCompleted: '', backgroundCheckDate: '2025-08-15' },
  { id: 'p-17', name: 'Tom Nguyen', email: 'tom.n@meridian.io', department: 'Engineering', title: 'Data Engineer', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-03', lastTrainingCompleted: '2026-03-28', backgroundCheckDate: '2025-01-20' },
  { id: 'p-18', name: 'Sandra White', email: 'sandra.w@meridian.io', department: 'Compliance', title: 'Compliance Officer', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-05', lastTrainingCompleted: '2026-04-01', backgroundCheckDate: '2023-11-10' },
  { id: 'p-19', name: 'Mark Stevens', email: 'mark.s@meridian.io', department: 'Engineering', title: 'SRE Engineer', accessReviewStatus: 'current', trainingStatus: 'in_progress', lastAccessReview: '2026-03-30', lastTrainingCompleted: '2025-12-01', backgroundCheckDate: '2024-05-01' },
  { id: 'p-20', name: 'Laura Chen', email: 'laura.c@meridian.io', department: 'Sales', title: 'VP Sales', accessReviewStatus: 'overdue', trainingStatus: 'overdue', lastAccessReview: '2025-09-15', lastTrainingCompleted: '2025-08-01', backgroundCheckDate: '2023-07-20' },
  { id: 'p-21', name: 'Jason Reed', email: 'jason.r@meridian.io', department: 'Engineering', title: 'Mobile Developer', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-02', lastTrainingCompleted: '2026-03-15', backgroundCheckDate: '2025-03-10' },
  { id: 'p-22', name: 'Olivia Scott', email: 'olivia.s@meridian.io', department: 'Engineering', title: 'Security Intern', accessReviewStatus: 'pending', trainingStatus: 'in_progress', lastAccessReview: '2026-03-01', lastTrainingCompleted: '2026-03-01', backgroundCheckDate: '2026-01-15' },
  { id: 'p-23', name: 'Brian Young', email: 'brian.y@meridian.io', department: 'IT', title: 'IT Manager', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-04', lastTrainingCompleted: '2026-03-20', backgroundCheckDate: '2024-02-01' },
  { id: 'p-24', name: 'Nina Ivanova', email: 'nina.i@meridian.io', department: 'Data Science', title: 'ML Engineer', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-03-29', lastTrainingCompleted: '2026-02-15', backgroundCheckDate: '2025-05-20' },
  { id: 'p-25', name: 'Carlos Ruiz', email: 'carlos.r@meridian.io', department: 'Operations', title: 'COO', accessReviewStatus: 'current', trainingStatus: 'completed', lastAccessReview: '2026-04-01', lastTrainingCompleted: '2026-03-30', backgroundCheckDate: '2022-11-01' },
];

export const policies: Policy[] = [
  { id: 'pol-1', title: 'Information Security Policy', category: 'Security', version: '3.1', status: 'published', owner: 'Sarah Chen', approvedAt: '2026-02-15', nextReviewDate: '2026-08-15', linkedControls: 8 },
  { id: 'pol-2', title: 'Data Retention Policy', category: 'Data', version: '2.1', status: 'published', owner: 'Amanda Martinez', approvedAt: '2026-03-10', nextReviewDate: '2026-09-10', linkedControls: 4 },
  { id: 'pol-3', title: 'Acceptable Use Policy', category: 'HR', version: '4.0', status: 'published', owner: 'Jennifer Lee', approvedAt: '2026-01-20', nextReviewDate: '2026-07-20', linkedControls: 3 },
  { id: 'pol-4', title: 'Incident Response Plan', category: 'Security', version: '3.0', status: 'published', owner: 'Maria Garcia', approvedAt: '2026-02-15', nextReviewDate: '2026-08-15', linkedControls: 6 },
  { id: 'pol-5', title: 'Access Control Policy', category: 'Security', version: '2.3', status: 'published', owner: 'James Wilson', approvedAt: '2026-03-01', nextReviewDate: '2026-09-01', linkedControls: 5 },
  { id: 'pol-6', title: 'Change Management Policy', category: 'Operations', version: '1.5', status: 'review', owner: 'David Park', approvedAt: null, nextReviewDate: '2026-05-01', linkedControls: 3 },
  { id: 'pol-7', title: 'Encryption Policy', category: 'Security', version: '2.0', status: 'approved', owner: 'Alex Kim', approvedAt: '2026-04-05', nextReviewDate: '2026-10-05', linkedControls: 4 },
  { id: 'pol-8', title: 'Vendor Management Policy', category: 'Risk', version: '1.2', status: 'draft', owner: 'Sandra White', approvedAt: null, nextReviewDate: '2026-06-01', linkedControls: 2 },
  { id: 'pol-9', title: 'Business Continuity Plan', category: 'Operations', version: '2.1', status: 'published', owner: 'Carlos Ruiz', approvedAt: '2025-12-10', nextReviewDate: '2026-06-10', linkedControls: 4 },
  { id: 'pol-10', title: 'Privacy Policy', category: 'Privacy', version: '3.2', status: 'published', owner: 'Amanda Martinez', approvedAt: '2026-03-20', nextReviewDate: '2026-09-20', linkedControls: 6 },
  { id: 'pol-11', title: 'Physical Security Policy', category: 'Security', version: '1.0', status: 'draft', owner: 'Brian Young', approvedAt: null, nextReviewDate: '2026-07-01', linkedControls: 1 },
  { id: 'pol-12', title: 'Remote Work Security Policy', category: 'HR', version: '1.3', status: 'archived', owner: 'Jennifer Lee', approvedAt: '2025-06-01', nextReviewDate: '2026-06-01', linkedControls: 2 },
];

export const risks: Risk[] = [
  { id: 'r-1', title: 'Unencrypted PHI in cloud storage', description: 'S3 buckets containing patient data without server-side encryption', category: 'Data Protection', likelihood: 4, impact: 5, riskScore: 20, status: 'mitigating', owner: 'Sarah Chen', mitigationPlan: 'Enable SSE-S3 encryption on all PHI buckets; deploy AWS Config rule to enforce', linkedControls: 2 },
  { id: 'r-2', title: 'Stale admin credentials', description: 'Admin accounts without MFA and infrequent password rotation', category: 'Access Control', likelihood: 3, impact: 5, riskScore: 15, status: 'mitigating', owner: 'James Wilson', mitigationPlan: 'Enforce MFA for all admin accounts; implement 90-day rotation policy', linkedControls: 3 },
  { id: 'r-3', title: 'Third-party vendor data breach', description: 'Critical vendors without SOC 2 attestation or security review', category: 'Vendor Risk', likelihood: 3, impact: 4, riskScore: 12, status: 'identified', owner: 'Sandra White', mitigationPlan: 'Complete vendor security assessment for top 10 vendors', linkedControls: 1 },
  { id: 'r-4', title: 'Insider threat — data exfiltration', description: 'Employees with excessive data access permissions', category: 'Access Control', likelihood: 2, impact: 5, riskScore: 10, status: 'mitigating', owner: 'Alex Kim', mitigationPlan: 'Implement DLP monitoring; quarterly access reviews', linkedControls: 2 },
  { id: 'r-5', title: 'Ransomware on production systems', description: 'Incomplete backup strategy and delayed patching', category: 'Infrastructure', likelihood: 2, impact: 5, riskScore: 10, status: 'mitigating', owner: 'David Park', mitigationPlan: 'Daily encrypted backups; automated patch management', linkedControls: 3 },
  { id: 'r-6', title: 'Regulatory non-compliance fine', description: 'Gaps in HIPAA and SOC 2 control implementation', category: 'Compliance', likelihood: 3, impact: 4, riskScore: 12, status: 'mitigating', owner: 'Sandra White', mitigationPlan: 'Accelerate control implementation; hire compliance analyst', linkedControls: 5 },
  { id: 'r-7', title: 'API authentication bypass', description: 'Legacy API endpoints without proper authentication middleware', category: 'Application Security', likelihood: 2, impact: 4, riskScore: 8, status: 'identified', owner: 'Alex Kim', mitigationPlan: 'Audit all API endpoints; enforce OAuth 2.0 on legacy routes', linkedControls: 2 },
  { id: 'r-8', title: 'Incomplete security training', description: 'New hires not completing security awareness training within 30 days', category: 'People', likelihood: 4, impact: 2, riskScore: 8, status: 'mitigating', owner: 'Jennifer Lee', mitigationPlan: 'Automated training assignment on Day 1; weekly reminders', linkedControls: 1 },
  { id: 'r-9', title: 'DNS hijacking', description: 'Domain registrar without 2FA enabled', category: 'Infrastructure', likelihood: 1, impact: 5, riskScore: 5, status: 'resolved', owner: 'David Park', mitigationPlan: 'Enabled registrar 2FA and DNSSEC', linkedControls: 1 },
  { id: 'r-10', title: 'Shadow IT usage', description: 'Unapproved SaaS tools used by marketing and sales teams', category: 'Governance', likelihood: 4, impact: 2, riskScore: 8, status: 'identified', owner: 'Brian Young', mitigationPlan: 'Deploy CASB; create approved tool catalog', linkedControls: 1 },
  { id: 'r-11', title: 'Logging gaps in staging environment', description: 'Staging environment missing comprehensive audit logging', category: 'Monitoring', likelihood: 3, impact: 3, riskScore: 9, status: 'accepted', owner: 'Maria Garcia', mitigationPlan: 'Accepted — staging does not process real data', linkedControls: 1 },
  { id: 'r-12', title: 'Key person dependency — DevOps', description: 'Single DevOps engineer with full infrastructure access', category: 'People', likelihood: 3, impact: 3, riskScore: 9, status: 'mitigating', owner: 'Carlos Ruiz', mitigationPlan: 'Cross-train SRE team; document runbooks', linkedControls: 0 },
  { id: 'r-13', title: 'Expired SSL certificates', description: 'Manual certificate management leading to occasional expiry', category: 'Infrastructure', likelihood: 3, impact: 3, riskScore: 9, status: 'mitigating', owner: 'David Park', mitigationPlan: 'Migrate to automated cert management (Let\'s Encrypt)', linkedControls: 1 },
  { id: 'r-14', title: 'Mobile device data leakage', description: 'BYOD devices without MDM enrollment accessing corporate data', category: 'Endpoint', likelihood: 3, impact: 3, riskScore: 9, status: 'identified', owner: 'Brian Young', mitigationPlan: 'Mandate Jamf enrollment for all corporate device access', linkedControls: 1 },
  { id: 'r-15', title: 'Social engineering attacks', description: 'Phishing simulation failure rate above 15%', category: 'People', likelihood: 4, impact: 3, riskScore: 12, status: 'mitigating', owner: 'Sarah Chen', mitigationPlan: 'Monthly phishing simulations; targeted training for repeat offenders', linkedControls: 1 },
];

export const audits: Audit[] = [
  { id: 'aud-1', frameworkName: 'SOC 2 Type II', standard: 'SOC2', auditorName: 'Patricia Morgan', auditFirm: 'Deloitte', status: 'preparing', startDate: '2026-06-01', endDate: '2026-08-15', findingsCount: 0, readinessScore: 78, evidenceGaps: 5 },
  { id: 'aud-2', frameworkName: 'HIPAA Security Rule', standard: 'HIPAA', auditorName: 'Steven Hayes', auditFirm: 'KPMG', status: 'preparing', startDate: '2026-08-01', endDate: '2026-10-01', findingsCount: 0, readinessScore: 65, evidenceGaps: 8 },
];

export const reportTemplates: ReportTemplate[] = [
  { id: 'rpt-1', name: 'Compliance Summary', description: 'High-level compliance posture across all frameworks', type: 'Compliance', lastGenerated: '2026-04-07', frequency: 'weekly', format: 'pdf' },
  { id: 'rpt-2', name: 'Control Status Report', description: 'Detailed status of all controls with implementation progress', type: 'Controls', lastGenerated: '2026-04-01', frequency: 'monthly', format: 'pdf' },
  { id: 'rpt-3', name: 'Evidence Coverage Report', description: 'Evidence gaps and expiry analysis by control', type: 'Evidence', lastGenerated: '2026-04-05', frequency: 'weekly', format: 'csv' },
  { id: 'rpt-4', name: 'Alert Trends', description: 'Alert volume, severity distribution, and MTTA/MTTR trends', type: 'Alerts', lastGenerated: '2026-04-10', frequency: 'daily', format: 'pdf' },
  { id: 'rpt-5', name: 'Incident Summary', description: 'Active and resolved incidents with SLA compliance', type: 'Incidents', lastGenerated: '2026-04-08', frequency: 'weekly', format: 'pdf' },
  { id: 'rpt-6', name: 'Personnel Review Status', description: 'Access review and training completion by department', type: 'Personnel', lastGenerated: '2026-03-31', frequency: 'monthly', format: 'csv' },
  { id: 'rpt-7', name: 'Risk Assessment', description: 'Risk register summary with heat map and mitigation status', type: 'Risk', lastGenerated: '2026-04-01', frequency: 'quarterly', format: 'pdf' },
  { id: 'rpt-8', name: 'Executive Dashboard Export', description: 'KPI summary and trend charts for leadership review', type: 'Executive', lastGenerated: null, frequency: null, format: 'pdf' },
];

export const teamMembers: TeamMember[] = [
  { id: 'tm-1', name: 'Sarah Chen', email: 'sarah.chen@meridian.io', role: 'admin', lastActive: '2 min ago', status: 'active' },
  { id: 'tm-2', name: 'James Wilson', email: 'james.wilson@meridian.io', role: 'analyst', lastActive: '15 min ago', status: 'active' },
  { id: 'tm-3', name: 'Maria Garcia', email: 'maria.garcia@meridian.io', role: 'analyst', lastActive: '30 min ago', status: 'active' },
  { id: 'tm-4', name: 'Alex Kim', email: 'alex.kim@meridian.io', role: 'analyst', lastActive: '1h ago', status: 'active' },
  { id: 'tm-5', name: 'David Park', email: 'david.park@meridian.io', role: 'analyst', lastActive: '3h ago', status: 'active' },
  { id: 'tm-6', name: 'Sandra White', email: 'sandra.w@meridian.io', role: 'admin', lastActive: '1d ago', status: 'active' },
  { id: 'tm-7', name: 'Carlos Ruiz', email: 'carlos.r@meridian.io', role: 'executive', lastActive: '2d ago', status: 'active' },
  { id: 'tm-8', name: 'Patricia Morgan', email: 'patricia.m@deloitte.com', role: 'auditor', lastActive: '5d ago', status: 'active' },
  { id: 'tm-9', name: 'Steven Hayes', email: 'steven.h@kpmg.com', role: 'auditor', lastActive: 'Never', status: 'invited' },
  { id: 'tm-10', name: 'Mark Stevens', email: 'mark.s@meridian.io', role: 'viewer', lastActive: '1w ago', status: 'deactivated' },
];
