-- Seed 5 training courses with quiz questions
-- Idempotent: uses ON CONFLICT to avoid duplicates

-- Courses
INSERT INTO public.training_courses (id, title, description, category, duration_minutes, status)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Security Awareness Fundamentals', 'Essential security awareness covering phishing, password hygiene, and data classification for all employees.', 'Security Awareness', 25, 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'HIPAA Privacy & Security', 'HIPAA compliance training covering PHI handling, breach notification, and administrative/physical/technical safeguards.', 'Compliance', 30, 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'SOC 2 Orientation', 'Overview of SOC 2 Trust Services Criteria, evidence collection requirements, and the audit process.', 'Compliance', 20, 'active'),
  ('c0000000-0000-0000-0000-000000000004', 'ISO 27001 Awareness', 'Introduction to ISO 27001 ISMS, Annex A controls, internal audit program, and continual improvement.', 'Compliance', 20, 'active'),
  ('c0000000-0000-0000-0000-000000000005', 'GDPR Data Subject Rights', 'Training on GDPR data subject rights including access, erasure, portability, and DSAR workflows.', 'Privacy', 15, 'active')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, category = EXCLUDED.category, duration_minutes = EXCLUDED.duration_minutes;

-- Quiz: Security Awareness Fundamentals
INSERT INTO public.training_quiz_questions (course_id, question, options, correct_index, explanation)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'What is the most common entry point for a phishing attack?',
   '["A) USB drives left in the parking lot", "B) Email with a malicious link or attachment", "C) Social media direct messages", "D) Phone calls from unknown numbers"]', 1,
   'Email-based phishing is the most common attack vector. Always verify the sender and avoid clicking suspicious links.'),
  ('c0000000-0000-0000-0000-000000000001', 'Which of the following is a strong password?',
   '["A) password123", "B) MyD0g$Fido!", "C) abcdefgh", "D) 1234567890"]', 1,
   'A strong password uses a mix of uppercase, lowercase, numbers, and special characters.'),
  ('c0000000-0000-0000-0000-000000000001', 'What should you do if you receive a suspicious email requesting sensitive information?',
   '["A) Reply asking for verification", "B) Click the link to check if it is legitimate", "C) Report it to the security team immediately", "D) Forward it to your personal email"]', 2,
   'Always report suspicious emails to your security team. Do not engage with potential phishing attempts.'),
  ('c0000000-0000-0000-0000-000000000001', 'What is data classification?',
   '["A) Organizing files by date", "B) Labeling data by sensitivity level", "C) Encrypting all files", "D) Backing up data daily"]', 1,
   'Data classification helps ensure appropriate handling based on sensitivity (public, internal, confidential, restricted).'),
  ('c0000000-0000-0000-0000-000000000001', 'When should you lock your workstation?',
   '["A) Only at the end of the day", "B) Whenever you step away, even briefly", "C) Never, if you work in a secure office", "D) Only when working with sensitive data"]', 1,
   'Always lock your workstation when stepping away to prevent unauthorized access.'),

  -- Quiz: HIPAA Privacy & Security
  ('c0000000-0000-0000-0000-000000000002', 'What does PHI stand for?',
   '["A) Personal Health Identifier", "B) Protected Health Information", "C) Private Healthcare ID", "D) Public Health Index"]', 1,
   'PHI stands for Protected Health Information — any health information that can identify an individual.'),
  ('c0000000-0000-0000-0000-000000000002', 'What is the maximum time allowed for breach notification under HIPAA?',
   '["A) 24 hours", "B) 72 hours", "C) 60 days", "D) 30 days"]', 2,
   'HIPAA requires breach notification to affected individuals within 60 days and to HHS within 60 days for large breaches.'),
  ('c0000000-0000-0000-0000-000000000002', 'Which of the following is a HIPAA Administrative Safeguard?',
   '["A) Encryption of data at rest", "B) Risk analysis and risk management", "C) Facility access controls", "D) Audit logging"]', 1,
   'Risk analysis and risk management are administrative safeguards. Encryption is a technical safeguard.'),
  ('c0000000-0000-0000-0000-000000000002', 'What type of safeguard is encryption classified as under HIPAA?',
   '["A) Administrative", "B) Physical", "C) Technical", "D) Organizational"]', 2,
   'Encryption falls under Technical Safeguards (164.312) which includes access control, audit controls, integrity, and transmission security.'),

  -- Quiz: SOC 2 Orientation
  ('c0000000-0000-0000-0000-000000000003', 'How many Trust Services Criteria categories are there in SOC 2?',
   '["A) 3", "B) 5", "C) 7", "D) 10"]', 1,
   'SOC 2 has 5 TSC categories: Security, Availability, Processing Integrity, Confidentiality, and Privacy.'),
  ('c0000000-0000-0000-0000-000000000003', 'What is a point-in-time SOC 2 report called?',
   '["A) Type I", "B) Type II", "C) Type III", "D) Type IV"]', 0,
   'Type I reports assess design effectiveness at a specific point in time. Type II reports assess operating effectiveness over a period.'),
  ('c0000000-0000-0000-0000-000000000003', 'Which CC category covers logical and physical access controls?',
   '["A) CC-5 Control Activities", "B) CC-6 Logical and Physical Access", "C) CC-7 System Operations", "D) CC-8 Change Management"]', 1,
   'CC-6 (Logical and Physical Access) covers access restrictions to systems and data.'),
  ('c0000000-0000-0000-0000-000000000003', 'What is the role of evidence in a SOC 2 audit?',
   '["A) Optional supporting documentation", "B) Proof that controls are operating effectively", "C) Only required for Type II reports", "D) Submitted after the audit is complete"]', 1,
   'Evidence demonstrates that controls are designed and operating effectively throughout the audit period.'),

  -- Quiz: ISO 27001 Awareness
  ('c0000000-0000-0000-0000-000000000004', 'What does ISMS stand for?',
   '["A) Information Security Management System", "B) Integrated Security Monitoring Service", "C) Information Systems Monitoring Standard", "D) Internal Security Management Standard"]', 0,
   'ISMS stands for Information Security Management System — the systematic approach to managing sensitive information.'),
  ('c0000000-0000-0000-0000-000000000004', 'Which clause in ISO 27001 requires organizations to determine external and internal issues?',
   '["A) Clause 4 — Context of the Organization", "B) Clause 6 — Planning", "C) Clause 7 — Support", "D) Clause 8 — Operation"]', 0,
   'Clause 4 requires understanding the organizational context, including interested parties and their requirements.'),
  ('c0000000-0000-0000-0000-000000000004', 'What is the PDCA cycle in ISO 27001?',
   '["A) Plan-Deploy-Check-Act", "B) Plan-Do-Check-Act", "C) Prepare-Do-Check-Assess", "D) Plan-Do-Control-Audit"]', 1,
   'The PDCA (Plan-Do-Check-Act) cycle is the continuous improvement framework underlying ISMS.'),
  ('c0000000-0000-0000-0000-000000000004', 'How often should internal audits be conducted per ISO 27001?',
   '["A) Annually", "B) Semi-annually", "C) Monthly", "D) At planned intervals"]', 3,
   'ISO 27001 requires internal audits at planned intervals. The frequency depends on risk and organizational needs.'),

  -- Quiz: GDPR Data Subject Rights
  ('c0000000-0000-0000-0000-000000000005', 'How many days does a controller have to respond to a Data Subject Access Request (DSAR)?',
   '["A) 14 days", "B) 30 days", "C) 45 days", "D) 60 days"]', 1,
   'GDPR Article 12 requires response within one month (30 days), extendable by two months for complex requests.'),
  ('c0000000-0000-0000-0000-000000000005', 'What is the Right to Erasure also known as?',
   '["A) Right to Access", "B) Right to be Forgotten", "C) Right to Portability", "D) Right to Object"]', 1,
   'The Right to Erasure (Article 17) is commonly known as the Right to be Forgotten.'),
  ('c0000000-0000-0000-0000-000000000005', 'Under what condition can data processing be based on legitimate interest?',
   '["A) Only with explicit consent", "B) When the processing is necessary and does not override data subject rights", "C) Never — legitimate interest was removed in 2018", "D) Only for marketing purposes"]', 1,
   'Legitimate interest (Article 6(1)(f)) requires balancing the controllers interests against data subject rights and freedoms.'),
  ('c0000000-0000-0000-0000-000000000005', 'When is a Data Protection Impact Assessment (DPIA) required?',
   '["A) For all processing activities", "B) When processing is likely to result in high risk to individuals", "C) Only for health data processing", "D) When requested by the data subject"]', 1,
    'DPIAs are required when processing is likely to result in high risk to natural persons'' rights and freedoms (Article 35).')
ON CONFLICT DO NOTHING;
