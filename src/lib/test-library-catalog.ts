// Enriched Test Library Catalog — 46 test templates mapped to enriched controls & frameworks

export interface TestTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  method: 'automated' | 'manual' | 'hybrid';
  frequency: string;
  estimatedDuration: string;
  complexity: 'low' | 'medium' | 'high';
  controlRefs: string[];        // enriched control refs e.g. AC-1, CR-2
  frameworks: string[];         // framework standards
  steps: string[];
  expectedEvidence: string[];
  suggestedTools: string[];
  prerequisites: string[];
}

export const testTemplateCategories = [
  'Access Control',
  'Cryptography',
  'Network Security',
  'Incident Response',
  'Data Protection',
  'Audit & Accountability',
  'Awareness & Training',
  'Contingency Planning',
  'System Integrity',
  'Privacy',
  'Personnel Security',
  'Supply Chain',
  'Configuration & Development',
] as const;

export const allFrameworkTags = [
  'SOC2', 'HIPAA', 'ISO27001', 'PCI_DSS', 'NIST_800_53', 'NIST_CSF', 'GDPR', 'CCPA', 'CIS',
] as const;

export const testLibraryCatalog: TestTemplate[] = [
  // ─── Access Control (8) ───────────────────────────────
  {
    id: 'TL-AC-01', name: 'Logical Access Review', description: 'Validates user access permissions against the role-based access matrix. Identifies orphaned accounts, excessive privileges, and policy deviations.', category: 'Access Control', method: 'automated', frequency: 'Quarterly', estimatedDuration: '15 min', complexity: 'medium',
    controlRefs: ['AC-1', 'AC-3', 'AC-4'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_800_53'],
    steps: ['Connect to IAM provider via API', 'Export current user-role assignments', 'Compare against approved access matrix', 'Flag orphaned / excessive accounts', 'Generate access review report'],
    expectedEvidence: ['access_review_report.pdf', 'user_role_export.csv', 'exception_list.csv'],
    suggestedTools: ['Okta', 'Azure AD', 'AWS IAM'], prerequisites: ['IAM API credentials configured', 'Approved access matrix on file'],
  },
  {
    id: 'TL-AC-02', name: 'MFA Enforcement Validation', description: 'Verifies that multi-factor authentication is enabled and enforced for all users, especially privileged accounts.', category: 'Access Control', method: 'automated', frequency: 'Weekly', estimatedDuration: '5 min', complexity: 'low',
    controlRefs: ['AC-2'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_CSF', 'PCI_DSS'],
    steps: ['Query IAM provider for MFA status per user', 'Verify 100% enrollment for admin accounts', 'Check MFA method strength (TOTP vs SMS)', 'Flag non-compliant accounts', 'Report summary'],
    expectedEvidence: ['mfa_enrollment_report.csv', 'admin_mfa_verification.json'],
    suggestedTools: ['Okta', 'Duo', 'Azure AD'], prerequisites: ['IAM API access'],
  },
  {
    id: 'TL-AC-03', name: 'RBAC Configuration Audit', description: 'Audits role-based access control definitions across all systems to ensure least-privilege enforcement.', category: 'Access Control', method: 'hybrid', frequency: 'Monthly', estimatedDuration: '45 min', complexity: 'high',
    controlRefs: ['AC-3', 'AC-1'], frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'],
    steps: ['Export role definitions from all systems', 'Map roles to business functions', 'Identify over-permissioned roles', 'Review segregation of duties', 'Document recommended changes'],
    expectedEvidence: ['rbac_matrix.xlsx', 'sod_analysis.pdf', 'role_optimization_report.pdf'],
    suggestedTools: ['Okta', 'AWS IAM', 'GitHub'], prerequisites: ['Current org chart', 'System inventory'],
  },
  {
    id: 'TL-AC-04', name: 'Periodic User Access Review', description: 'Manager-certified review of all user access entitlements to confirm ongoing business need.', category: 'Access Control', method: 'manual', frequency: 'Quarterly', estimatedDuration: '2 hours', complexity: 'medium',
    controlRefs: ['AC-4'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'PCI_DSS'],
    steps: ['Generate access report per department', 'Send to department managers for review', 'Collect signed certifications', 'Revoke flagged access within SLA', 'Archive certification evidence'],
    expectedEvidence: ['manager_certifications.pdf', 'access_changes_log.csv'],
    suggestedTools: ['Okta', 'ServiceNow'], prerequisites: ['Manager list current', 'Access report generation capability'],
  },
  {
    id: 'TL-AC-05', name: 'Provisioning & Deprovisioning Audit', description: 'Tests timeliness and completeness of access provisioning for new hires and revocation for terminations.', category: 'Access Control', method: 'automated', frequency: 'Monthly', estimatedDuration: '20 min', complexity: 'medium',
    controlRefs: ['AC-5'], frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'],
    steps: ['Cross-reference HR termination list with IAM active accounts', 'Verify new hire provisioning within SLA', 'Check for lingering access post-termination', 'Validate deprovisioning across all systems', 'Report exceptions'],
    expectedEvidence: ['provisioning_audit.csv', 'terminated_access_check.json'],
    suggestedTools: ['Okta', 'Workday', 'BambooHR'], prerequisites: ['HR system API integration', 'IAM system access'],
  },
  {
    id: 'TL-AC-06', name: 'Privileged Access Monitoring', description: 'Continuous monitoring of elevated privilege usage with alerting on suspicious activity patterns.', category: 'Access Control', method: 'automated', frequency: 'Daily', estimatedDuration: '10 min', complexity: 'medium',
    controlRefs: ['AC-6'], frameworks: ['SOC2', 'HIPAA', 'NIST_800_53', 'PCI_DSS'],
    steps: ['Collect privileged session logs', 'Analyze for anomalous usage patterns', 'Verify break-glass procedures followed', 'Detect unauthorized privilege escalation', 'Alert on violations'],
    expectedEvidence: ['pam_session_report.json', 'escalation_alerts.csv'],
    suggestedTools: ['CyberArk', 'HashiCorp Vault', 'AWS CloudTrail'], prerequisites: ['PAM solution deployed', 'Log aggregation configured'],
  },
  {
    id: 'TL-AC-07', name: 'SSO Configuration Validation', description: 'Validates SSO integration health, certificate validity, and fallback authentication controls.', category: 'Access Control', method: 'automated', frequency: 'Monthly', estimatedDuration: '10 min', complexity: 'low',
    controlRefs: ['AC-1', 'AC-2'], frameworks: ['SOC2', 'ISO27001'],
    steps: ['Verify SAML/OIDC certificate expiry dates', 'Test SSO login flows for each application', 'Check fallback auth is disabled or restricted', 'Validate session timeout settings', 'Document configuration state'],
    expectedEvidence: ['sso_config_export.json', 'certificate_status.csv'],
    suggestedTools: ['Okta', 'Azure AD', 'Auth0'], prerequisites: ['SSO provider API access'],
  },
  {
    id: 'TL-AC-08', name: 'Session Management Review', description: 'Tests session timeout, concurrent session limits, and session fixation protections across applications.', category: 'Access Control', method: 'automated', frequency: 'Monthly', estimatedDuration: '15 min', complexity: 'low',
    controlRefs: ['AC-1'], frameworks: ['SOC2', 'PCI_DSS', 'NIST_800_53'],
    steps: ['Check session idle timeout configuration', 'Verify absolute session lifetime limits', 'Test concurrent session restrictions', 'Validate session token rotation', 'Check secure cookie attributes'],
    expectedEvidence: ['session_config_scan.json', 'cookie_audit.csv'],
    suggestedTools: ['Burp Suite', 'OWASP ZAP'], prerequisites: ['Application endpoints accessible'],
  },

  // ─── Cryptography (5) ────────────────────────────────
  {
    id: 'TL-CR-01', name: 'Encryption at Rest Validation', description: 'Scans all storage volumes, databases, and object stores to verify AES-256 encryption compliance.', category: 'Cryptography', method: 'automated', frequency: 'Monthly', estimatedDuration: '15 min', complexity: 'medium',
    controlRefs: ['CR-2'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'PCI_DSS', 'GDPR'],
    steps: ['Enumerate all storage resources', 'Check encryption algorithm per resource', 'Verify KMS key associations', 'Flag unencrypted or weak-encryption resources', 'Generate compliance report'],
    expectedEvidence: ['encryption_scan_results.json', 'storage_inventory.csv'],
    suggestedTools: ['AWS Config', 'Azure Policy', 'Prowler'], prerequisites: ['Cloud provider API credentials'],
  },
  {
    id: 'TL-CR-02', name: 'Encryption in Transit Audit', description: 'Validates TLS 1.2+ enforcement across all network endpoints and API gateways.', category: 'Cryptography', method: 'automated', frequency: 'Weekly', estimatedDuration: '10 min', complexity: 'low',
    controlRefs: ['CR-1'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'PCI_DSS', 'GDPR'],
    steps: ['Scan all public endpoints for TLS version', 'Check cipher suite configuration', 'Verify HSTS headers', 'Test for SSL/TLS vulnerabilities', 'Validate internal service mesh encryption'],
    expectedEvidence: ['tls_scan_report.json', 'cipher_suite_audit.csv'],
    suggestedTools: ['SSLyze', 'Qualys SSL Labs', 'nmap'], prerequisites: ['Endpoint inventory'],
  },
  {
    id: 'TL-CR-03', name: 'Key Rotation Compliance Check', description: 'Verifies all cryptographic keys are within their rotation schedule per policy.', category: 'Cryptography', method: 'automated', frequency: 'Monthly', estimatedDuration: '10 min', complexity: 'medium',
    controlRefs: ['CR-3'], frameworks: ['SOC2', 'ISO27001', 'PCI_DSS'],
    steps: ['List all active KMS keys', 'Check last rotation date against policy', 'Verify automatic rotation is enabled', 'Identify deprecated key material', 'Report overdue rotations'],
    expectedEvidence: ['key_rotation_report.json', 'kms_inventory.csv'],
    suggestedTools: ['AWS KMS', 'Azure Key Vault', 'HashiCorp Vault'], prerequisites: ['KMS API access'],
  },
  {
    id: 'TL-CR-04', name: 'Certificate Lifecycle Audit', description: 'Monitors SSL/TLS certificate expiration and automated renewal status across all domains.', category: 'Cryptography', method: 'automated', frequency: 'Weekly', estimatedDuration: '5 min', complexity: 'low',
    controlRefs: ['CR-4'], frameworks: ['SOC2', 'ISO27001'],
    steps: ['Enumerate all certificates', 'Check expiration dates (flag < 30 days)', 'Verify auto-renewal configuration', 'Validate certificate chain integrity', 'Report expiring or misconfigured certs'],
    expectedEvidence: ['certificate_inventory.csv', 'expiry_alerts.json'],
    suggestedTools: ['Let\'s Encrypt', 'AWS ACM', 'Cert Manager'], prerequisites: ['Certificate inventory available'],
  },
  {
    id: 'TL-CR-05', name: 'Cryptographic Algorithm Compliance', description: 'Reviews all systems for use of approved cryptographic algorithms and deprecated cipher elimination.', category: 'Cryptography', method: 'hybrid', frequency: 'Quarterly', estimatedDuration: '1 hour', complexity: 'high',
    controlRefs: ['CR-1', 'CR-2', 'CR-3'], frameworks: ['SOC2', 'PCI_DSS', 'NIST_800_53'],
    steps: ['Scan codebase for crypto library usage', 'Identify deprecated algorithms (MD5, SHA-1, DES)', 'Review key lengths against policy minimum', 'Check for hardcoded cryptographic material', 'Document remediation plan for non-compliant usage'],
    expectedEvidence: ['crypto_compliance_report.pdf', 'deprecated_algo_findings.csv'],
    suggestedTools: ['SonarQube', 'Semgrep', 'custom scripts'], prerequisites: ['Source code access', 'Approved algorithm list'],
  },

  // ─── Network Security (4) ────────────────────────────
  {
    id: 'TL-NS-01', name: 'Network Segmentation Validation', description: 'Verifies logical network separation between production, staging, and corporate environments.', category: 'Network Security', method: 'automated', frequency: 'Monthly', estimatedDuration: '30 min', complexity: 'high',
    controlRefs: ['NS-1'], frameworks: ['SOC2', 'PCI_DSS', 'NIST_800_53'],
    steps: ['Map network zones and VLANs', 'Test cross-zone connectivity (should fail)', 'Verify ACL rules at zone boundaries', 'Validate PCI CDE isolation', 'Document network topology changes'],
    expectedEvidence: ['network_diagram.png', 'segmentation_test_results.json', 'acl_export.csv'],
    suggestedTools: ['Nmap', 'AWS VPC Analyzer', 'Palo Alto Panorama'], prerequisites: ['Network diagram current', 'Scanner credentials'],
  },
  {
    id: 'TL-NS-02', name: 'Firewall Rule Review', description: 'Reviews all firewall and WAF rules for overly permissive configurations and stale entries.', category: 'Network Security', method: 'hybrid', frequency: 'Quarterly', estimatedDuration: '1 hour', complexity: 'high',
    controlRefs: ['NS-2'], frameworks: ['SOC2', 'PCI_DSS', 'NIST_800_53'],
    steps: ['Export all firewall rules', 'Identify any-to-any or 0.0.0.0/0 rules', 'Flag rules not used in 90+ days', 'Verify rule documentation and business justification', 'Review WAF rule effectiveness'],
    expectedEvidence: ['firewall_rule_export.csv', 'stale_rules_report.json', 'rule_justification_log.pdf'],
    suggestedTools: ['Palo Alto', 'AWS Security Groups', 'Cloudflare WAF'], prerequisites: ['Firewall management access'],
  },
  {
    id: 'TL-NS-03', name: 'IDS/IPS Effectiveness Test', description: 'Tests intrusion detection and prevention systems with known attack signatures to validate detection capability.', category: 'Network Security', method: 'automated', frequency: 'Monthly', estimatedDuration: '45 min', complexity: 'high',
    controlRefs: ['NS-3'], frameworks: ['SOC2', 'PCI_DSS', 'NIST_CSF'],
    steps: ['Deploy test attack signatures', 'Verify detection and alerting', 'Measure detection latency', 'Test blocking effectiveness (IPS mode)', 'Review false positive rates'],
    expectedEvidence: ['ids_test_results.json', 'detection_latency_report.csv'],
    suggestedTools: ['Snort', 'Suricata', 'CrowdStrike Falcon'], prerequisites: ['IDS/IPS deployed', 'Test attack toolkit approved'],
  },
  {
    id: 'TL-NS-04', name: 'DDoS Resilience Assessment', description: 'Tests DDoS mitigation controls and measures response time and capacity under simulated volumetric attacks.', category: 'Network Security', method: 'hybrid', frequency: 'Semi-Annual', estimatedDuration: '2 hours', complexity: 'high',
    controlRefs: ['NS-1', 'NS-3'], frameworks: ['SOC2', 'NIST_CSF'],
    steps: ['Schedule authorized load test window', 'Simulate volumetric attack patterns', 'Measure mitigation activation time', 'Verify service availability during attack', 'Assess bandwidth capacity and scaling'],
    expectedEvidence: ['ddos_test_report.pdf', 'mitigation_timeline.json'],
    suggestedTools: ['Cloudflare', 'AWS Shield', 'Akamai'], prerequisites: ['DDoS protection service active', 'Stakeholder approval for load test'],
  },

  // ─── Incident Response (4) ───────────────────────────
  {
    id: 'TL-IR-01', name: 'Incident Response Tabletop Exercise', description: 'Scenario-based walkthrough of the incident response plan with all stakeholders to test communication and decision-making.', category: 'Incident Response', method: 'manual', frequency: 'Semi-Annual', estimatedDuration: '3 hours', complexity: 'high',
    controlRefs: ['IR-1'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_CSF', 'GDPR'],
    steps: ['Select attack scenario (ransomware, data breach, insider threat)', 'Brief participants on scenario', 'Walk through response phases (detect → contain → eradicate → recover)', 'Test escalation chains and communication', 'Document lessons learned and action items'],
    expectedEvidence: ['tabletop_after_action_report.pdf', 'participant_attendance.csv', 'action_items.csv'],
    suggestedTools: ['Incident.io', 'PagerDuty', 'Jira'], prerequisites: ['IR plan documented', 'Key stakeholders available'],
  },
  {
    id: 'TL-IR-02', name: 'Breach Notification Drill', description: 'Tests the organization\'s ability to meet regulatory breach notification timelines for HIPAA (60 days), GDPR (72 hours), and state laws.', category: 'Incident Response', method: 'manual', frequency: 'Annual', estimatedDuration: '2 hours', complexity: 'high',
    controlRefs: ['IR-2'], frameworks: ['HIPAA', 'GDPR', 'CCPA'],
    steps: ['Simulate a reportable breach', 'Activate notification workflow', 'Draft regulatory notification within SLA', 'Draft affected individual notifications', 'Verify notification channels and contact lists'],
    expectedEvidence: ['notification_drill_report.pdf', 'notification_templates.pdf', 'timeline_compliance.json'],
    suggestedTools: ['OneTrust', 'Incident.io'], prerequisites: ['Notification templates prepared', 'Regulatory contact list current'],
  },
  {
    id: 'TL-IR-03', name: 'SIEM Alert Validation', description: 'Tests SIEM detection rules and alerting pipeline to ensure security events trigger appropriate responses.', category: 'Incident Response', method: 'automated', frequency: 'Monthly', estimatedDuration: '30 min', complexity: 'medium',
    controlRefs: ['IR-3', 'AU-3'], frameworks: ['SOC2', 'ISO27001', 'NIST_CSF'],
    steps: ['Inject synthetic security events', 'Verify SIEM rule triggering', 'Check alert routing to correct team', 'Measure mean time to alert', 'Review alert fatigue metrics'],
    expectedEvidence: ['siem_test_results.json', 'alert_latency_report.csv'],
    suggestedTools: ['Splunk', 'Elastic SIEM', 'Datadog'], prerequisites: ['SIEM deployed', 'Detection rules configured'],
  },
  {
    id: 'TL-IR-04', name: 'Forensic Readiness Assessment', description: 'Evaluates the organization\'s ability to collect, preserve, and analyze digital evidence for incident investigation.', category: 'Incident Response', method: 'manual', frequency: 'Annual', estimatedDuration: '3 hours', complexity: 'high',
    controlRefs: ['IR-1', 'AU-1'], frameworks: ['SOC2', 'ISO27001', 'NIST_CSF'],
    steps: ['Review forensic data collection capabilities', 'Verify chain of custody procedures', 'Test evidence preservation tooling', 'Validate log availability and integrity', 'Assess analyst skill readiness'],
    expectedEvidence: ['forensic_readiness_report.pdf', 'tool_inventory.csv'],
    suggestedTools: ['Velociraptor', 'KAPE', 'AWS CloudTrail'], prerequisites: ['Forensic procedures documented'],
  },

  // ─── Data Protection (4) ──────────────────────────────
  {
    id: 'TL-DP-01', name: 'Data Classification Audit', description: 'Reviews data assets against classification policy to ensure proper labeling and handling procedures.', category: 'Data Protection', method: 'hybrid', frequency: 'Quarterly', estimatedDuration: '2 hours', complexity: 'high',
    controlRefs: ['DP-1'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'GDPR'],
    steps: ['Inventory data repositories', 'Sample records for classification accuracy', 'Verify labeling on sensitive data stores', 'Check handling procedures per classification tier', 'Report unclassified or misclassified data'],
    expectedEvidence: ['classification_audit_report.pdf', 'data_inventory.csv'],
    suggestedTools: ['BigID', 'Varonis', 'AWS Macie'], prerequisites: ['Data classification policy approved'],
  },
  {
    id: 'TL-DP-02', name: 'DLP Effectiveness Test', description: 'Tests data loss prevention controls by simulating unauthorized data exfiltration attempts across all channels.', category: 'Data Protection', method: 'automated', frequency: 'Monthly', estimatedDuration: '30 min', complexity: 'medium',
    controlRefs: ['DP-2'], frameworks: ['SOC2', 'HIPAA', 'PCI_DSS'],
    steps: ['Create test data matching DLP patterns (SSN, credit card)', 'Attempt transfer via email, USB, cloud storage, web', 'Verify DLP blocks or alerts on each channel', 'Measure detection accuracy and false positive rate', 'Document bypass attempts that succeeded'],
    expectedEvidence: ['dlp_test_results.json', 'channel_coverage_report.csv'],
    suggestedTools: ['Symantec DLP', 'Microsoft Purview', 'Zscaler'], prerequisites: ['DLP solution deployed', 'Test data approved'],
  },
  {
    id: 'TL-DP-03', name: 'Data Retention Compliance Check', description: 'Validates that data retention schedules are enforced and that data past retention period is securely disposed.', category: 'Data Protection', method: 'hybrid', frequency: 'Quarterly', estimatedDuration: '1 hour', complexity: 'medium',
    controlRefs: ['DP-3'], frameworks: ['SOC2', 'HIPAA', 'GDPR', 'CCPA'],
    steps: ['Review retention schedule by data type', 'Query databases for records past retention date', 'Verify disposal procedures executed', 'Check backup media for retained data', 'Document compliance status'],
    expectedEvidence: ['retention_compliance_report.pdf', 'disposal_records.csv'],
    suggestedTools: ['AWS S3 Lifecycle', 'custom scripts'], prerequisites: ['Retention policy documented'],
  },
  {
    id: 'TL-DP-04', name: 'Backup Integrity Verification', description: 'Tests backup completeness and restore capability to verify RPO/RTO compliance.', category: 'Data Protection', method: 'automated', frequency: 'Weekly', estimatedDuration: '30 min', complexity: 'medium',
    controlRefs: ['CP-2'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_800_53'],
    steps: ['Verify backup job completion for all critical systems', 'Perform checksum validation on backup files', 'Execute test restore to isolated environment', 'Measure restore time against RTO targets', 'Validate data integrity post-restore'],
    expectedEvidence: ['backup_status_report.json', 'restore_test_log.csv'],
    suggestedTools: ['AWS Backup', 'Veeam', 'Commvault'], prerequisites: ['Backup jobs configured', 'Restore environment available'],
  },

  // ─── Audit & Accountability (3) ──────────────────────
  {
    id: 'TL-AU-01', name: 'Audit Log Completeness Check', description: 'Validates that all critical systems are generating audit logs with required event types and fields.', category: 'Audit & Accountability', method: 'automated', frequency: 'Weekly', estimatedDuration: '15 min', complexity: 'medium',
    controlRefs: ['AU-1'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_800_53', 'PCI_DSS'],
    steps: ['Enumerate all systems requiring audit logging', 'Verify log generation for each system', 'Check required event types are captured', 'Validate log field completeness', 'Report gaps in coverage'],
    expectedEvidence: ['log_coverage_report.json', 'system_inventory.csv'],
    suggestedTools: ['Splunk', 'Elastic', 'Datadog'], prerequisites: ['System inventory current', 'Logging requirements defined'],
  },
  {
    id: 'TL-AU-02', name: 'Log Retention Validation', description: 'Confirms that audit logs are retained for the minimum required period per regulatory requirements (e.g., PCI DSS 1 year, HIPAA 6 years).', category: 'Audit & Accountability', method: 'automated', frequency: 'Monthly', estimatedDuration: '10 min', complexity: 'low',
    controlRefs: ['AU-2'], frameworks: ['SOC2', 'HIPAA', 'PCI_DSS'],
    steps: ['Check log storage retention policies', 'Verify oldest available log entries', 'Validate immutability controls', 'Test log retrieval from cold storage', 'Document retention compliance per regulation'],
    expectedEvidence: ['retention_validation.json', 'storage_policy_export.csv'],
    suggestedTools: ['AWS CloudWatch', 'S3 Glacier', 'Elastic'], prerequisites: ['Retention requirements documented'],
  },
  {
    id: 'TL-AU-03', name: 'Anomaly Detection Effectiveness', description: 'Tests UEBA and anomaly detection rules to ensure unusual patterns trigger appropriate alerts.', category: 'Audit & Accountability', method: 'automated', frequency: 'Monthly', estimatedDuration: '20 min', complexity: 'medium',
    controlRefs: ['AU-3', 'IR-3'], frameworks: ['SOC2', 'NIST_CSF'],
    steps: ['Inject synthetic anomalous behavior patterns', 'Verify UEBA rule triggering', 'Check alert severity classification', 'Measure false positive rate', 'Review detection model accuracy'],
    expectedEvidence: ['anomaly_test_results.json', 'detection_metrics.csv'],
    suggestedTools: ['Splunk UBA', 'Exabeam', 'Microsoft Sentinel'], prerequisites: ['UEBA/anomaly detection deployed'],
  },

  // ─── Awareness & Training (2) ────────────────────────
  {
    id: 'TL-AT-01', name: 'Phishing Simulation Campaign', description: 'Sends simulated phishing emails to measure employee susceptibility and training effectiveness.', category: 'Awareness & Training', method: 'automated', frequency: 'Monthly', estimatedDuration: '1 week (campaign)', complexity: 'medium',
    controlRefs: ['AT-2'], frameworks: ['SOC2', 'NIST_CSF'],
    steps: ['Design phishing email templates (varied difficulty)', 'Select target population', 'Launch campaign and track click/report rates', 'Deliver immediate training to clickers', 'Generate trend report vs. previous campaigns'],
    expectedEvidence: ['phishing_campaign_report.pdf', 'click_rate_trend.csv', 'training_completion.csv'],
    suggestedTools: ['KnowBe4', 'Proofpoint', 'Cofense'], prerequisites: ['Phishing platform configured', 'Employee email list'],
  },
  {
    id: 'TL-AT-02', name: 'Security Awareness Assessment', description: 'Assesses employee security knowledge through questionnaires and identifies training gaps.', category: 'Awareness & Training', method: 'manual', frequency: 'Quarterly', estimatedDuration: '30 min', complexity: 'low',
    controlRefs: ['AT-1'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_800_53', 'PCI_DSS'],
    steps: ['Distribute security knowledge assessment', 'Analyze results by department and topic', 'Identify weakest knowledge areas', 'Schedule targeted remediation training', 'Track completion and re-assessment scores'],
    expectedEvidence: ['assessment_results.csv', 'training_gap_analysis.pdf'],
    suggestedTools: ['KnowBe4', 'custom LMS'], prerequisites: ['Assessment content developed'],
  },

  // ─── Contingency Planning (3) ────────────────────────
  {
    id: 'TL-CP-01', name: 'Business Continuity Plan Walkthrough', description: 'Tabletop review of the BCP with key stakeholders to validate procedures and contact chains.', category: 'Contingency Planning', method: 'manual', frequency: 'Semi-Annual', estimatedDuration: '2 hours', complexity: 'high',
    controlRefs: ['CP-1'], frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'],
    steps: ['Select disruption scenario (facility loss, pandemic, vendor failure)', 'Walk through BCP activation procedures', 'Verify contact trees and escalation paths', 'Test alternate work location procedures', 'Document gaps and update BCP'],
    expectedEvidence: ['bcp_walkthrough_report.pdf', 'attendee_list.csv', 'action_items.csv'],
    suggestedTools: ['Fusion Risk Management', 'Castellan'], prerequisites: ['BCP document current'],
  },
  {
    id: 'TL-CP-02', name: 'Disaster Recovery Failover Test', description: 'Executes full DR failover to secondary site and validates RTO/RPO compliance.', category: 'Contingency Planning', method: 'hybrid', frequency: 'Annual', estimatedDuration: '4 hours', complexity: 'high',
    controlRefs: ['CP-3'], frameworks: ['SOC2', 'ISO27001'],
    steps: ['Schedule failover window with stakeholders', 'Initiate DR failover to secondary region', 'Validate all critical services operational', 'Measure actual RTO vs. target', 'Measure data loss vs. RPO target', 'Failback to primary and verify'],
    expectedEvidence: ['dr_failover_report.pdf', 'rto_rpo_measurements.json'],
    suggestedTools: ['AWS Multi-Region', 'Azure Site Recovery'], prerequisites: ['DR environment provisioned', 'Change management approval'],
  },
  {
    id: 'TL-CP-03', name: 'Backup Restore Drill', description: 'Full restoration test of critical system backups to verify recoverability and data integrity.', category: 'Contingency Planning', method: 'automated', frequency: 'Quarterly', estimatedDuration: '1 hour', complexity: 'medium',
    controlRefs: ['CP-2'], frameworks: ['SOC2', 'HIPAA', 'ISO27001', 'NIST_800_53'],
    steps: ['Select critical systems for restore test', 'Restore from latest backup to isolated env', 'Validate application functionality post-restore', 'Verify data integrity via checksums', 'Measure total restore time'],
    expectedEvidence: ['restore_test_report.json', 'integrity_verification.csv'],
    suggestedTools: ['AWS Backup', 'Veeam'], prerequisites: ['Isolated restore environment', 'Backup schedule current'],
  },

  // ─── System Integrity (3) ────────────────────────────
  {
    id: 'TL-SI-01', name: 'Vulnerability Scan', description: 'Automated external and internal vulnerability scanning with CVE identification and severity scoring.', category: 'System Integrity', method: 'automated', frequency: 'Weekly', estimatedDuration: '30 min', complexity: 'medium',
    controlRefs: ['SI-1'], frameworks: ['SOC2', 'ISO27001', 'NIST_CSF', 'PCI_DSS'],
    steps: ['Run authenticated internal scan', 'Run unauthenticated external scan', 'Correlate findings with CVE database', 'Score by CVSS and asset criticality', 'Generate prioritized remediation list'],
    expectedEvidence: ['vuln_scan_report.pdf', 'cve_findings.csv'],
    suggestedTools: ['Qualys', 'Tenable Nessus', 'Rapid7 InsightVM'], prerequisites: ['Scanner agents deployed', 'Scan credentials configured'],
  },
  {
    id: 'TL-SI-02', name: 'Patch Compliance Check', description: 'Verifies that all systems are patched within the defined SLA window based on severity.', category: 'System Integrity', method: 'automated', frequency: 'Weekly', estimatedDuration: '15 min', complexity: 'medium',
    controlRefs: ['SI-2'], frameworks: ['SOC2', 'ISO27001', 'NIST_800_53', 'PCI_DSS'],
    steps: ['Query patch management system for status', 'Identify systems missing critical patches (SLA: 72h)', 'Identify systems missing high patches (SLA: 7 days)', 'Flag systems beyond SLA window', 'Report compliance percentage'],
    expectedEvidence: ['patch_compliance_report.json', 'overdue_patches.csv'],
    suggestedTools: ['WSUS', 'Jamf', 'AWS Systems Manager'], prerequisites: ['Patch management system deployed'],
  },
  {
    id: 'TL-SI-03', name: 'Endpoint Protection Validation', description: 'Validates EDR/antivirus deployment coverage, signature currency, and detection capability.', category: 'System Integrity', method: 'automated', frequency: 'Daily', estimatedDuration: '10 min', complexity: 'low',
    controlRefs: ['SI-3'], frameworks: ['SOC2', 'ISO27001', 'PCI_DSS'],
    steps: ['Query EDR console for agent deployment status', 'Check signature/definition currency', 'Verify real-time protection enabled', 'Test detection with EICAR test file', 'Flag unprotected endpoints'],
    expectedEvidence: ['edr_coverage_report.json', 'detection_test.json'],
    suggestedTools: ['CrowdStrike', 'SentinelOne', 'Microsoft Defender'], prerequisites: ['EDR solution deployed'],
  },

  // ─── Privacy (3) ─────────────────────────────────────
  {
    id: 'TL-PM-01', name: 'Data Protection Impact Assessment Review', description: 'Reviews DPIAs for all processing activities involving personal data to ensure regulatory compliance.', category: 'Privacy', method: 'manual', frequency: 'Quarterly', estimatedDuration: '2 hours', complexity: 'high',
    controlRefs: ['PM-1'], frameworks: ['GDPR', 'HIPAA'],
    steps: ['Inventory data processing activities', 'Verify DPIA completed for high-risk activities', 'Review risk mitigation measures documented', 'Check DPA supervisory authority consultations', 'Update DPIA register'],
    expectedEvidence: ['dpia_review_report.pdf', 'processing_activity_register.csv'],
    suggestedTools: ['OneTrust', 'TrustArc'], prerequisites: ['Processing activity inventory', 'DPIA templates'],
  },
  {
    id: 'TL-PM-02', name: 'Consent Mechanism Validation', description: 'Tests consent collection, storage, and withdrawal mechanisms across all user-facing touchpoints.', category: 'Privacy', method: 'hybrid', frequency: 'Monthly', estimatedDuration: '45 min', complexity: 'medium',
    controlRefs: ['PM-2'], frameworks: ['GDPR', 'CCPA'],
    steps: ['Test cookie consent banner functionality', 'Verify consent records stored correctly', 'Test consent withdrawal flow', 'Validate consent propagation to downstream systems', 'Check consent receipt generation'],
    expectedEvidence: ['consent_test_results.json', 'consent_records_sample.csv'],
    suggestedTools: ['OneTrust', 'Cookiebot'], prerequisites: ['Consent management platform deployed'],
  },
  {
    id: 'TL-PM-03', name: 'Data Subject Rights Fulfillment Test', description: 'Tests the organization\'s ability to fulfill DSAR requests (access, deletion, portability) within regulatory timelines.', category: 'Privacy', method: 'manual', frequency: 'Quarterly', estimatedDuration: '1 hour', complexity: 'medium',
    controlRefs: ['PM-3'], frameworks: ['GDPR', 'CCPA'],
    steps: ['Submit test access request', 'Verify response within 30-day timeline (GDPR)', 'Test deletion request with verification', 'Test data portability export format', 'Validate identity verification process'],
    expectedEvidence: ['dsar_test_report.pdf', 'fulfillment_timeline.json'],
    suggestedTools: ['OneTrust', 'DataGrail'], prerequisites: ['DSAR process documented'],
  },

  // ─── Personnel Security (2) ──────────────────────────
  {
    id: 'TL-PS-01', name: 'Background Check Compliance', description: 'Verifies that background checks are completed for all employees before or within onboarding SLA.', category: 'Personnel Security', method: 'manual', frequency: 'Quarterly', estimatedDuration: '1 hour', complexity: 'low',
    controlRefs: ['PS-1'], frameworks: ['SOC2', 'HIPAA', 'ISO27001'],
    steps: ['Pull list of new hires for the period', 'Cross-reference with background check records', 'Verify completion before system access granted', 'Check contractor / vendor personnel coverage', 'Report any gaps or delays'],
    expectedEvidence: ['background_check_compliance.csv', 'gap_report.pdf'],
    suggestedTools: ['Checkr', 'Sterling', 'GoodHire'], prerequisites: ['HR system access', 'Background check vendor portal'],
  },
  {
    id: 'TL-PS-02', name: 'Onboarding & Offboarding Process Audit', description: 'Validates that onboarding and offboarding checklists are followed completely for all personnel changes.', category: 'Personnel Security', method: 'hybrid', frequency: 'Monthly', estimatedDuration: '45 min', complexity: 'medium',
    controlRefs: ['PS-2', 'AC-5'], frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'],
    steps: ['Sample recent onboarding cases', 'Verify all checklist items completed', 'Sample recent offboarding cases', 'Confirm access revoked across all systems', 'Check asset return documentation'],
    expectedEvidence: ['onboarding_audit.csv', 'offboarding_audit.csv', 'asset_return_log.csv'],
    suggestedTools: ['BambooHR', 'Workday', 'Okta'], prerequisites: ['Onboarding/offboarding checklists defined'],
  },

  // ─── Supply Chain (2) ────────────────────────────────
  {
    id: 'TL-SC-01', name: 'Vendor Security Assessment', description: 'Assesses third-party vendor security posture through questionnaire, SOC 2 report review, and risk scoring.', category: 'Supply Chain', method: 'manual', frequency: 'Annual', estimatedDuration: '3 hours', complexity: 'high',
    controlRefs: ['SC-1'], frameworks: ['SOC2', 'ISO27001', 'NIST_CSF'],
    steps: ['Send security questionnaire to vendor', 'Review vendor SOC 2 / ISO 27001 reports', 'Evaluate vendor\'s complementary user entity controls', 'Score vendor risk tier (critical/high/medium/low)', 'Document findings and required remediation'],
    expectedEvidence: ['vendor_assessment_report.pdf', 'risk_score_matrix.csv', 'vendor_soc2_report.pdf'],
    suggestedTools: ['Vanta', 'SecurityScorecard', 'BitSight'], prerequisites: ['Vendor inventory current', 'Assessment questionnaire approved'],
  },
  {
    id: 'TL-SC-02', name: 'Subprocessor Register Review', description: 'Reviews and validates the subprocessor register for completeness, DPA status, and data flow documentation.', category: 'Supply Chain', method: 'manual', frequency: 'Quarterly', estimatedDuration: '1 hour', complexity: 'medium',
    controlRefs: ['SC-2'], frameworks: ['GDPR', 'SOC2'],
    steps: ['Export current subprocessor register', 'Verify DPA signed for each subprocessor', 'Check data flow documentation accuracy', 'Validate notification process for subprocessor changes', 'Update register with any new subprocessors'],
    expectedEvidence: ['subprocessor_register.csv', 'dpa_status_report.pdf'],
    suggestedTools: ['OneTrust', 'custom register'], prerequisites: ['Subprocessor register exists'],
  },

  // ─── Configuration & Development (3) ─────────────────
  {
    id: 'TL-CD-01', name: 'Baseline Configuration Audit', description: 'Compares live system configurations against approved security baselines (CIS Benchmarks, STIGs).', category: 'Configuration & Development', method: 'automated', frequency: 'Weekly', estimatedDuration: '20 min', complexity: 'medium',
    controlRefs: ['CM-1'], frameworks: ['SOC2', 'NIST_800_53', 'CIS', 'PCI_DSS'],
    steps: ['Run CIS Benchmark scans on all system types', 'Compare against approved baselines', 'Score compliance percentage per system', 'Flag critical deviations', 'Generate drift report'],
    expectedEvidence: ['cis_benchmark_report.pdf', 'config_drift.csv'],
    suggestedTools: ['CIS-CAT', 'AWS Config', 'Chef InSpec'], prerequisites: ['Baselines documented', 'Scanner agents deployed'],
  },
  {
    id: 'TL-CD-02', name: 'Change Management Process Audit', description: 'Reviews change management tickets for proper approval, testing, and rollback documentation.', category: 'Configuration & Development', method: 'hybrid', frequency: 'Monthly', estimatedDuration: '1 hour', complexity: 'medium',
    controlRefs: ['CM-2'], frameworks: ['SOC2', 'ISO27001', 'NIST_800_53'],
    steps: ['Sample recent change tickets', 'Verify CAB/peer approval documented', 'Check pre-deployment testing evidence', 'Verify rollback plan attached', 'Confirm post-implementation review completed'],
    expectedEvidence: ['change_audit_report.pdf', 'sample_tickets.csv'],
    suggestedTools: ['Jira', 'ServiceNow', 'GitHub'], prerequisites: ['Change management policy in place'],
  },
  {
    id: 'TL-CD-03', name: 'SAST & Code Review Compliance', description: 'Validates that all production code changes undergo static analysis and peer review before deployment.', category: 'Configuration & Development', method: 'automated', frequency: 'Weekly', estimatedDuration: '15 min', complexity: 'medium',
    controlRefs: ['SA-1', 'SA-2'], frameworks: ['SOC2', 'NIST_CSF'],
    steps: ['Query CI/CD pipeline for SAST scan results', 'Verify scan pass rate on recent deployments', 'Check code review approval on all merged PRs', 'Identify any bypass or emergency deployments', 'Report compliance percentage'],
    expectedEvidence: ['sast_compliance_report.json', 'pr_review_audit.csv'],
    suggestedTools: ['SonarQube', 'Snyk', 'GitHub'], prerequisites: ['CI/CD pipeline with SAST integration'],
  },
];

// Helper: get all unique categories from the catalog
export function getTestCategories(): string[] {
  return [...new Set(testLibraryCatalog.map(t => t.category))];
}

// Helper: get all unique framework tags from the catalog
export function getTestFrameworks(): string[] {
  return [...new Set(testLibraryCatalog.flatMap(t => t.frameworks))];
}

// Helper: find templates by control ref
export function getTestsForControl(controlRef: string): TestTemplate[] {
  return testLibraryCatalog.filter(t => t.controlRefs.includes(controlRef));
}

// Helper: find templates by framework
export function getTestsForFramework(framework: string): TestTemplate[] {
  return testLibraryCatalog.filter(t => t.frameworks.includes(framework));
}
