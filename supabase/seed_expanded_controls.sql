-- Seed ~130 additional controls across 6 frameworks (total 175+)
-- Idempotent: ON CONFLICT DO NOTHING on code
-- Run AFTER seed_frameworks.sql

-- ============================================================================
-- SOC 2 — Adding 18 controls (CC-10–CC-16, A1-3–A1-5, PI1-1–PI1-3, C1-1–C1-3, P1-1–P1-2)
-- ============================================================================
INSERT INTO public.controls (code, title, description, status, category, framework_id) VALUES
  ('CC-10', 'Vendor Risk Management', 'Third-party vendor risks identified, assessed, and monitored throughout the relationship lifecycle', 'not_started', 'Risk Assessment', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-11', 'Segregation of Duties', 'Incompatible duties segregated and access appropriately restricted to reduce fraud and error risk', 'not_started', 'Control Environment', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-12', 'Information Security Policy', 'Formal information security policy documented, approved, communicated, and reviewed annually', 'not_started', 'Control Environment', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-13', 'Security Awareness Training', 'Annual security awareness training provided to all personnel and contractors', 'not_started', 'Communication', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-14', 'Incident Response Plan', 'Incident response plan documented, tested, and updated with lessons learned', 'not_started', 'Monitoring', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-15', 'Data Classification', 'Data classified by sensitivity and handling requirements, with controls mapped to classification level', 'not_started', 'Control Activities', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-16', 'Continuous Monitoring', 'Automated monitoring tools deployed to detect control failures and security events in real time', 'not_started', 'Monitoring', 'a0000000-0000-0000-0000-000000000001'),
  ('A1-3', 'Capacity Management', 'System capacity monitored and proactively scaled to meet availability commitments', 'not_started', 'Availability', 'a0000000-0000-0000-0000-000000000001'),
  ('A1-4', 'Disaster Recovery Testing', 'Disaster recovery plan tested at least annually with documented results and remediation', 'not_started', 'Availability', 'a0000000-0000-0000-0000-000000000001'),
  ('A1-5', 'Redundancy Planning', 'Critical system components deployed with redundancy to eliminate single points of failure', 'not_started', 'Availability', 'a0000000-0000-0000-0000-000000000001'),
  ('PI1-1', 'Input Validation', 'Data input validated for completeness, accuracy, and authorization before processing', 'not_started', 'Processing Integrity', 'a0000000-0000-0000-0000-000000000001'),
  ('PI1-2', 'Error Handling', 'Processing errors detected, logged, and corrected in a timely manner with supervisory review', 'not_started', 'Processing Integrity', 'a0000000-0000-0000-0000-000000000001'),
  ('PI1-3', 'Output Verification', 'System output verified for accuracy and distributed only to authorized recipients', 'not_started', 'Processing Integrity', 'a0000000-0000-0000-0000-000000000001'),
  ('C1-1', 'Confidential Information Protection', 'Confidential information protected throughout the information lifecycle from creation to destruction', 'not_started', 'Confidentiality', 'a0000000-0000-0000-0000-000000000001'),
  ('C1-2', 'Data Encryption at Rest', 'Confidential data encrypted at rest using industry-standard cryptographic algorithms', 'not_started', 'Confidentiality', 'a0000000-0000-0000-0000-000000000001'),
  ('C1-3', 'Data Transmission Encryption', 'Confidential data encrypted during transmission over internal and external networks', 'not_started', 'Confidentiality', 'a0000000-0000-0000-0000-000000000001'),
  ('P1-1', 'Privacy Notice', 'Privacy notice published and communicated to data subjects describing collection, use, and sharing practices', 'not_started', 'Privacy', 'a0000000-0000-0000-0000-000000000001'),
  ('P1-2', 'Consent Management', 'Consent obtained, recorded, and honored for collection and use of personal information', 'not_started', 'Privacy', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- ISO 27001 — Adding 25 controls (Annex A)
-- ============================================================================
INSERT INTO public.controls (code, title, description, status, category, framework_id) VALUES
  ('A.5.2', 'Information Security Roles', 'Information security roles and responsibilities assigned and communicated across the organization', 'not_started', 'Information Security Policies', 'a0000000-0000-0000-0000-000000000002'),
  ('A.5.3', 'Policy Review', 'Information security policy reviewed at planned intervals and updated when changes occur', 'not_started', 'Information Security Policies', 'a0000000-0000-0000-0000-000000000002'),
  ('A.6.2', 'Mobile Device Policy', 'Policy and security measures adopted for mobile device usage and teleworking', 'not_started', 'Organization', 'a0000000-0000-0000-0000-000000000002'),
  ('A.6.3', 'Remote Access', 'Security controls applied to remote access connections and teleworking activities', 'not_started', 'Organization', 'a0000000-0000-0000-0000-000000000002'),
  ('A.7.2', 'Employment Terms', 'Employment agreements include roles and responsibilities for information security', 'not_started', 'Human Resource Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.7.3', 'Termination Process', 'Information security responsibilities continue after employment termination or transfer', 'not_started', 'Human Resource Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.8.3', 'Acceptable Use', 'Acceptable use rules for information and associated assets documented and enforced', 'not_started', 'Asset Management', 'a0000000-0000-0000-0000-000000000002'),
  ('A.8.4', 'Asset Return', 'All assets returned by employees upon termination of employment or contract', 'not_started', 'Asset Management', 'a0000000-0000-0000-0000-000000000002'),
  ('A.9.3', 'Privileged Access', 'Administrative and privileged access rights restricted, reviewed, and controlled', 'not_started', 'Access Control', 'a0000000-0000-0000-0000-000000000002'),
  ('A.10.2', 'Key Management', 'Cryptographic key management policy covering key generation, distribution, storage, and destruction', 'not_started', 'Cryptography', 'a0000000-0000-0000-0000-000000000002'),
  ('A.11.2', 'Equipment Security', 'Equipment sited and protected to reduce risks from environmental threats and unauthorized access', 'not_started', 'Physical Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.11.3', 'Clear Desk Policy', 'Clear desk and clear screen policy adopted to reduce risk of information exposure', 'not_started', 'Physical Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.12.2', 'Anti-Malware Controls', 'Anti-malware controls implemented and maintained with regular signature updates', 'not_started', 'Operations Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.12.4', 'Logging and Monitoring', 'Event logs recorded, protected, and retained for agreed period for investigation', 'not_started', 'Operations Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.12.5', 'Control of Operational Software', 'Installation of software on operational systems controlled and validated', 'not_started', 'Operations Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.12.7', 'Capacity Management', 'Use of resources monitored and capacity projections made to ensure performance', 'not_started', 'Operations Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.13.2', 'Information Transfer', 'Information transfer policies and procedures protect information via all communication channels', 'not_started', 'Communications Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.14.1', 'Security Requirements', 'Information security requirements included in requirements for new systems and enhancements', 'not_started', 'System Acquisition', 'a0000000-0000-0000-0000-000000000002'),
  ('A.14.3', 'Test Data Protection', 'Test data selected, protected, and controlled to avoid unauthorized access or misuse', 'not_started', 'System Acquisition', 'a0000000-0000-0000-0000-000000000002'),
  ('A.15.1', 'Supplier Security Policy', 'Information security requirements for suppliers documented and agreed upon', 'not_started', 'Supplier Relationships', 'a0000000-0000-0000-0000-000000000002'),
  ('A.15.2', 'Supplier Monitoring', 'Supplier compliance with security requirements monitored and reviewed regularly', 'not_started', 'Supplier Relationships', 'a0000000-0000-0000-0000-000000000002'),
  ('A.16.2', 'Incident Reporting', 'Security events reported through appropriate management channels in a timely manner', 'not_started', 'Incident Management', 'a0000000-0000-0000-0000-000000000002'),
  ('A.17.2', 'BCM Redundancy', 'Redundant information processing facilities maintained to meet continuity requirements', 'not_started', 'Business Continuity', 'a0000000-0000-0000-0000-000000000002'),
  ('A.18.2', 'Intellectual Property', 'Procedures ensure compliance with intellectual property rights and use of proprietary software', 'not_started', 'Compliance', 'a0000000-0000-0000-0000-000000000002'),
  ('A.18.3', 'Records Protection', 'Records protected from loss, destruction, falsification, and unauthorized access', 'not_started', 'Compliance', 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- HIPAA — Adding 20 controls (Administrative, Physical, Technical Safeguards)
-- ============================================================================
INSERT INTO public.controls (code, title, description, status, category, framework_id) VALUES
  ('164.308(b)(1)', 'Business Associate Agreements', 'Business associate agreements executed with all partners handling PHI, specifying permitted uses and safeguards', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(3)(ii)(A)', 'Workforce Supervision', 'Procedures for authorizing and supervising workforce members who work with e-PHI', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(3)(ii)(B)', 'Termination Procedures', 'Procedures for terminating access to e-PHI when workforce member employment ends', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(4)(ii)(A)', 'Access Authorization', 'Policies for granting access to e-PHI based on minimum necessary and role-based criteria', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(4)(ii)(B)', 'Access Modification', 'Procedures for modifying or removing access to e-PHI as roles and responsibilities change', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(5)(ii)(A)', 'Security Reminders', 'Periodic security reminders distributed to the workforce', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(5)(ii)(B)', 'Malware Protection', 'Procedures for guarding against, detecting, and reporting malicious software', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(5)(ii)(D)', 'Password Management', 'Procedures for creating, changing, and safeguarding passwords', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(7)(ii)(A)', 'Data Backup Plan', 'Data backup plan established and executed to create retrievable exact copies of e-PHI', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(7)(ii)(B)', 'Disaster Recovery Plan', 'Disaster recovery plan established and tested to restore e-PHI availability in emergencies', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(7)(ii)(D)', 'Testing and Revision', 'Contingency plan procedures tested and revised periodically to ensure effectiveness', 'not_started', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.310(a)(2)(i)', 'Facility Security Plan', 'Facility security plan established to prevent unauthorized physical access to e-PHI', 'not_started', 'Physical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.310(a)(2)(ii)', 'Physical Access Validation', 'Procedures to validate physical access to facilities containing e-PHI', 'not_started', 'Physical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.310(b)', 'Workstation Use', 'Policies specifying proper use of workstations that access e-PHI', 'not_started', 'Physical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.310(c)', 'Workstation Security', 'Physical safeguards to restrict access to workstations with e-PHI access', 'not_started', 'Physical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.310(d)(1)', 'Device and Media Controls', 'Policies for disposal, re-use, and accountability of devices and media containing e-PHI', 'not_started', 'Physical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.312(a)(2)(i)', 'Unique User Identification', 'Unique user identifiers assigned to each person accessing e-PHI systems', 'not_started', 'Technical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.312(a)(2)(ii)', 'Emergency Access', 'Procedures for obtaining necessary e-PHI during an emergency', 'not_started', 'Technical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.312(a)(2)(iii)', 'Automatic Logoff', 'Automatic logoff systems that terminate sessions after predetermined inactivity', 'not_started', 'Technical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.312(a)(2)(iv)', 'Encryption and Decryption', 'Encryption mechanisms to decrypt and encrypt e-PHI as needed', 'not_started', 'Technical Safeguards', 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- GDPR — Adding 17 controls (Articles 9, 12–14, 16, 18, 20–22, 24–30, 34)
-- ============================================================================
INSERT INTO public.controls (code, title, description, status, category, framework_id) VALUES
  ('GDPR-ART-9', 'Processing Special Categories', 'Processing of special categories of personal data prohibited unless explicit consent or specific exemptions apply', 'not_started', 'Lawful Processing', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-12', 'Transparent Communication', 'Information provided to data subjects in concise, transparent, intelligible, and easily accessible form', 'not_started', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-13', 'Information Collection Notice', 'Data subjects informed of identity of controller, purpose of processing, and retention period at time of collection', 'not_started', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-14', 'Information Not Obtained from Subject', 'Data subjects informed of processing when personal data not obtained directly from them', 'not_started', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-16', 'Right to Rectification', 'Data subjects entitled to correct inaccurate personal data without undue delay', 'not_started', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-18', 'Right to Restriction', 'Data subjects entitled to restrict processing under specified conditions', 'not_started', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-20', 'Data Portability', 'Data subjects entitled to receive their personal data in structured, commonly used, machine-readable format', 'not_started', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-21', 'Right to Object', 'Data subjects entitled to object to processing based on legitimate interests or direct marketing', 'not_started', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-22', 'Automated Decisions', 'Data subjects have right not to be subject to solely automated decision-making with legal effects', 'not_started', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-24', 'Controller Responsibility', 'Controller implements appropriate technical and organizational measures to ensure compliant processing', 'not_started', 'Accountability', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-25', 'Data Protection by Design', 'Data protection principles integrated into processing activities and systems at design stage', 'not_started', 'Accountability', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-26', 'Joint Controllers', 'Joint controllers determine respective responsibilities for GDPR compliance in a transparent arrangement', 'not_started', 'Accountability', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-27', 'Representative Establishment', 'Non-EU controllers appoint a representative in the EU for GDPR compliance matters', 'not_started', 'Accountability', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-28', 'Processor Agreement', 'Processing carried out under a written contract binding the processor to the controller', 'not_started', 'Accountability', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-29', 'Processor Authorization', 'Processor may not engage another processor without prior written authorization from the controller', 'not_started', 'Accountability', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-30', 'Records of Processing', 'Controller and processor maintain records of all processing activities under their responsibility', 'not_started', 'Accountability', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-34', 'Breach Communication', 'Breach communicated to data subject without undue delay when high risk to rights and freedoms', 'not_started', 'Breach Notification', 'a0000000-0000-0000-0000-000000000004')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PCI DSS — Adding 22 controls (sub-requirements across all 12 requirements)
-- ============================================================================
INSERT INTO public.controls (code, title, description, status, category, framework_id) VALUES
  ('PCI-1.1', 'Network Security Controls Policy', 'Policy and procedures defined for managing network security controls', 'not_started', 'Network Security', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-1.2', 'Network Diagrams', 'Current network diagrams maintained showing all connections to cardholder data', 'not_started', 'Network Security', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-2.1', 'Vendor Default Accounts', 'Vendor-supplied defaults changed for all system components before production deployment', 'not_started', 'Configuration', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-3.1', 'Data Retention Policy', 'Cardholder data retention and disposal policy implemented and enforced', 'not_started', 'Data Protection', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-3.2', 'Sensitive Data Masking', 'Primary account number (PAN) rendered unreadable when displayed using masking', 'not_started', 'Data Protection', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-4.1', 'Strong Cryptography', 'Strong cryptography and security protocols used to protect cardholder data in transit', 'not_started', 'Encryption', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-5.1', 'Anti-Malware Updates', 'Anti-malware solutions kept current via automatic updates and periodic scans', 'not_started', 'Malware Protection', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-5.2', 'Anti-Malware Logging', 'Anti-malware audit logs retained and reviewed in accordance with policy', 'not_started', 'Malware Protection', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-6.1', 'Secure Coding Standards', 'Secure coding standards applied to all internal development based on industry best practices', 'not_started', 'System Security', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-6.2', 'Change Control Process', 'Change control procedures documented and applied to all system component changes', 'not_started', 'System Security', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-7.1', 'Access Reviews', 'Quarterly access reviews performed for all accounts with cardholder data access', 'not_started', 'Access Control', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-7.2', 'Need-to-Know Enforcement', 'Access to cardholder data restricted to minimum necessary on a need-to-know basis', 'not_started', 'Access Control', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-8.1', 'Multi-Factor Authentication', 'Multi-factor authentication implemented for all remote and administrative access', 'not_started', 'Access Control', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-8.2', 'Password Parameters', 'Password strength parameters set including minimum length, complexity, and expiry', 'not_started', 'Access Control', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-9.1', 'Visitor Management', 'Visitors authorized, escorted, and identified before accessing sensitive areas', 'not_started', 'Physical Security', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-9.2', 'Physical Media Security', 'Physical media containing cardholder data secured, logged, and tracked during transport', 'not_started', 'Physical Security', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-10.1', 'Audit Log Review', 'Daily review of security audit logs for anomalies and suspicious activity', 'not_started', 'Monitoring', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-11.1', 'Internal Vulnerability Scans', 'Internal vulnerability scans performed quarterly and after significant network changes', 'not_started', 'Testing', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-11.2', 'Penetration Testing', 'Penetration testing performed annually and after significant infrastructure changes', 'not_started', 'Testing', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-12.1', 'Annual Policy Review', 'Information security policy reviewed and updated at least annually', 'not_started', 'Policy', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-12.2', 'Risk Assessment Process', 'Formal risk assessment conducted annually to identify threats to cardholder data', 'not_started', 'Policy', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-12.3', 'Acceptable Use Policy', 'Acceptable use policies documented and acknowledged by all personnel', 'not_started', 'Policy', 'a0000000-0000-0000-0000-000000000005')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- NIST CSF — Adding 28 controls (sub-categories across all 6 functions)
-- ============================================================================
INSERT INTO public.controls (code, title, description, status, category, framework_id) VALUES
  ('ID.AM-1', 'Hardware Asset Inventory', 'Physical devices and systems within the organization inventoried and tracked', 'not_started', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('ID.AM-2', 'Software Asset Inventory', 'Software platforms and applications within the organization inventoried and tracked', 'not_started', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('ID.AM-3', 'Data Asset Mapping', 'Data flows mapped including classification, ownership, and handling requirements', 'not_started', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('ID.RA-1', 'Vulnerability Identification', 'Vulnerabilities in systems and applications identified and documented', 'not_started', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('ID.RA-2', 'Threat Intelligence', 'Threat intelligence sources monitored and incorporated into risk assessments', 'not_started', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('ID.RA-3', 'Risk Register', 'Risk register maintained and updated with identified risks, impact, and likelihood', 'not_started', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('ID.SC-1', 'Supplier Risk Assessment', 'Third-party supplier risks assessed prior to engagement and reviewed periodically', 'not_started', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.AC-1', 'Identity Management', 'Identities and credentials issued, managed, verified, and revoked for authorized users', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.AC-2', 'Role-Based Access', 'Access permissions managed through role-based access control principles', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.AC-3', 'Remote Access Security', 'Remote access sessions secured through encryption and multi-factor authentication', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.AC-4', 'Least Privilege', 'Least privilege principle enforced across all systems and applications', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.DS-1', 'Data-at-Rest Protection', 'Data at rest protected through encryption, access controls, and integrity monitoring', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.DS-2', 'Data-in-Transit Protection', 'Data in transit protected through encryption and secure communication protocols', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.IP-1', 'Configuration Management', 'Baseline configurations established and enforced for all systems and devices', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.IP-2', 'Data Backup Management', 'Backup policies, procedures, and testing defined and executed for critical data', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.IP-3', 'System Patching', 'Patch management process ensures timely application of security-relevant updates', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.MA-1', 'Maintenance Logging', 'System maintenance and repairs performed and logged with approval tracking', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.PT-1', 'Audit Logging', 'Audit log records generated and retained for all security-relevant events', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.PT-2', 'Network Segmentation', 'Network segmented and traffic filtered to protect sensitive data and systems', 'not_started', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('DE.AE-1', 'Incident Alerting', 'Security alerts generated from monitored events and escalated to appropriate personnel', 'not_started', 'Detect', 'a0000000-0000-0000-0000-000000000006'),
  ('DE.CM-1', 'Network Monitoring', 'Network traffic monitored for unauthorized connections and anomalous activity', 'not_started', 'Detect', 'a0000000-0000-0000-0000-000000000006'),
  ('DE.CM-2', 'Endpoint Monitoring', 'Endpoint devices monitored for malicious activity and compliance with security policies', 'not_started', 'Detect', 'a0000000-0000-0000-0000-000000000006'),
  ('RS.RP-1', 'Incident Response Execution', 'Incident response plan executed in accordance with defined roles and procedures', 'not_started', 'Respond', 'a0000000-0000-0000-0000-000000000006'),
  ('RS.CO-1', 'Internal Incident Communication', 'Incident information communicated internally to stakeholders and management', 'not_started', 'Respond', 'a0000000-0000-0000-0000-000000000006'),
  ('RS.CO-2', 'External Incident Communication', 'Incidents communicated externally to customers, regulators, and law enforcement as required', 'not_started', 'Respond', 'a0000000-0000-0000-0000-000000000006'),
  ('RC.RP-1', 'Recovery Execution', 'Recovery procedures executed according to plan to restore normal operations', 'not_started', 'Recover', 'a0000000-0000-0000-0000-000000000006'),
  ('RC.RP-2', 'Recovery Testing', 'Recovery plan tested periodically with lessons learned incorporated into improvements', 'not_started', 'Recover', 'a0000000-0000-0000-0000-000000000006'),
  ('GV.OC-1', 'Cybersecurity Oversight', 'Governing body provides oversight of cybersecurity strategy and risk management', 'not_started', 'Govern', 'a0000000-0000-0000-0000-000000000006')
ON CONFLICT (code) DO NOTHING;
