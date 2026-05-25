-- Comprehensive seed data for ZeroDay GRC platform
-- Idempotent: safe to run repeatedly (uses ON CONFLICT)
-- Run AFTER seed_frameworks.sql and seed_training_courses.sql

DO $$
DECLARE
  admin_id UUID;
  profile_id UUID;
  org_id UUID := 'a0000000-0000-0000-0000-000000000000';
BEGIN
  -- ── Find admin user ──────────────────────────────────────────────
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM auth.users LIMIT 1;
    IF admin_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'admin') ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users. Create a user first.';
  END IF;

  -- ── Ensure profile exists ────────────────────────────────────────
  INSERT INTO public.profiles (user_id, display_name, job_title, department)
  VALUES (admin_id, 'Alex Chen', 'Chief Information Security Officer', 'Security')
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = 'Alex Chen',
    job_title = 'Chief Information Security Officer',
    department = 'Security'
  RETURNING id INTO profile_id;

  -- ── Organization settings ────────────────────────────────────────
  INSERT INTO public.organization_settings (id, name, industry, slug, primary_contact, plan, settings, updated_by)
  VALUES (org_id, 'ZeroDay Security Inc.', 'Cybersecurity', 'zeroday-security', 'admin@zeroday.test', 'enterprise',
    '{"timezone": "UTC", "currency": "USD", "risk_appetite": "moderate", "compliance_frameworks": ["SOC 2","ISO 27001","HIPAA","GDPR","NIST CSF"]}'::jsonb,
    admin_id)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- RISKS
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.risks (id, title, description, category, likelihood, impact, status, owner_id, mitigation_plan, residual_likelihood, residual_impact) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Data Breach via Third-Party Vendor',
     'Sensitive customer data could be exposed through inadequate security controls at a third-party vendor with access to production systems.',
     'Third Party', 4, 5, 'mitigated', admin_id,
     'Implement vendor security assessment program, require SOC 2 Type II reports, add contractual data protection clauses, conduct quarterly reviews.', 2, 3),

    ('d0000000-0000-0000-0000-000000000002', 'Ransomware Attack on Critical Systems',
     'A ransomware infection could encrypt critical servers and databases, causing prolonged service disruption and potential data loss.',
     'Infrastructure', 3, 5, 'open', admin_id,
     'Deploy EDR on all endpoints, implement immutable backups with offline copies, conduct tabletop exercises quarterly.', 2, 3),

    ('d0000000-0000-0000-0000-000000000003', 'Insider Threat — Privileged Access Abuse',
     'A malicious or negligent employee with privileged access could exfiltrate sensitive data or cause system damage.',
     'Access Control', 3, 4, 'open', admin_id,
     'Implement PAM solution, enforce least-privilege access, monitor anomalous behavior with UEBA, mandatory quarterly access reviews.', 2, 2),

    ('d0000000-0000-0000-0000-000000000004', 'GDPR Non-Compliance for EU Customer Data',
     'Lack of data subject access request (DSAR) automation and incomplete data mapping could result in GDPR fines up to 4% of global revenue.',
     'Compliance', 3, 4, 'accepted', admin_id,
     'Deploy DSAR automation platform, complete data mapping exercise, appoint Data Protection Officer.', 3, 3),

    ('d0000000-0000-0000-0000-000000000005', 'Cloud Infrastructure Misconfiguration',
     'Misconfigured S3 buckets, IAM policies, or security groups could lead to unauthorized data access or resource compromise.',
     'Infrastructure', 4, 4, 'mitigated', admin_id,
     'Deploy CSPM tooling, enforce IaC scanning in CI/CD pipeline, weekly cloud security posture reviews.', 2, 2),

    ('d0000000-0000-0000-0000-000000000006', 'Phishing Campaign Targeting Finance Team',
     'Sophisticated spear-phishing attacks targeting the finance department could result in wire fraud or credential theft.',
     'People', 4, 3, 'mitigated', admin_id,
     'Deploy advanced anti-phishing tools, conduct monthly simulated phishing campaigns, implement MFA for all financial systems.', 2, 2),

    ('d0000000-0000-0000-0000-000000000007', 'Supply Chain Software Dependency Vulnerability',
     'A critical vulnerability in an open-source or third-party library used in production could be exploited before a patch is available.',
     'Third Party', 3, 3, 'open', admin_id,
     'Implement SBOM generation for all builds, deploy SCA tooling, establish vulnerability response SLAs with vendors.', 2, 2),

    ('d0000000-0000-0000-0000-000000000008', 'Inadequate Business Continuity / DR Planning',
     'Lack of tested disaster recovery procedures could lead to extended downtime beyond RTO/RPO targets during a major incident.',
     'Operations', 2, 4, 'open', admin_id,
     'Develop comprehensive BCP/DRP documents, conduct bi-annual tabletop exercises, implement automated failover testing.', 1, 3),

    ('d0000000-0000-0000-0000-000000000009', 'Data Privacy — Unauthorized PII Collection',
     'Engineering teams may be collecting more PII than necessary without proper data protection impact assessments or consent mechanisms.',
     'Data Privacy', 3, 3, 'accepted', admin_id,
     'Implement privacy-by-design reviews in SDLC, deploy data discovery tooling, conduct annual privacy training.', 2, 2),

    ('d0000000-0000-0000-0000-000000000010', 'Legacy System EOL Security Gaps',
     'End-of-life operating systems and databases still in production no longer receive security patches, creating exploitable vulnerabilities.',
     'Infrastructure', 4, 4, 'open', admin_id,
     'Create legacy system migration roadmap, implement virtual patching via WAF/IDS, isolate legacy systems on segmented network.', 3, 2)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- INCIDENTS (spread across last 6 months for trend chart)
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.incidents (id, title, description, severity, status, reported_by, assigned_to, resolved_at, root_cause, created_at) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'Suspicious Login Attempts from Overseas IP',
     'Multiple failed login attempts detected from a Russian IP range targeting the admin portal. No successful breach detected.',
     'high', 'resolved', admin_id, admin_id, NOW() - INTERVAL '5 months', 'Brute force attack blocked by rate limiting and WAF rules.', NOW() - INTERVAL '5 months'),

    ('e0000000-0000-0000-0000-000000000002', 'Phishing Email Reported — Fake IT Support',
     'Employee reported a phishing email pretending to be from IT support requesting password reset. No credentials were compromised.',
     'medium', 'resolved', admin_id, admin_id, NOW() - INTERVAL '4 months', 'External phishing campaign targeting employees. Blocked at email gateway.', NOW() - INTERVAL '4 months'),

    ('e0000000-0000-0000-0000-000000000003', 'Critical Vulnerability in Production Web Server',
     'A critical CVE (CVSS 9.8) was identified in the Apache web server version running on production. Emergency patching initiated.',
     'critical', 'resolved', admin_id, admin_id, NOW() - INTERVAL '3 months', 'Outdated Apache version (2.4.49) vulnerable to remote code execution. Patched to 2.4.51.', NOW() - INTERVAL '3 months'),

    ('e0000000-0000-0000-0000-000000000004', 'Employee Laptop Theft — Offsite Incident',
     'A sales team members company laptop was stolen from a coffee shop. Device was encrypted and had remote wipe capability.',
     'high', 'resolved', admin_id, admin_id, NOW() - INTERVAL '2 months', 'Physical security incident. Device encrypted with BitLocker, remote wipe initiated within 30 minutes.', NOW() - INTERVAL '2 months'),

    ('e0000000-0000-0000-0000-000000000005', 'DDoS Attack on Public-Facing API',
     'Application-layer DDoS attack targeting the public REST API caused intermittent availability degradation for approximately 45 minutes.',
     'high', 'resolved', admin_id, admin_id, NOW() - INTERVAL '1 month', 'DDoS attack targeting /api/v2/search endpoint. Mitigated by Cloudflare rate limiting and IP blocking.', NOW() - INTERVAL '1 month'),

    ('e0000000-0000-0000-0000-000000000006', 'Data Exposure — S3 Bucket Misconfiguration',
     'An S3 bucket containing non-production test data was found to be publicly accessible during a routine security scan. No customer data exposed.',
     'medium', 'contained', admin_id, admin_id, NULL,
     'Infrastructure-as-code template missing bucket ACL restriction. Bucket locked down, IaC template updated.', NOW() - INTERVAL '2 weeks'),

    ('e0000000-0000-0000-0000-000000000007', 'Zero-Day Exploit Attempt on VPN Gateway',
     'Detection of exploit attempts targeting a known zero-day vulnerability in the VPN appliance. No successful compromise confirmed.',
     'critical', 'investigating', admin_id, admin_id, NULL,
     'Forensic analysis in progress. Vendor notified and patch applied. Monitoring for signs of persistence.', NOW() - INTERVAL '3 days'),

    ('e0000000-0000-0000-0000-000000000008', 'Unauthorized Access to Shared Mailbox',
     'An attacker gained access to a shared mailbox used by the facilities team through credential stuffing. Limited sensitive data.',
     'high', 'open', admin_id, admin_id, NULL,
     'Under investigation. Shared mailbox did not have MFA enabled. MFA enforced. Password rotated.', NOW() - INTERVAL '1 day')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- ASSETS
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.assets (id, name, type, owner_id, status, ip_address, location, criticality) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Production Web Server 01', 'server', admin_id, 'active', '10.0.1.10', 'AWS us-east-1', 'critical'),
    ('f0000000-0000-0000-0000-000000000002', 'Production Database Primary', 'database', admin_id, 'active', '10.0.2.5', 'AWS us-east-1', 'critical'),
    ('f0000000-0000-0000-0000-000000000003', 'Corporate Firewall (Fortinet FG-200E)', 'network', admin_id, 'active', '192.168.1.1', 'HQ - Server Room A', 'critical'),
    ('f0000000-0000-0000-0000-000000000004', 'HR Database (On-Prem)', 'database', admin_id, 'active', '10.0.3.15', 'HQ - Server Room B', 'high'),
    ('f0000000-0000-0000-0000-000000000005', 'Build Server / CI/CD Runner', 'server', admin_id, 'active', '10.0.4.20', 'AWS us-west-2', 'high'),
    ('f0000000-0000-0000-0000-000000000006', 'Email Gateway (Proofpoint)', 'network', admin_id, 'active', '203.0.113.50', 'Cloud', 'high'),
    ('f0000000-0000-0000-0000-000000000007', 'File Server (NAS)', 'server', admin_id, 'active', '192.168.2.10', 'HQ - Server Room A', 'medium'),
    ('f0000000-0000-0000-0000-000000000008', 'Employee Wi-Fi Controller', 'network', admin_id, 'active', '192.168.10.1', 'HQ - Floor 2', 'medium'),
    ('f0000000-0000-0000-0000-000000000009', 'Development Database', 'database', admin_id, 'active', '10.0.5.30', 'AWS us-east-1', 'low'),
    ('f0000000-0000-0000-0000-000000000010', 'Staging Environment K8s Cluster', 'server', admin_id, 'maintenance', '10.0.6.100', 'AWS us-east-1', 'low')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- POLICIES
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.policies (id, title, content, status, version, owner_id, review_date, approved_by, framework_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Information Security Policy',
     'This policy establishes the framework for protecting ZeroDay Security Inc.s information assets. All employees, contractors, and third-party users must comply with this policy and supporting standards. Key requirements include: (1) Classification of data based on sensitivity, (2) Role-based access control with least privilege, (3) Annual security awareness training, (4) Incident reporting within 1 hour of discovery, (5) Quarterly access reviews for all critical systems.',
     'published', '3.2', admin_id, NOW() + INTERVAL '6 months', admin_id, 'a0000000-0000-0000-0000-000000000002'),

    ('b0000000-0000-0000-0000-000000000002', 'Acceptable Use Policy',
     'Defines acceptable use of company technology resources, including computers, networks, email, internet access, and mobile devices. Prohibited activities include unauthorized access, installation of unapproved software, use of personal cloud storage for company data, and any activity that violates applicable laws or regulations.',
     'published', '2.1', admin_id, NOW() + INTERVAL '3 months', admin_id, 'a0000000-0000-0000-0000-000000000001'),

    ('b0000000-0000-0000-0000-000000000003', 'Incident Response Plan',
     'Outlines the procedures for detecting, reporting, and responding to security incidents. Covers incident classification (P1-P4), escalation paths, communication templates, forensic evidence collection procedures, and post-incident review requirements. Includes specific playbooks for ransomware, data breach, and DDoS scenarios.',
     'published', '1.5', admin_id, NOW() + INTERVAL '1 month', admin_id, 'a0000000-0000-0000-0000-000000000006'),

    ('b0000000-0000-0000-0000-000000000004', 'Data Protection and Privacy Policy',
     'Establishes requirements for the collection, processing, storage, and transfer of personal data in compliance with GDPR, CCPA, and other applicable privacy regulations. Covers data subject rights, consent management, data retention schedules, and cross-border data transfer mechanisms.',
     'in_review', '2.0', admin_id, NOW() + INTERVAL '2 months', NULL, 'a0000000-0000-0000-0000-000000000004'),

    ('b0000000-0000-0000-0000-000000000005', 'Vendor Risk Management Policy',
     'Defines the process for assessing, monitoring, and managing risks associated with third-party vendors and service providers. Requires security questionnaires for all vendors with access to company data, annual reviews for critical vendors, and contractual security requirements including right-to-audit clauses.',
     'draft', '0.8', admin_id, NOW() + INTERVAL '4 months', NULL, 'a0000000-0000-0000-0000-000000000003'),

    ('b0000000-0000-0000-0000-000000000006', 'Password and Authentication Policy',
     'Specifies password complexity requirements (minimum 12 characters, MFA mandatory for all systems), session timeout settings, account lockout thresholds (5 attempts), and privileged access management requirements. Exceptions require CISO approval.',
     'published', '1.0', admin_id, NOW() + INTERVAL '9 months', admin_id, 'a0000000-0000-0000-0000-000000000001')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- VENDORS
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.vendors (id, name, risk_tier, status, contact_email, contract_value, contract_expiry, assessment_date, notes) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Acme Cloud Services', 'critical', 'active',
     'security@acmecloud.com', 250000.00, NOW() + INTERVAL '14 months', NOW() - INTERVAL '3 months',
     'Primary cloud infrastructure provider. SOC 2 Type II report received — no significant findings last assessment.'),

    ('00000000-0000-0000-0000-000000000002', 'DataSync Analytics', 'high', 'active',
     'compliance@datasync.io', 85000.00, NOW() + INTERVAL '8 months', NOW() - INTERVAL '2 months',
     'Customer analytics platform — has access to PII. Assessment score: 82/100. Remediation plan for 3 medium findings in progress.'),

    ('00000000-0000-0000-0000-000000000003', 'SecureMail Pro', 'medium', 'active',
     'support@securemail.pro', 24000.00, NOW() + INTERVAL '6 months', NOW() - INTERVAL '5 months',
     'Email security gateway. No significant findings in last assessment.'),

    ('00000000-0000-0000-0000-000000000004', 'OfficeDesk SaaS', 'low', 'active',
     'privacy@officedesk.com', 12000.00, NOW() + INTERVAL '24 months', NOW() - INTERVAL '11 months',
     'Productivity suite — no access to sensitive systems. Standard terms apply.'),

    ('00000000-0000-0000-0000-000000000005', 'PayFlow Processing', 'critical', 'under_review',
     'security@payflow.com', 185000.00, NOW() + INTERVAL '3 months', NOW() - INTERVAL '1 month',
     'Payment processor. Assessment revealed 2 critical findings (unpatched systems, weak encryption). Remediation deadline: 45 days.'),

    ('00000000-0000-0000-0000-000000000006', 'LogMonitor Inc.', 'high', 'active',
     'compliance@logmonitor.io', 45000.00, NOW() + INTERVAL '10 months', NOW() - INTERVAL '4 months',
     'SIEM and log management provider. SOC 2 Type II certified. No issues identified.')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- ALERTS
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.alerts (id, title, message, severity, status, source, acknowledged_by) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Failed Login Anomaly Detected',
     'Over 50 failed login attempts from IP 185.220.101.x targeting the VPN gateway in the last 15 minutes.',
     'critical', 'acknowledged', 'CrowdStrike EDR', admin_id),

    ('10000000-0000-0000-0000-000000000002', 'SSL Certificate Expiring in 7 Days',
     'SSL certificate for *.zeroday.test (SHA256: A3F2...) will expire on ' || (NOW() + INTERVAL '7 days')::date || '. Auto-renewal may fail if DNS validation records are missing.',
     'high', 'acknowledged', 'Certificate Monitor', admin_id),

    ('10000000-0000-0000-0000-000000000003', 'Unapproved Software Detected',
     'Tor browser detected on workstation WS-042 (user: j.doe@zeroday.test). Not on approved software list.',
     'medium', 'new', 'EDR Agent', NULL),

    ('10000000-0000-0000-0000-000000000004', 'S3 Bucket Public Access Misconfiguration',
     'Bucket "zeroday-backup-2023" has been detected as publicly readable. Last scanned: 2 hours ago.',
     'high', 'acknowledged', 'AWS Security Hub', admin_id),

    ('10000000-0000-0000-0000-000000000005', 'Vulnerability Scan — Critical CVE Detected',
     'CVE-2025-1234 (CVSS 9.1) affecting Apache Struts 2 detected on staging server 10.0.6.100. Patch available.',
     'critical', 'new', 'Qualys VM', NULL),

    ('10000000-0000-0000-0000-000000000006', 'Phishing Campaign Alert — Known Bad Domain',
     'Email gateway blocked 12 messages from recently registered domain "zeroday-secure.com". Domain confirmed malicious.',
     'high', 'new', 'Proofpoint', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- EVIDENCE
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.evidence (id, title, type, status, source, control_id, file_url, collected_at, expires_at, uploaded_by)
  SELECT * FROM (VALUES
    ('20000000-0000-0000-0000-000000000001'::uuid, 'SOC 2 Type II Report — Acme Cloud', 'certificate', 'valid', 'manual',
     (SELECT id FROM public.controls WHERE code = 'CC-6' LIMIT 1), 'https://storage.zeroday.test/evidence/soc2-acme-2025.pdf',
     NOW() - INTERVAL '2 months', NOW() + INTERVAL '10 months', admin_id),

    ('20000000-0000-0000-0000-000000000002', 'Q4 2025 Vulnerability Scan Report', 'scan_result', 'valid', 'auto',
     (SELECT id FROM public.controls WHERE code = 'DE.CM' LIMIT 1), 'https://storage.zeroday.test/evidence/q4-vuln-scan.pdf',
     NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month', admin_id),

    ('20000000-0000-0000-0000-000000000003', 'Incident Response Tabletop Exercise Report', 'report', 'valid', 'manual',
     (SELECT id FROM public.controls WHERE code = 'A.16.1' LIMIT 1), 'https://storage.zeroday.test/evidence/ttx-2025.pdf',
     NOW() - INTERVAL '3 months', NOW() + INTERVAL '9 months', admin_id),

    ('20000000-0000-0000-0000-000000000004', 'Quarterly Access Review — Q1 2026', 'access_review', 'valid', 'manual',
     (SELECT id FROM public.controls WHERE code = 'A.9.2' LIMIT 1), 'https://storage.zeroday.test/evidence/access-review-q1-2026.pdf',
     NOW() - INTERVAL '2 weeks', NOW() + INTERVAL '2 months', admin_id),

    ('20000000-0000-0000-0000-000000000005', 'Employee Security Training Records', 'training_record', 'valid', 'auto',
     (SELECT id FROM public.controls WHERE code = '164.308(a)(5)' LIMIT 1), 'https://storage.zeroday.test/evidence/training-2026.csv',
     NOW() - INTERVAL '1 week', NOW() + INTERVAL '11 months', admin_id),

    ('20000000-0000-0000-0000-000000000006', 'Firewall Configuration Backup — Fortinet', 'config_export', 'pending_review', 'auto',
     (SELECT id FROM public.controls WHERE code = 'PCI-1' LIMIT 1), 'https://storage.zeroday.test/evidence/fortinet-config-20260301.conf',
     NOW(), NOW() + INTERVAL '6 months', admin_id)
  ) AS v
  WHERE EXISTS (SELECT 1 FROM public.controls LIMIT 1)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- TESTS
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.tests (id, name, description, control_id, status, last_run, result, schedule)
  SELECT * FROM (VALUES
    ('30000000-0000-0000-0000-000000000001'::uuid, 'Firewall Rule Review — Quarterly',
     'Automated review of all firewall rules against the principle of least privilege. Flags shadow rules, wide-open rules, and unused rules.',
     (SELECT id FROM public.controls WHERE code = 'CC-6' LIMIT 1), 'passing', NOW() - INTERVAL '5 days',
     'All 142 rules reviewed. 3 shadow rules identified and cleaned up. 0 wide-open rules.', '0 0 1 */3 *'),

    ('30000000-0000-0000-0000-000000000002', 'EDR Health Check — All Endpoints',
     'Verifies that EDR agents are installed, communicating, and up to date on all company-managed endpoints.',
     (SELECT id FROM public.controls WHERE code = 'DE.CM' LIMIT 1), 'failing', NOW() - INTERVAL '1 day',
     '238/247 endpoints healthy. 9 endpoints with stale agents (last check-in > 48 hours). 3 Linux servers missing EDR.', '0 */6 * * *'),

    ('30000000-0000-0000-0000-000000000003', 'Backup Restoration Test — Production DB',
     'Monthly automated restoration test of the production database backup in the DR environment. Measures RTO and data integrity.',
     (SELECT id FROM public.controls WHERE code = 'A.12.3' LIMIT 1), 'passing', NOW() - INTERVAL '10 days',
     'Backup restored successfully in 47 minutes (RTO: 60 min). Data integrity check passed. 0 rows corrupted.', '0 2 1 * *'),

    ('30000000-0000-0000-0000-000000000004', 'Vulnerability Scan — External Perimeter',
     'Weekly external vulnerability scan of all public-facing IP ranges and web applications.',
     (SELECT id FROM public.controls WHERE code = 'A.12.6' LIMIT 1), 'passing', NOW() - INTERVAL '3 days',
     '6 hosts scanned. 0 critical, 2 high, 5 medium findings. High findings: CVE-2025-5678 (Apache, patch scheduled next maintenance window).', '0 0 * * 0'),

    ('30000000-0000-0000-0000-000000000005', 'Phishing Simulation — Monthly Campaign',
     'Automated phishing simulation campaign sent to all employees. Tracks click rates, reporting rates, and completion of remedial training.',
     (SELECT id FROM public.controls WHERE code = '164.308(a)(5)' LIMIT 1), 'passing', NOW() - INTERVAL '2 days',
     'Campaign sent to 247 employees. 12 clicks (4.9% — below threshold of 8%). 231 reported (93.5% reporting rate).', '0 9 15 * *'),

    ('30000000-0000-0000-0000-000000000006', 'Cloud Security Posture — AWS Account',
     'Automated CSPM scan of the primary AWS account against CIS AWS Foundations Benchmark v2.0.',
     (SELECT id FROM public.controls WHERE code = 'ID.AM' LIMIT 1), 'error', NOW() - INTERVAL '1 day',
     'Scan failed: AWS API rate limit exceeded. Retry scheduled within 4 hours.', '0 */8 * * *')
  ) AS v
  WHERE EXISTS (SELECT 1 FROM public.controls LIMIT 1)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- COMPLIANCE SNAPSHOTS (last 6 months for trend chart)
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.compliance_snapshots (snapshot_date, framework, total_controls, implemented, in_progress, failing, not_started, score_pct)
  VALUES
    (NOW() - INTERVAL '5 months', 'SOC 2',     10, 5,  2, 1, 2, 50.00),
    (NOW() - INTERVAL '5 months', 'ISO 27001',  15, 10, 3, 1, 1, 66.67),
    (NOW() - INTERVAL '5 months', 'NIST CSF',   12, 6,  3, 1, 2, 50.00),
    (NOW() - INTERVAL '4 months', 'SOC 2',     10, 6,  2, 1, 1, 60.00),
    (NOW() - INTERVAL '4 months', 'ISO 27001',  15, 10, 3, 1, 1, 66.67),
    (NOW() - INTERVAL '4 months', 'NIST CSF',   12, 7,  2, 1, 2, 58.33),
    (NOW() - INTERVAL '3 months', 'SOC 2',     10, 6,  3, 0, 1, 60.00),
    (NOW() - INTERVAL '3 months', 'ISO 27001',  15, 11, 2, 1, 1, 73.33),
    (NOW() - INTERVAL '3 months', 'NIST CSF',   12, 7,  3, 0, 2, 58.33),
    (NOW() - INTERVAL '2 months', 'SOC 2',     10, 7,  2, 0, 1, 70.00),
    (NOW() - INTERVAL '2 months', 'ISO 27001',  15, 11, 3, 0, 1, 73.33),
    (NOW() - INTERVAL '2 months', 'NIST CSF',   12, 8,  2, 1, 1, 66.67),
    (NOW() - INTERVAL '1 month',  'SOC 2',     10, 7,  2, 0, 1, 70.00),
    (NOW() - INTERVAL '1 month',  'ISO 27001',  15, 12, 2, 0, 1, 80.00),
    (NOW() - INTERVAL '1 month',  'NIST CSF',   12, 8,  3, 0, 1, 66.67),
    (CURRENT_DATE, 'SOC 2',     10, 8,  1, 0, 1, 80.00),
    (CURRENT_DATE, 'ISO 27001',  15, 12, 2, 0, 1, 80.00),
    (CURRENT_DATE, 'HIPAA',      11, 8,  2, 0, 1, 72.73),
    (CURRENT_DATE, 'NIST CSF',   12, 9,  2, 0, 1, 75.00)
  ON CONFLICT (snapshot_date, framework) DO UPDATE SET
    total_controls = EXCLUDED.total_controls,
    implemented = EXCLUDED.implemented,
    in_progress = EXCLUDED.in_progress,
    failing = EXCLUDED.failing,
    not_started = EXCLUDED.not_started,
    score_pct = EXCLUDED.score_pct;

  -- ═══════════════════════════════════════════════════════════════════
  -- KNOWLEDGE BASE
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.knowledge_base (id, title, content, category, tags, author_id, status)
  VALUES
    ('50000000-0000-0000-0000-000000000001', 'How to Respond to a Phishing Email',
     '## Steps\n\n1. Do NOT click any links or download attachments.\n2. Forward the email as an attachment to security@zeroday.test.\n3. If you clicked a link, contact IT immediately.\n4. Change your password if you entered credentials.\n\n## What to Look For\n- Urgent or threatening language\n- Mismatched sender addresses\n- Generic greetings ("Dear User")\n- Unexpected attachments\n- Poor grammar or spelling',
     'guide', ARRAY['phishing', 'security', 'email', 'incident-response'], admin_id, 'published'),

    ('50000000-0000-0000-0000-000000000002', 'Data Classification Guidelines',
     '## Classification Levels\n\n**Public** — No harm if disclosed. Example: Marketing materials.\n\n**Internal** — Limited harm. Example: Internal procedures.\n\n**Confidential** — Significant harm. Example: Customer data, financial records.\n\n**Restricted** — Severe harm. Example: Trade secrets, PII.\n\n## Handling\n- Public: No special handling\n- Internal: Store on company drives only\n- Confidential: Encrypt at rest and in transit\n- Restricted: Encrypt + access logging + quarterly review',
     'policy', ARRAY['data-classification', 'policy', 'compliance'], admin_id, 'published'),

    ('50000000-0000-0000-0000-000000000003', 'VPN Access Request Process',
     '## Eligibility\n- Full-time employees requiring remote access\n- Approved contractors with signed NDA\n\n## Process\n1. Manager submits request via IT ticketing system\n2. IT verifies need and conducts background check\n3. Security team approves or denies\n4. MFA device provisioned\n5. VPN client installed and configured\n\n## Revocation\nAccess is automatically revoked upon termination or contractor end date.',
     'guide', ARRAY['vpn', 'access', 'remote-work'], admin_id, 'published'),

    ('50000000-0000-0000-0000-000000000004', 'Incident Classification Matrix',
     '## Priority Levels\n\n**P1 — Critical**\n- Active data breach\n- Ransomware with active encryption\n- Complete system outage (revenue-impacting)\n- Response time: < 15 minutes\n\n**P2 — High**\n- Suspected breach\n- Malware outbreak (contained)\n- Partial system outage\n- Response time: < 1 hour\n\n**P3 — Medium**\n- Phishing campaign\n- Single endpoint compromise\n- Non-critical system degradation\n- Response time: < 4 hours\n\n**P4 — Low**\n- Policy violation (no data exposure)\n- Failed login anomalies\n- Low-severity vulnerability\n- Response time: < 24 hours',
     'procedure', ARRAY['incident', 'classification', 'response', 'procedure'], admin_id, 'published')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- PERSONNEL (for access reviews and training tracking)
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.personnel (id, name, email, department, title, role, access_review_status, training_status, last_access_review, last_training_completed)
  VALUES
    ('40000000-0000-0000-0000-000000000001', 'Alex Chen', 'alex.chen@zeroday.test', 'Security', 'CISO', 'admin', 'current', 'completed',
     NOW() - INTERVAL '1 month', NOW() - INTERVAL '2 months'),
    ('40000000-0000-0000-0000-000000000002', 'Sarah Johnson', 'sarah.j@zeroday.test', 'Engineering', 'Lead Developer', 'analyst', 'current', 'completed',
     NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month'),
    ('40000000-0000-0000-0000-000000000003', 'Mike Torres', 'mike.torres@zeroday.test', 'Finance', 'CFO', 'viewer', 'pending', 'completed',
     NOW() - INTERVAL '6 months', NOW() - INTERVAL '3 months'),
    ('40000000-0000-0000-0000-000000000004', 'Lisa Park', 'lisa.park@zeroday.test', 'Engineering', 'DevOps Engineer', 'analyst', 'current', 'not_started',
     NOW() - INTERVAL '1 month', NOW() - INTERVAL '11 months'),
    ('40000000-0000-0000-0000-000000000005', 'James Wilson', 'james.wilson@zeroday.test', 'HR', 'HR Director', 'viewer', 'overdue', 'completed',
     NOW() - INTERVAL '13 months', NOW() - INTERVAL '2 months')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════
  -- AUDIT LOGS (for activity feed)
  -- ═══════════════════════════════════════════════════════════════════
  INSERT INTO public.audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES
    ('Updated risk treatment plan', 'risk', 'd0000000-0000-0000-0000-000000000001', admin_id,
     '{"previous_status": "open", "new_status": "mitigated", "mitigation_plan": "Implemented vendor security assessment program"}'::jsonb,
     NOW() - INTERVAL '2 hours'),
    ('Acknowledged alert', 'alert', '10000000-0000-0000-0000-000000000001', admin_id,
     '{"alert_title": "Failed Login Anomaly Detected", "severity": "critical"}'::jsonb,
     NOW() - INTERVAL '4 hours'),
    ('Created new policy', 'policy', 'b0000000-0000-0000-0000-000000000006', admin_id,
     '{"policy_title": "Password and Authentication Policy", "version": "1.0"}'::jsonb,
     NOW() - INTERVAL '1 day'),
    ('Ran vulnerability scan', 'test', '30000000-0000-0000-0000-000000000004', admin_id,
     '{"test_name": "Vulnerability Scan — External Perimeter", "result": "passing", "findings": "6 hosts, 0 critical"}'::jsonb,
     NOW() - INTERVAL '2 days'),
    ('Updated control status', 'control', NULL, admin_id,
     '{"control_code": "CC-5", "previous_status": "not_started", "new_status": "in_progress"}'::jsonb,
     NOW() - INTERVAL '3 days'),
    ('Reviewed vendor assessment', 'vendor', '00000000-0000-0000-0000-000000000005', admin_id,
     '{"vendor_name": "PayFlow Processing", "assessment_score": 72, "findings_count": 2, "critical_findings": 2}'::jsonb,
     NOW() - INTERVAL '5 days'),
    ('Completed access review', 'access_review', NULL, admin_id,
     '{"campaign": "Q1 2026 Access Review", "users_reviewed": 47, "access_removed": 3, "access_modified": 8}'::jsonb,
     NOW() - INTERVAL '1 week'),
    ('Deployed security patch', 'system', NULL, admin_id,
     '{"system": "Production Web Server 01", "cve": "CVE-2025-5678", "cvss": 7.5, "downtime_minutes": 12}'::jsonb,
     NOW() - INTERVAL '10 days')
  ON CONFLICT DO NOTHING;

END;
$$;
