-- Seed 6 core frameworks with 45 cross-mapped controls
-- Idempotent: safe to run repeatedly

INSERT INTO public.frameworks (id, name, version, description, category, total_controls, enabled)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'SOC 2', 'Type II', 'Trust Services Criteria for service organizations — security, availability, processing integrity, confidentiality, privacy', 'commercial', 64, true),
  ('a0000000-0000-0000-0000-000000000002', 'ISO 27001', '2022', 'International standard for information security management systems (ISMS)', 'commercial', 93, true),
  ('a0000000-0000-0000-0000-000000000003', 'HIPAA', 'Security Rule', 'Health Insurance Portability and Accountability Act — PHI protection', 'privacy', 72, true),
  ('a0000000-0000-0000-0000-000000000004', 'GDPR', '2018', 'EU General Data Protection Regulation — personal data protection and processing', 'privacy', 58, true),
  ('a0000000-0000-0000-0000-000000000005', 'PCI DSS', 'v4.0', 'Payment Card Industry Data Security Standard for cardholder data protection', 'industry', 78, false),
  ('a0000000-0000-0000-0000-000000000006', 'NIST CSF', '2.0', 'Cybersecurity Framework — Identify, Protect, Detect, Respond, Recover, Govern', 'federal', 108, true)
ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version, description = EXCLUDED.description, category = EXCLUDED.category, total_controls = EXCLUDED.total_controls;

INSERT INTO public.controls (code, title, description, status, category, framework_id) VALUES
  -- SOC 2 controls
  ('CC-1', 'Control Environment', 'Commitment to integrity, ethical values, and oversight', 'implemented', 'Control Environment', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-2', 'Communication & Information', 'Relevant information communicated to support internal control', 'implemented', 'Communication', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-3', 'Risk Assessment', 'Identification and analysis of risks to achieving objectives', 'implemented', 'Risk Assessment', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-4', 'Monitoring Activities', 'Ongoing evaluations to ascertain whether controls are present and functioning', 'implemented', 'Monitoring', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-5', 'Control Activities', 'Policies and procedures established to achieve objectives', 'in_progress', 'Control Activities', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-6', 'Logical & Physical Access', 'Restrict logical and physical access to systems and data', 'implemented', 'Access Control', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-7', 'System Operations', 'System configured, monitored, and maintained in accordance with policies', 'implemented', 'System Operations', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-8', 'Change Management', 'Changes to system are authorized, tested, and tracked', 'implemented', 'Change Management', 'a0000000-0000-0000-0000-000000000001'),
  ('CC-9', 'Risk Mitigation', 'Identified risks are mitigated through effective controls', 'in_progress', 'Risk Mitigation', 'a0000000-0000-0000-0000-000000000001'),
  ('A1-1', 'Availability', 'System availability monitored and maintained to meet commitments', 'implemented', 'Availability', 'a0000000-0000-0000-0000-000000000001'),
  ('A1-2', 'Processing Integrity', 'Processing is complete, accurate, timely, and authorized', 'in_progress', 'Processing Integrity', 'a0000000-0000-0000-0000-000000000001'),

  -- ISO 27001 controls (Annex A subset)
  ('A.5.1', 'Information Security Policy', 'Management direction and support for information security', 'implemented', 'Information Security Policies', 'a0000000-0000-0000-0000-000000000002'),
  ('A.6.1', 'Internal Organization', 'Information security roles and responsibilities defined', 'implemented', 'Organization', 'a0000000-0000-0000-0000-000000000002'),
  ('A.7.1', 'Pre-employment Screening', 'Background verification checks for all candidates', 'implemented', 'Human Resource Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.8.1', 'Asset Inventory', 'Assets identified and inventory maintained', 'in_progress', 'Asset Management', 'a0000000-0000-0000-0000-000000000002'),
  ('A.8.2', 'Information Classification', 'Information classified according to sensitivity', 'in_progress', 'Asset Management', 'a0000000-0000-0000-0000-000000000002'),
  ('A.9.1', 'Access Control Policy', 'Access control policy established and maintained', 'implemented', 'Access Control', 'a0000000-0000-0000-0000-000000000002'),
  ('A.9.2', 'User Access Management', 'User access provisioning and de-provisioning processes', 'implemented', 'Access Control', 'a0000000-0000-0000-0000-000000000002'),
  ('A.9.4', 'System Authentication', 'Secure log-on procedures and authentication mechanisms', 'implemented', 'Access Control', 'a0000000-0000-0000-0000-000000000002'),
  ('A.10.1', 'Cryptographic Controls', 'Policy on use of cryptographic controls for protection of information', 'in_progress', 'Cryptography', 'a0000000-0000-0000-0000-000000000002'),
  ('A.11.1', 'Physical Security Perimeter', 'Security perimeters defined and used to protect areas containing information', 'implemented', 'Physical Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.12.1', 'Operational Procedures', 'Operating procedures documented and available', 'implemented', 'Operations Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.12.3', 'Backup', 'Backup copies of information maintained and tested', 'implemented', 'Operations Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.12.6', 'Vulnerability Management', 'Technical vulnerabilities managed in a timely manner', 'implemented', 'Operations Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.13.1', 'Network Controls', 'Networks managed and controlled to protect information', 'implemented', 'Communications Security', 'a0000000-0000-0000-0000-000000000002'),
  ('A.14.2', 'Secure Development', 'Security applied throughout the development lifecycle', 'implemented', 'System Acquisition', 'a0000000-0000-0000-0000-000000000002'),
  ('A.16.1', 'Incident Management', 'Incident response responsibilities and procedures', 'implemented', 'Incident Management', 'a0000000-0000-0000-0000-000000000002'),
  ('A.17.1', 'Business Continuity', 'Business continuity management system implemented', 'in_progress', 'Business Continuity', 'a0000000-0000-0000-0000-000000000002'),
  ('A.18.1', 'Regulatory Compliance', 'Legal, statutory, and regulatory obligations identified and documented', 'implemented', 'Compliance', 'a0000000-0000-0000-0000-000000000002'),

  -- HIPAA controls
  ('164.308(a)(1)', 'Risk Analysis', 'Conduct accurate and thorough risk analysis of PHI', 'in_progress', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(2)', 'Risk Management', 'Implement security measures sufficient to reduce risks to reasonable levels', 'implemented', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(3)', 'Workforce Security', 'Authorize and supervise workforce members who work with PHI', 'implemented', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(4)', 'Information Access Management', 'Policies for authorizing access to PHI', 'implemented', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(5)', 'Security Awareness Training', 'Security awareness and training program for workforce', 'in_progress', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(6)', 'Incident Response', 'Policies and procedures for security incidents', 'implemented', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(7)', 'Contingency Plan', 'Establish and implement contingency plan for emergencies', 'implemented', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.308(a)(8)', 'Evaluation', 'Periodic technical and non-technical evaluation of security policies', 'in_progress', 'Administrative Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.312(a)(1)', 'Access Control', 'Implement technical policies for electronic PHI access', 'implemented', 'Technical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.312(b)', 'Audit Controls', 'Hardware, software, and procedural audit mechanisms', 'implemented', 'Technical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.312(c)(1)', 'Integrity Controls', 'Policies to protect e-PHI from improper alteration', 'implemented', 'Technical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.312(d)', 'Person Authentication', 'Procedures to verify person seeking access to e-PHI', 'implemented', 'Technical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.312(e)(1)', 'Transmission Security', 'Technical security measures to guard unauthorized access to e-PHI transmitted', 'implemented', 'Technical Safeguards', 'a0000000-0000-0000-0000-000000000003'),
  ('164.310(a)(1)', 'Facility Access Controls', 'Limit physical access to facilities containing e-PHI', 'implemented', 'Physical Safeguards', 'a0000000-0000-0000-0000-000000000003'),

  -- GDPR controls
  ('GDPR-ART-5', 'Data Protection Principles', 'Lawfulness, fairness, transparency, purpose limitation, data minimization, accuracy, storage limitation, integrity, accountability', 'in_progress', 'Principles', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-6', 'Lawfulness of Processing', 'Processing must be based on consent, contract, legal obligation, vital interests, public task, or legitimate interests', 'implemented', 'Lawful Processing', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-7', 'Consent Management', 'Demonstrate consent obtained, right to withdraw, clear and plain language', 'in_progress', 'Consent', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-15', 'Right of Access', 'Data subjects right to access their personal data and related information', 'in_progress', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-17', 'Right to Erasure', 'Right to obtain deletion of personal data under specified conditions', 'not_started', 'Data Subject Rights', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-32', 'Security of Processing', 'Appropriate technical and organizational measures to ensure security of personal data', 'implemented', 'Security', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-33', 'Breach Notification', 'Notify DPA within 72 hours of becoming aware of a breach', 'implemented', 'Breach Notification', 'a0000000-0000-0000-0000-000000000004'),
  ('GDPR-ART-35', 'Data Protection Impact Assessment', 'DPIA required for high-risk processing activities', 'not_started', 'Accountability', 'a0000000-0000-0000-0000-000000000004'),

  -- PCI DSS controls
  ('PCI-1', 'Firewall Configuration', 'Install and maintain network security controls', 'in_progress', 'Network Security', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-2', 'Secure Configurations', 'Apply secure configurations to all system components', 'implemented', 'Configuration', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-3', 'Protect Stored Cardholder Data', 'Protect stored cardholder data through encryption and truncation', 'in_progress', 'Data Protection', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-4', 'Encrypt Transmission', 'Encrypt cardholder data across open public networks', 'implemented', 'Encryption', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-5', 'Anti-Malware', 'Protect systems against malware and update anti-malware tools', 'implemented', 'Malware Protection', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-6', 'Secure Systems', 'Develop and maintain secure systems and applications', 'in_progress', 'System Security', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-7', 'Access by Business Need', 'Restrict access to cardholder data by business need to know', 'implemented', 'Access Control', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-8', 'User Identification', 'Assign unique IDs to all users with system access', 'implemented', 'Access Control', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-9', 'Physical Access', 'Restrict physical access to cardholder data', 'implemented', 'Physical Security', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-10', 'Logging & Monitoring', 'Track and monitor all access to network resources and cardholder data', 'implemented', 'Monitoring', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-11', 'Vulnerability Scanning', 'Regularly test security systems and processes', 'implemented', 'Testing', 'a0000000-0000-0000-0000-000000000005'),
  ('PCI-12', 'Information Security Policy', 'Maintain a policy that addresses information security', 'implemented', 'Policy', 'a0000000-0000-0000-0000-000000000005'),

  -- NIST CSF controls
  ('ID.AM', 'Asset Management', 'Physical devices, software, and data identified and managed', 'implemented', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('ID.RA', 'Risk Assessment', 'Risk assessment processes defined and executed', 'implemented', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('ID.RM', 'Risk Management Strategy', 'Risk management strategy established and priorities defined', 'in_progress', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('ID.SC', 'Supply Chain Risk', 'Supply chain risk management processes established', 'in_progress', 'Identify', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.AC', 'Access Control', 'Identities and credentials issued and managed for authorized access', 'implemented', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.DS', 'Data Security', 'Data-at-rest and data-in-transit protected', 'implemented', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.IP', 'Information Protection Processes', 'Baseline configuration, change management, and maintenance processes', 'implemented', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.MA', 'Maintenance', 'System maintenance and repairs performed and logged', 'implemented', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('PR.PT', 'Protective Technology', 'Technical security mechanisms implemented and maintained', 'implemented', 'Protect', 'a0000000-0000-0000-0000-000000000006'),
  ('DE.AE', 'Anomalies and Events', 'Anomalous activity detected and event data collected', 'implemented', 'Detect', 'a0000000-0000-0000-0000-000000000006'),
  ('DE.CM', 'Continuous Monitoring', 'Systems and assets monitored for security events', 'implemented', 'Detect', 'a0000000-0000-0000-0000-000000000006'),
  ('RS.RP', 'Response Planning', 'Incident response plan executed and maintained', 'implemented', 'Respond', 'a0000000-0000-0000-0000-000000000006'),
  ('RS.CO', 'Communications', 'Incident response communications coordinated with stakeholders', 'implemented', 'Respond', 'a0000000-0000-0000-0000-000000000006'),
  ('RC.RP', 'Recovery Planning', 'Recovery plan executed and communicated', 'in_progress', 'Recover', 'a0000000-0000-0000-0000-000000000006')
ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category, framework_id = EXCLUDED.framework_id;
