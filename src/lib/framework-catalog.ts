// Framework catalog — 35+ standards from Vanta, Drata, Secureframe union

export interface CatalogFramework {
  id: string;
  name: string;
  standard: string;
  category: 'commercial' | 'federal' | 'privacy' | 'industry' | 'ai_governance' | 'regional' | 'custom';
  description: string;
  controlCount: number;
  popularity: 'high' | 'medium' | 'low';
  enabled: boolean;
  compliancePct: number;
  status: 'not_started' | 'in_progress' | 'audit_ready' | 'certified';
  controlCounts: { passing: number; failing: number; inProgress: number; na: number };
  targetDate: string | null;
}

export interface ControlCategory {
  id: string;
  name: string;
  description: string;
  controlCount: number;
}

export const controlCategories: ControlCategory[] = [
  { id: 'ac', name: 'Access Control', description: 'Manage logical and physical access', controlCount: 12 },
  { id: 'au', name: 'Audit & Accountability', description: 'Logging, monitoring, and audit trails', controlCount: 8 },
  { id: 'at', name: 'Awareness & Training', description: 'Security awareness and role-based training', controlCount: 5 },
  { id: 'cm', name: 'Configuration Management', description: 'Baseline configs and change control', controlCount: 7 },
  { id: 'cp', name: 'Contingency Planning', description: 'Backup, recovery, and continuity', controlCount: 6 },
  { id: 'cr', name: 'Cryptography', description: 'Encryption at rest, in transit, and key management', controlCount: 8 },
  { id: 'dp', name: 'Data Protection', description: 'Data classification, DLP, and retention', controlCount: 9 },
  { id: 'ia', name: 'Identification & Authentication', description: 'MFA, credential management, SSO', controlCount: 7 },
  { id: 'ir', name: 'Incident Response', description: 'Detection, escalation, and post-incident review', controlCount: 8 },
  { id: 'ma', name: 'Maintenance', description: 'System and software maintenance procedures', controlCount: 4 },
  { id: 'mp', name: 'Media Protection', description: 'Secure handling, storage, and disposal of media', controlCount: 3 },
  { id: 'ns', name: 'Network Security', description: 'Firewalls, segmentation, and monitoring', controlCount: 7 },
  { id: 'pe', name: 'Physical & Environmental', description: 'Physical access, surveillance, environmental controls', controlCount: 5 },
  { id: 'pl', name: 'Planning & Governance', description: 'Security plans, policies, and governance framework', controlCount: 6 },
  { id: 'ps', name: 'Personnel Security', description: 'Background checks, onboarding/offboarding', controlCount: 5 },
  { id: 'ra', name: 'Risk Assessment', description: 'Risk identification, analysis, and evaluation', controlCount: 6 },
  { id: 'sa', name: 'System Acquisition & Development', description: 'SDLC, secure coding, vendor assessment', controlCount: 8 },
  { id: 'sc', name: 'Supply Chain & Third-Party', description: 'Vendor risk, SLAs, and subprocessor management', controlCount: 6 },
  { id: 'si', name: 'System & Information Integrity', description: 'Vulnerability management, patching, anti-malware', controlCount: 7 },
  { id: 'pm', name: 'Privacy Management', description: 'Consent, data subject rights, impact assessments', controlCount: 8 },
];

export const evidenceTypes = [
  { id: 'screenshot', label: 'Screenshot', description: 'Screen capture of configuration or dashboard', icon: 'image' },
  { id: 'document', label: 'Document', description: 'PDF, Word, or text-based policy/procedure', icon: 'file-text' },
  { id: 'api_pull', label: 'API Pull', description: 'Automated data from integrated tool API', icon: 'cloud-download' },
  { id: 'config_export', label: 'Config Export', description: 'Exported configuration file from system', icon: 'settings' },
  { id: 'attestation', label: 'Attestation', description: 'Signed statement or declaration', icon: 'pen-tool' },
  { id: 'log', label: 'Audit Log', description: 'System or application log entries', icon: 'scroll-text' },
  { id: 'scan_result', label: 'Scan Result', description: 'Vulnerability or compliance scan output', icon: 'scan' },
  { id: 'training_record', label: 'Training Record', description: 'Completion certificate or training log', icon: 'graduation-cap' },
  { id: 'access_review', label: 'Access Review', description: 'Periodic user access review evidence', icon: 'user-check' },
  { id: 'pen_test', label: 'Penetration Test', description: 'Third-party penetration test report', icon: 'shield-alert' },
  { id: 'risk_assessment', label: 'Risk Assessment', description: 'Formal risk assessment documentation', icon: 'alert-triangle' },
  { id: 'vendor_report', label: 'Vendor Report', description: 'Third-party SOC report or questionnaire', icon: 'building-2' },
  { id: 'code_review', label: 'Code Review', description: 'Pull request or code review artifacts', icon: 'git-pull-request' },
  { id: 'backup_verification', label: 'Backup Verification', description: 'Backup test or restore verification', icon: 'database-backup' },
  { id: 'network_diagram', label: 'Network Diagram', description: 'Architecture or network topology diagram', icon: 'network' },
  { id: 'change_ticket', label: 'Change Ticket', description: 'Change management ticket or approval', icon: 'ticket' },
] as const;

export type EvidenceTypeId = typeof evidenceTypes[number]['id'];

export const frameworkCatalog: CatalogFramework[] = [
  // ── Commercial ──
  { id: 'fw-soc2', name: 'SOC 2 Type II', standard: 'SOC2', category: 'commercial', description: 'Trust Services Criteria for service organizations — security, availability, processing integrity, confidentiality, privacy', controlCount: 64, popularity: 'high', enabled: true, compliancePct: 78, status: 'in_progress', controlCounts: { passing: 26, failing: 5, inProgress: 6, na: 3 }, targetDate: '2026-08-15' },
  { id: 'fw-soc2t1', name: 'SOC 2 Type I', standard: 'SOC2_T1', category: 'commercial', description: 'Point-in-time assessment of trust services criteria design', controlCount: 64, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-iso27001', name: 'ISO 27001:2022', standard: 'ISO27001', category: 'commercial', description: 'International standard for information security management systems (ISMS)', controlCount: 93, popularity: 'high', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-iso27017', name: 'ISO 27017', standard: 'ISO27017', category: 'commercial', description: 'Cloud security controls based on ISO 27002 with cloud-specific guidance', controlCount: 37, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-iso27018', name: 'ISO 27018', standard: 'ISO27018', category: 'commercial', description: 'Protection of PII in public cloud environments', controlCount: 25, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-iso42001', name: 'ISO 42001', standard: 'ISO42001', category: 'ai_governance', description: 'AI management system standard for responsible AI development and deployment', controlCount: 39, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-iso9001', name: 'ISO 9001', standard: 'ISO9001', category: 'commercial', description: 'Quality management systems — requirements for consistent products and services', controlCount: 52, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },

  // ── Privacy ──
  { id: 'fw-hipaa', name: 'HIPAA', standard: 'HIPAA', category: 'privacy', description: 'Health Insurance Portability and Accountability Act — PHI protection', controlCount: 72, popularity: 'high', enabled: true, compliancePct: 65, status: 'in_progress', controlCounts: { passing: 18, failing: 8, inProgress: 4, na: 2 }, targetDate: '2026-10-01' },
  { id: 'fw-gdpr', name: 'GDPR', standard: 'GDPR', category: 'privacy', description: 'EU General Data Protection Regulation — personal data protection and processing', controlCount: 58, popularity: 'high', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-ccpa', name: 'CCPA / CPRA', standard: 'CCPA', category: 'privacy', description: 'California Consumer Privacy Act and California Privacy Rights Act', controlCount: 32, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-pipeda', name: 'PIPEDA', standard: 'PIPEDA', category: 'privacy', description: 'Canadian Personal Information Protection and Electronic Documents Act', controlCount: 28, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-lgpd', name: 'LGPD', standard: 'LGPD', category: 'privacy', description: 'Brazilian General Data Protection Law (Lei Geral de Proteção de Dados)', controlCount: 30, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-pdpa', name: 'PDPA', standard: 'PDPA', category: 'privacy', description: 'Singapore Personal Data Protection Act', controlCount: 26, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },

  // ── Industry ──
  { id: 'fw-pci', name: 'PCI DSS v4.0', standard: 'PCI_DSS', category: 'industry', description: 'Payment Card Industry Data Security Standard for cardholder data protection', controlCount: 78, popularity: 'high', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-hitrust', name: 'HITRUST CSF', standard: 'HITRUST', category: 'industry', description: 'Health Information Trust Alliance Common Security Framework', controlCount: 156, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-csa-star', name: 'CSA STAR', standard: 'CSA_STAR', category: 'industry', description: 'Cloud Security Alliance Security Trust Assurance and Risk program', controlCount: 197, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-cis', name: 'CIS Controls v8', standard: 'CIS', category: 'industry', description: 'Center for Internet Security critical security controls benchmarks', controlCount: 153, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-mvsp', name: 'MVSP', standard: 'MVSP', category: 'industry', description: 'Minimum Viable Secure Product — baseline security checklist for enterprise vendors', controlCount: 25, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },

  // ── Federal / Government ──
  { id: 'fw-nist-800-53', name: 'NIST 800-53 Rev 5', standard: 'NIST_800_53', category: 'federal', description: 'Security and privacy controls for information systems and organizations', controlCount: 325, popularity: 'high', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-nist-800-171', name: 'NIST 800-171 Rev 2', standard: 'NIST_800_171', category: 'federal', description: 'Protecting Controlled Unclassified Information (CUI) in nonfederal systems', controlCount: 110, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-nist-csf', name: 'NIST CSF 2.0', standard: 'NIST_CSF', category: 'federal', description: 'Cybersecurity Framework — Identify, Protect, Detect, Respond, Recover, Govern', controlCount: 108, popularity: 'high', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-fedramp', name: 'FedRAMP', standard: 'FEDRAMP', category: 'federal', description: 'Federal Risk and Authorization Management Program for cloud services', controlCount: 325, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-cmmc', name: 'CMMC 2.0', standard: 'CMMC', category: 'federal', description: 'Cybersecurity Maturity Model Certification for defense contractors', controlCount: 110, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-fisma', name: 'FISMA', standard: 'FISMA', category: 'federal', description: 'Federal Information Security Modernization Act compliance', controlCount: 180, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-itar', name: 'ITAR', standard: 'ITAR', category: 'federal', description: 'International Traffic in Arms Regulations — defense article export controls', controlCount: 45, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-stateramp', name: 'StateRAMP', standard: 'STATERAMP', category: 'federal', description: 'State-level risk authorization management for cloud services', controlCount: 156, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-txramp', name: 'TX-RAMP', standard: 'TX_RAMP', category: 'federal', description: 'Texas Risk and Authorization Management Program', controlCount: 120, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },

  // ── AI Governance ──
  { id: 'fw-eu-ai-act', name: 'EU AI Act', standard: 'EU_AI_ACT', category: 'ai_governance', description: 'European Union regulation on artificial intelligence systems risk classification', controlCount: 48, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-nist-ai', name: 'NIST AI RMF', standard: 'NIST_AI_RMF', category: 'ai_governance', description: 'NIST AI Risk Management Framework for trustworthy AI', controlCount: 42, popularity: 'medium', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },

  // ── Regional ──
  { id: 'fw-irap', name: 'IRAP (Australia)', standard: 'IRAP', category: 'regional', description: 'Information Security Registered Assessors Program — Australian government', controlCount: 87, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-cyber-essentials', name: 'Cyber Essentials (UK)', standard: 'CYBER_ESSENTIALS', category: 'regional', description: 'UK government-backed scheme for baseline cybersecurity controls', controlCount: 18, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-ens', name: 'ENS (Spain)', standard: 'ENS', category: 'regional', description: 'Esquema Nacional de Seguridad — Spanish National Security Framework', controlCount: 75, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
  { id: 'fw-k-isms', name: 'K-ISMS (Korea)', standard: 'K_ISMS', category: 'regional', description: 'Korean Information Security Management System certification', controlCount: 104, popularity: 'low', enabled: false, compliancePct: 0, status: 'not_started', controlCounts: { passing: 0, failing: 0, inProgress: 0, na: 0 }, targetDate: null },
];

export const categoryLabels: Record<CatalogFramework['category'], string> = {
  commercial: 'Commercial',
  federal: 'Federal & Government',
  privacy: 'Privacy',
  industry: 'Industry',
  ai_governance: 'AI Governance',
  regional: 'Regional',
  custom: 'Custom',
};

// Enriched controls with cross-framework mapping
export interface EnrichedControl {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: string;
  categoryId: string;
  frameworks: string[]; // framework standards this maps to
  status: 'implemented' | 'in_progress' | 'failing' | 'not_implemented' | 'not_applicable';
  owner: string;
  implementationPct: number;
  lastTested: string;
  testFrequency: string;
  evidenceCount: number;
  evidenceTypes: string[];
  automatable: boolean;
  crossMappings: { framework: string; ref: string }[];
}

export const enrichedControls: EnrichedControl[] = [
  // Access Control
  { id: 'ec-1', ref: 'AC-1', title: 'Logical Access Controls', description: 'Implement mechanisms to restrict logical access to systems and data based on business requirements', category: 'Access Control', categoryId: 'ac', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_800_53'], status: 'implemented', owner: 'Sarah Chen', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'weekly', evidenceCount: 4, evidenceTypes: ['api_pull', 'config_export'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-6.1' }, { framework: 'HIPAA', ref: '164.312(a)(1)' }, { framework: 'ISO27001', ref: 'A.9.1.1' }, { framework: 'NIST_800_53', ref: 'AC-3' }] },
  { id: 'ec-2', ref: 'AC-2', title: 'Multi-Factor Authentication', description: 'Enforce MFA for all users accessing critical systems and administrative interfaces', category: 'Access Control', categoryId: 'ac', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_CSF', 'PCI_DSS'], status: 'implemented', owner: 'James Wilson', implementationPct: 100, lastTested: '2026-04-09', testFrequency: 'daily', evidenceCount: 3, evidenceTypes: ['api_pull'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-6.1' }, { framework: 'HIPAA', ref: '164.312(d)' }, { framework: 'PCI_DSS', ref: '8.3' }] },
  { id: 'ec-3', ref: 'AC-3', title: 'Role-Based Access Control', description: 'Implement RBAC to enforce least-privilege access across all systems', category: 'Access Control', categoryId: 'ac', frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'], status: 'in_progress', owner: 'Alex Kim', implementationPct: 65, lastTested: '2026-04-05', testFrequency: 'monthly', evidenceCount: 2, evidenceTypes: ['config_export', 'access_review'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-6.3' }, { framework: 'ISO27001', ref: 'A.9.2.3' }, { framework: 'NIST_800_53', ref: 'AC-2' }] },
  { id: 'ec-4', ref: 'AC-4', title: 'User Access Reviews', description: 'Conduct periodic reviews of user access rights and privileges', category: 'Access Control', categoryId: 'ac', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'PCI_DSS'], status: 'in_progress', owner: 'Jennifer Lee', implementationPct: 70, lastTested: '2026-03-31', testFrequency: 'quarterly', evidenceCount: 2, evidenceTypes: ['access_review', 'document'], automatable: false, crossMappings: [{ framework: 'SOC2', ref: 'CC-6.2' }, { framework: 'HIPAA', ref: '164.312(a)(2)(i)' }, { framework: 'PCI_DSS', ref: '7.1' }] },
  { id: 'ec-5', ref: 'AC-5', title: 'Account Provisioning & Deprovisioning', description: 'Formal processes for granting and revoking system access', category: 'Access Control', categoryId: 'ac', frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'], status: 'implemented', owner: 'Brian Young', implementationPct: 100, lastTested: '2026-04-08', testFrequency: 'continuous', evidenceCount: 5, evidenceTypes: ['api_pull', 'log'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-6.2' }, { framework: 'ISO27001', ref: 'A.9.2.1' }] },
  { id: 'ec-6', ref: 'AC-6', title: 'Privileged Access Management', description: 'Control and monitor use of elevated or administrative privileges', category: 'Access Control', categoryId: 'ac', frameworks: ['SOC2', 'HIPAA', 'NIST_800_53', 'PCI_DSS'], status: 'failing', owner: 'Alex Kim', implementationPct: 35, lastTested: '2026-04-11', testFrequency: 'weekly', evidenceCount: 1, evidenceTypes: ['api_pull'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-6.1' }, { framework: 'NIST_800_53', ref: 'AC-6' }, { framework: 'PCI_DSS', ref: '7.2' }] },

  // Cryptography
  { id: 'ec-7', ref: 'CR-1', title: 'Encryption in Transit', description: 'Enforce TLS 1.2+ for all data in transit across networks', category: 'Cryptography', categoryId: 'cr', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'PCI_DSS', 'GDPR'], status: 'implemented', owner: 'David Park', implementationPct: 100, lastTested: '2026-04-08', testFrequency: 'continuous', evidenceCount: 5, evidenceTypes: ['scan_result', 'config_export'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-7.1' }, { framework: 'HIPAA', ref: '164.312(e)(1)' }, { framework: 'PCI_DSS', ref: '4.1' }] },
  { id: 'ec-8', ref: 'CR-2', title: 'Encryption at Rest', description: 'Encrypt all sensitive data at rest using AES-256 or equivalent', category: 'Cryptography', categoryId: 'cr', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'PCI_DSS', 'GDPR'], status: 'failing', owner: 'Sarah Chen', implementationPct: 40, lastTested: '2026-04-11', testFrequency: 'continuous', evidenceCount: 1, evidenceTypes: ['config_export'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-7.2' }, { framework: 'HIPAA', ref: '164.312(a)(2)(iv)' }, { framework: 'PCI_DSS', ref: '3.4' }] },
  { id: 'ec-9', ref: 'CR-3', title: 'Key Management', description: 'Formal key management lifecycle including generation, rotation, and revocation', category: 'Cryptography', categoryId: 'cr', frameworks: ['SOC2', 'ISO27001', 'PCI_DSS'], status: 'in_progress', owner: 'David Park', implementationPct: 55, lastTested: '2026-04-06', testFrequency: 'monthly', evidenceCount: 2, evidenceTypes: ['document', 'config_export'], automatable: false, crossMappings: [{ framework: 'SOC2', ref: 'CC-7.2' }, { framework: 'PCI_DSS', ref: '3.5' }] },
  { id: 'ec-10', ref: 'CR-4', title: 'Certificate Management', description: 'Automated SSL/TLS certificate lifecycle and renewal', category: 'Cryptography', categoryId: 'cr', frameworks: ['SOC2', 'ISO27001'], status: 'implemented', owner: 'David Park', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 3, evidenceTypes: ['api_pull', 'scan_result'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-7.1' }] },

  // Network Security
  { id: 'ec-11', ref: 'NS-1', title: 'Network Segmentation', description: 'Logical separation of production, staging, and corporate networks', category: 'Network Security', categoryId: 'ns', frameworks: ['SOC2', 'PCI_DSS', 'NIST_800_53'], status: 'implemented', owner: 'James Wilson', implementationPct: 100, lastTested: '2026-04-07', testFrequency: 'weekly', evidenceCount: 3, evidenceTypes: ['config_export', 'network_diagram'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-6.6' }, { framework: 'PCI_DSS', ref: '1.3' }] },
  { id: 'ec-12', ref: 'NS-2', title: 'Firewall Management', description: 'Maintain and review firewall rules and WAF configurations', category: 'Network Security', categoryId: 'ns', frameworks: ['SOC2', 'PCI_DSS', 'NIST_800_53'], status: 'in_progress', owner: 'James Wilson', implementationPct: 75, lastTested: '2026-04-07', testFrequency: 'weekly', evidenceCount: 3, evidenceTypes: ['config_export'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-6.6' }, { framework: 'PCI_DSS', ref: '1.1' }] },
  { id: 'ec-13', ref: 'NS-3', title: 'Intrusion Detection & Prevention', description: 'Deploy IDS/IPS across critical network segments', category: 'Network Security', categoryId: 'ns', frameworks: ['SOC2', 'PCI_DSS', 'NIST_CSF'], status: 'implemented', owner: 'Maria Garcia', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 4, evidenceTypes: ['api_pull', 'scan_result'], automatable: true, crossMappings: [{ framework: 'PCI_DSS', ref: '11.4' }, { framework: 'NIST_CSF', ref: 'DE.CM' }] },

  // Incident Response
  { id: 'ec-14', ref: 'IR-1', title: 'Incident Response Plan', description: 'Documented and tested incident response procedures', category: 'Incident Response', categoryId: 'ir', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_CSF', 'GDPR'], status: 'implemented', owner: 'Maria Garcia', implementationPct: 100, lastTested: '2026-04-04', testFrequency: 'quarterly', evidenceCount: 3, evidenceTypes: ['document', 'attestation'], automatable: false, crossMappings: [{ framework: 'HIPAA', ref: '164.308(a)(6)' }, { framework: 'ISO27001', ref: 'A.16.1.1' }, { framework: 'NIST_CSF', ref: 'RS.RP' }] },
  { id: 'ec-15', ref: 'IR-2', title: 'Breach Notification', description: 'Processes and timelines for breach notification to affected parties and regulators', category: 'Incident Response', categoryId: 'ir', frameworks: ['HIPAA', 'GDPR', 'CCPA'], status: 'implemented', owner: 'Amanda Martinez', implementationPct: 100, lastTested: '2026-03-20', testFrequency: 'quarterly', evidenceCount: 2, evidenceTypes: ['document'], automatable: false, crossMappings: [{ framework: 'HIPAA', ref: '164.404' }, { framework: 'GDPR', ref: 'Art. 33-34' }] },
  { id: 'ec-16', ref: 'IR-3', title: 'Security Event Monitoring', description: 'Continuous monitoring of security events with automated alerting', category: 'Incident Response', categoryId: 'ir', frameworks: ['SOC2', 'ISO27001', 'NIST_CSF'], status: 'implemented', owner: 'Maria Garcia', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 6, evidenceTypes: ['api_pull', 'log'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-7.3' }, { framework: 'NIST_CSF', ref: 'DE.AE' }] },

  // Data Protection
  { id: 'ec-17', ref: 'DP-1', title: 'Data Classification', description: 'Classify data by sensitivity level with handling procedures for each tier', category: 'Data Protection', categoryId: 'dp', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'GDPR'], status: 'in_progress', owner: 'Sandra White', implementationPct: 60, lastTested: '2026-04-01', testFrequency: 'monthly', evidenceCount: 1, evidenceTypes: ['document'], automatable: false, crossMappings: [{ framework: 'ISO27001', ref: 'A.8.2.1' }, { framework: 'GDPR', ref: 'Art. 5' }] },
  { id: 'ec-18', ref: 'DP-2', title: 'Data Loss Prevention', description: 'Deploy DLP controls to detect and prevent unauthorized data transfer', category: 'Data Protection', categoryId: 'dp', frameworks: ['SOC2', 'HIPAA', 'PCI_DSS'], status: 'not_implemented', owner: 'Alex Kim', implementationPct: 0, lastTested: '', testFrequency: 'monthly', evidenceCount: 0, evidenceTypes: [], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-6.8' }] },
  { id: 'ec-19', ref: 'DP-3', title: 'Data Retention & Disposal', description: 'Define and enforce data retention schedules and secure disposal', category: 'Data Protection', categoryId: 'dp', frameworks: ['SOC2', 'HIPAA', 'GDPR', 'CCPA'], status: 'implemented', owner: 'Amanda Martinez', implementationPct: 100, lastTested: '2026-03-25', testFrequency: 'quarterly', evidenceCount: 3, evidenceTypes: ['document', 'attestation'], automatable: false, crossMappings: [{ framework: 'HIPAA', ref: '164.530(j)' }, { framework: 'GDPR', ref: 'Art. 17' }] },

  // Audit & Accountability
  { id: 'ec-20', ref: 'AU-1', title: 'Audit Logging', description: 'Enable comprehensive audit logging across all critical systems', category: 'Audit & Accountability', categoryId: 'au', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_800_53', 'PCI_DSS'], status: 'implemented', owner: 'Maria Garcia', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 6, evidenceTypes: ['api_pull', 'config_export', 'log'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-7.3' }, { framework: 'HIPAA', ref: '164.312(b)' }, { framework: 'PCI_DSS', ref: '10.1' }] },
  { id: 'ec-21', ref: 'AU-2', title: 'Log Retention', description: 'Retain audit logs for minimum required period per regulatory requirement', category: 'Audit & Accountability', categoryId: 'au', frameworks: ['SOC2', 'HIPAA', 'PCI_DSS'], status: 'implemented', owner: 'David Park', implementationPct: 100, lastTested: '2026-04-08', testFrequency: 'monthly', evidenceCount: 2, evidenceTypes: ['config_export'], automatable: true, crossMappings: [{ framework: 'PCI_DSS', ref: '10.7' }] },
  { id: 'ec-22', ref: 'AU-3', title: 'Log Monitoring & Alerting', description: 'Automated monitoring and anomaly detection on audit logs', category: 'Audit & Accountability', categoryId: 'au', frameworks: ['SOC2', 'NIST_CSF'], status: 'implemented', owner: 'Maria Garcia', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 4, evidenceTypes: ['api_pull'], automatable: true, crossMappings: [{ framework: 'SOC2', ref: 'CC-7.3' }, { framework: 'NIST_CSF', ref: 'DE.AE' }] },

  // Awareness & Training
  { id: 'ec-23', ref: 'AT-1', title: 'Security Awareness Training', description: 'Annual security awareness training for all employees', category: 'Awareness & Training', categoryId: 'at', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_800_53', 'PCI_DSS'], status: 'in_progress', owner: 'Jennifer Lee', implementationPct: 70, lastTested: '2026-04-06', testFrequency: 'quarterly', evidenceCount: 1, evidenceTypes: ['training_record'], automatable: false, crossMappings: [{ framework: 'HIPAA', ref: '164.308(a)(5)' }, { framework: 'PCI_DSS', ref: '12.6' }] },
  { id: 'ec-24', ref: 'AT-2', title: 'Phishing Simulation', description: 'Regular phishing simulation campaigns with remediation tracking', category: 'Awareness & Training', categoryId: 'at', frameworks: ['SOC2', 'NIST_CSF'], status: 'implemented', owner: 'Sarah Chen', implementationPct: 100, lastTested: '2026-04-03', testFrequency: 'monthly', evidenceCount: 3, evidenceTypes: ['api_pull', 'document'], automatable: true, crossMappings: [{ framework: 'NIST_CSF', ref: 'PR.AT' }] },

  // Contingency Planning
  { id: 'ec-25', ref: 'CP-1', title: 'Business Continuity Plan', description: 'Documented and tested business continuity procedures', category: 'Contingency Planning', categoryId: 'cp', frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'], status: 'implemented', owner: 'Carlos Ruiz', implementationPct: 100, lastTested: '2026-03-15', testFrequency: 'quarterly', evidenceCount: 3, evidenceTypes: ['document', 'attestation'], automatable: false, crossMappings: [{ framework: 'ISO27001', ref: 'A.17.1.1' }] },
  { id: 'ec-26', ref: 'CP-2', title: 'Backup & Recovery', description: 'Regular backups with tested restoration procedures', category: 'Contingency Planning', categoryId: 'cp', frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_800_53'], status: 'implemented', owner: 'David Park', implementationPct: 100, lastTested: '2026-04-09', testFrequency: 'weekly', evidenceCount: 4, evidenceTypes: ['backup_verification', 'config_export'], automatable: true, crossMappings: [{ framework: 'HIPAA', ref: '164.308(a)(7)' }, { framework: 'ISO27001', ref: 'A.12.3.1' }] },
  { id: 'ec-27', ref: 'CP-3', title: 'Disaster Recovery', description: 'DR plan with defined RPO/RTO and annual testing', category: 'Contingency Planning', categoryId: 'cp', frameworks: ['SOC2', 'ISO27001'], status: 'in_progress', owner: 'David Park', implementationPct: 60, lastTested: '2026-02-01', testFrequency: 'quarterly', evidenceCount: 1, evidenceTypes: ['document'], automatable: false, crossMappings: [{ framework: 'ISO27001', ref: 'A.17.1.2' }] },

  // System & Information Integrity
  { id: 'ec-28', ref: 'SI-1', title: 'Vulnerability Management', description: 'Regular vulnerability scanning and remediation tracking', category: 'System & Information Integrity', categoryId: 'si', frameworks: ['SOC2', 'ISO27001', 'NIST_CSF', 'PCI_DSS'], status: 'implemented', owner: 'Alex Kim', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'weekly', evidenceCount: 5, evidenceTypes: ['scan_result', 'api_pull'], automatable: true, crossMappings: [{ framework: 'PCI_DSS', ref: '11.2' }, { framework: 'NIST_CSF', ref: 'ID.RA' }] },
  { id: 'ec-29', ref: 'SI-2', title: 'Patch Management', description: 'Timely application of security patches to all systems', category: 'System & Information Integrity', categoryId: 'si', frameworks: ['SOC2', 'ISO27001', 'NIST_800_53', 'PCI_DSS'], status: 'in_progress', owner: 'David Park', implementationPct: 80, lastTested: '2026-04-09', testFrequency: 'weekly', evidenceCount: 3, evidenceTypes: ['api_pull', 'scan_result'], automatable: true, crossMappings: [{ framework: 'PCI_DSS', ref: '6.2' }] },
  { id: 'ec-30', ref: 'SI-3', title: 'Anti-Malware Protection', description: 'Endpoint protection with centralized management and monitoring', category: 'System & Information Integrity', categoryId: 'si', frameworks: ['SOC2', 'ISO27001', 'PCI_DSS'], status: 'implemented', owner: 'Maria Garcia', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 3, evidenceTypes: ['api_pull'], automatable: true, crossMappings: [{ framework: 'PCI_DSS', ref: '5.1' }] },

  // Privacy Management
  { id: 'ec-31', ref: 'PM-1', title: 'Privacy Impact Assessment', description: 'Conduct DPIAs for processing activities involving personal data', category: 'Privacy Management', categoryId: 'pm', frameworks: ['GDPR', 'HIPAA'], status: 'not_implemented', owner: 'Amanda Martinez', implementationPct: 0, lastTested: '', testFrequency: 'quarterly', evidenceCount: 0, evidenceTypes: [], automatable: false, crossMappings: [{ framework: 'GDPR', ref: 'Art. 35' }] },
  { id: 'ec-32', ref: 'PM-2', title: 'Consent Management', description: 'Mechanisms to obtain, track, and manage data subject consent', category: 'Privacy Management', categoryId: 'pm', frameworks: ['GDPR', 'CCPA'], status: 'not_implemented', owner: 'Amanda Martinez', implementationPct: 0, lastTested: '', testFrequency: 'monthly', evidenceCount: 0, evidenceTypes: [], automatable: true, crossMappings: [{ framework: 'GDPR', ref: 'Art. 6-7' }, { framework: 'CCPA', ref: '1798.120' }] },
  { id: 'ec-33', ref: 'PM-3', title: 'Data Subject Rights', description: 'Processes for access, deletion, portability, and rectification requests', category: 'Privacy Management', categoryId: 'pm', frameworks: ['GDPR', 'CCPA', 'LGPD'], status: 'in_progress', owner: 'Amanda Martinez', implementationPct: 45, lastTested: '2026-03-15', testFrequency: 'monthly', evidenceCount: 1, evidenceTypes: ['document'], automatable: false, crossMappings: [{ framework: 'GDPR', ref: 'Art. 15-20' }, { framework: 'CCPA', ref: '1798.100-125' }] },

  // Personnel Security
  { id: 'ec-34', ref: 'PS-1', title: 'Background Checks', description: 'Pre-employment background verification for all hires', category: 'Personnel Security', categoryId: 'ps', frameworks: ['SOC2', 'HIPAA', 'ISO27001'], status: 'implemented', owner: 'Jennifer Lee', implementationPct: 100, lastTested: '2026-04-05', testFrequency: 'continuous', evidenceCount: 3, evidenceTypes: ['document', 'attestation'], automatable: false, crossMappings: [{ framework: 'ISO27001', ref: 'A.7.1.1' }] },
  { id: 'ec-35', ref: 'PS-2', title: 'Onboarding & Offboarding', description: 'Secure processes for employee onboarding and offboarding including access provisioning', category: 'Personnel Security', categoryId: 'ps', frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'], status: 'implemented', owner: 'Brian Young', implementationPct: 100, lastTested: '2026-04-08', testFrequency: 'continuous', evidenceCount: 4, evidenceTypes: ['api_pull', 'change_ticket'], automatable: true, crossMappings: [{ framework: 'ISO27001', ref: 'A.7.3.1' }] },

  // Supply Chain
  { id: 'ec-36', ref: 'SC-1', title: 'Vendor Risk Assessment', description: 'Assess and document security posture of third-party vendors', category: 'Supply Chain & Third-Party', categoryId: 'sc', frameworks: ['SOC2', 'ISO27001', 'NIST_CSF'], status: 'in_progress', owner: 'Sandra White', implementationPct: 50, lastTested: '2026-03-20', testFrequency: 'quarterly', evidenceCount: 2, evidenceTypes: ['vendor_report', 'document'], automatable: false, crossMappings: [{ framework: 'ISO27001', ref: 'A.15.1.1' }, { framework: 'NIST_CSF', ref: 'ID.SC' }] },
  { id: 'ec-37', ref: 'SC-2', title: 'Subprocessor Management', description: 'Maintain register of subprocessors with DPA agreements', category: 'Supply Chain & Third-Party', categoryId: 'sc', frameworks: ['GDPR', 'SOC2'], status: 'implemented', owner: 'Amanda Martinez', implementationPct: 100, lastTested: '2026-03-28', testFrequency: 'quarterly', evidenceCount: 2, evidenceTypes: ['document'], automatable: false, crossMappings: [{ framework: 'GDPR', ref: 'Art. 28' }] },

  // Risk Assessment
  { id: 'ec-38', ref: 'RA-1', title: 'Risk Assessment Process', description: 'Formal risk identification, analysis, and evaluation methodology', category: 'Risk Assessment', categoryId: 'ra', frameworks: ['SOC2', 'ISO27001', 'NIST_CSF', 'HIPAA'], status: 'implemented', owner: 'Sandra White', implementationPct: 100, lastTested: '2026-04-01', testFrequency: 'quarterly', evidenceCount: 3, evidenceTypes: ['risk_assessment', 'document'], automatable: false, crossMappings: [{ framework: 'ISO27001', ref: 'A.8.2' }, { framework: 'HIPAA', ref: '164.308(a)(1)' }] },

  // Configuration Management
  { id: 'ec-39', ref: 'CM-1', title: 'Baseline Configuration', description: 'Maintain hardened baseline configurations for all system types', category: 'Configuration Management', categoryId: 'cm', frameworks: ['SOC2', 'NIST_800_53', 'CIS', 'PCI_DSS'], status: 'implemented', owner: 'David Park', implementationPct: 100, lastTested: '2026-04-09', testFrequency: 'weekly', evidenceCount: 4, evidenceTypes: ['config_export', 'scan_result'], automatable: true, crossMappings: [{ framework: 'NIST_800_53', ref: 'CM-2' }, { framework: 'PCI_DSS', ref: '2.2' }] },
  { id: 'ec-40', ref: 'CM-2', title: 'Change Management', description: 'Formal change management process with approval workflows', category: 'Configuration Management', categoryId: 'cm', frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'], status: 'implemented', owner: 'David Park', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 5, evidenceTypes: ['change_ticket', 'code_review'], automatable: true, crossMappings: [{ framework: 'ISO27001', ref: 'A.12.1.2' }] },

  // System Acquisition & Development
  { id: 'ec-41', ref: 'SA-1', title: 'Secure SDLC', description: 'Integrate security into all phases of the software development lifecycle', category: 'System Acquisition & Development', categoryId: 'sa', frameworks: ['SOC2', 'ISO27001', 'NIST_800_53', 'PCI_DSS'], status: 'implemented', owner: 'Alex Kim', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 4, evidenceTypes: ['code_review', 'document'], automatable: true, crossMappings: [{ framework: 'PCI_DSS', ref: '6.3' }] },
  { id: 'ec-42', ref: 'SA-2', title: 'Code Review & SAST', description: 'Mandatory code reviews and static analysis for all production code', category: 'System Acquisition & Development', categoryId: 'sa', frameworks: ['SOC2', 'NIST_CSF'], status: 'implemented', owner: 'Kevin Thompson', implementationPct: 100, lastTested: '2026-04-10', testFrequency: 'continuous', evidenceCount: 3, evidenceTypes: ['api_pull', 'code_review'], automatable: true, crossMappings: [{ framework: 'NIST_CSF', ref: 'PR.DS' }] },
  { id: 'ec-43', ref: 'SA-3', title: 'Penetration Testing', description: 'Annual third-party penetration testing of external and internal systems', category: 'System Acquisition & Development', categoryId: 'sa', frameworks: ['SOC2', 'PCI_DSS', 'ISO27001'], status: 'in_progress', owner: 'Sarah Chen', implementationPct: 50, lastTested: '2026-01-15', testFrequency: 'annual', evidenceCount: 1, evidenceTypes: ['pen_test'], automatable: false, crossMappings: [{ framework: 'PCI_DSS', ref: '11.3' }] },

  // PHI-specific (HIPAA)
  { id: 'ec-44', ref: 'HP-1', title: 'PHI Access Controls', description: 'Restrict access to protected health information to authorized personnel', category: 'Privacy Management', categoryId: 'pm', frameworks: ['HIPAA'], status: 'implemented', owner: 'Sarah Chen', implementationPct: 100, lastTested: '2026-04-09', testFrequency: 'weekly', evidenceCount: 4, evidenceTypes: ['api_pull', 'access_review'], automatable: true, crossMappings: [{ framework: 'HIPAA', ref: '164.312(a)(1)' }] },
  { id: 'ec-45', ref: 'HP-2', title: 'PHI Encryption', description: 'Encrypt all PHI in transit and at rest per HIPAA requirements', category: 'Privacy Management', categoryId: 'pm', frameworks: ['HIPAA'], status: 'failing', owner: 'David Park', implementationPct: 55, lastTested: '2026-04-11', testFrequency: 'continuous', evidenceCount: 2, evidenceTypes: ['config_export', 'scan_result'], automatable: true, crossMappings: [{ framework: 'HIPAA', ref: '164.312(e)(1)' }] },
];
