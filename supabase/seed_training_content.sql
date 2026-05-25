-- Seed course content for pre-loaded training courses
-- This adds structured sections and slides to the 5 courses seeded earlier.

UPDATE public.training_courses SET content = '{
  "sections": [
    {
      "title": "Why Security Awareness Matters",
      "content": "<p>Security is everyone''s responsibility. This course covers the fundamentals of keeping your organization safe.</p>",
      "slides": [
        {"type": "text", "body": "<h2>The Threat Landscape</h2><p>Cyber attacks are increasing in frequency and sophistication. In 2025, 90% of breaches involved human error.</p>"},
        {"type": "text", "body": "<h2>Your Role</h2><p>As an employee, you are the first line of defense. Recognizing threats and reporting them quickly is critical.</p>"},
        {"type": "quiz_question", "question_id": ""}
      ]
    },
    {
      "title": "Phishing Awareness",
      "content": "<p>Learn to identify and report phishing attempts.</p>",
      "slides": [
        {"type": "text", "body": "<h2>What is Phishing?</h2><p>Phishing is a social engineering attack where criminals impersonate legitimate organizations to steal sensitive information.</p>"},
        {"type": "image", "url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600"},
        {"type": "text", "body": "<h2>Red Flags</h2><ul><li>Urgent or threatening language</li><li>Suspicious sender addresses</li><li>Unexpected attachments or links</li><li>Requests for sensitive information</li></ul>"}
      ]
    },
    {
      "title": "Password Hygiene",
      "slides": [
        {"type": "text", "body": "<h2>Strong Passwords</h2><p>Use a unique password for every account. A password manager makes this easy.</p>"},
        {"type": "text", "body": "<h2>MFA</h2><p>Multi-factor authentication adds a second layer of security. Always enable it when available.</p>"}
      ]
    },
    {
      "title": "Data Classification",
      "slides": [
        {"type": "text", "body": "<h2>Know Your Data</h2><p>Understand the classification levels: Public, Internal, Confidential, and Restricted. Handle data according to its classification.</p>"}
      ]
    }
  ]
}'::jsonb WHERE title = 'Security Awareness Fundamentals';

UPDATE public.training_courses SET content = '{
  "sections": [
    {
      "title": "HIPAA Overview",
      "content": "<p>Understanding the Health Insurance Portability and Accountability Act.</p>",
      "slides": [
        {"type": "text", "body": "<h2>What is HIPAA?</h2><p>HIPAA sets the standard for protecting sensitive patient data. Any organization handling PHI must comply.</p>"},
        {"type": "text", "body": "<h2>PHI Definition</h2><p>Protected Health Information includes any health information that can identify an individual.</p>"}
      ]
    },
    {
      "title": "Privacy Rule",
      "slides": [
        {"type": "text", "body": "<h2>The Privacy Rule</h2><p>Governs the use and disclosure of PHI. Patients have rights to access their health information.</p>"}
      ]
    },
    {
      "title": "Security Rule",
      "slides": [
        {"type": "text", "body": "<h2>The Security Rule</h2><p>Requires administrative, physical, and technical safeguards for electronic PHI (ePHI).</p>"},
        {"type": "text", "body": "<h2>Breach Notification</h2><p>Breaches affecting 500+ individuals must be reported to HHS within 60 days.</p>"}
      ]
    }
  ]
}'::jsonb WHERE title = 'HIPAA Privacy & Security';

UPDATE public.training_courses SET content = '{
  "sections": [
    {
      "title": "What is SOC 2?",
      "slides": [
        {"type": "text", "body": "<h2>SOC 2 Overview</h2><p>System and Organization Controls (SOC) 2 is a framework for managing customer data based on five Trust Services Criteria.</p>"}
      ]
    },
    {
      "title": "Trust Services Criteria",
      "slides": [
        {"type": "text", "body": "<h2>Security</h2><p>The system is protected against unauthorized access.</p>"},
        {"type": "text", "body": "<h2>Availability</h2><p>The system is available for operation and use as committed.</p>"},
        {"type": "text", "body": "<h2>Processing Integrity</h2><p>System processing is complete, valid, accurate, timely, and authorized.</p>"},
        {"type": "text", "body": "<h2>Confidentiality</h2><p>Information designated as confidential is protected.</p>"},
        {"type": "text", "body": "<h2>Privacy</h2><p>Personal information is collected, used, retained, and disclosed appropriately.</p>"}
      ]
    },
    {
      "title": "Evidence Collection",
      "slides": [
        {"type": "text", "body": "<h2>Your Role</h2><p>Evidence collection is critical for SOC 2 audits. Maintain records of security controls, access reviews, and incident response.</p>"}
      ]
    }
  ]
}'::jsonb WHERE title = 'SOC 2 Orientation';

UPDATE public.training_courses SET content = '{
  "sections": [
    {
      "title": "ISO 27001 Introduction",
      "slides": [
        {"type": "text", "body": "<h2>What is ISO 27001?</h2><p>ISO 27001 is the international standard for Information Security Management Systems (ISMS).</p>"},
        {"type": "text", "body": "<h2>The PDCA Cycle</h2><p>Plan-Do-Check-Act is the continuous improvement model underpinning ISO 27001.</p>"}
      ]
    },
    {
      "title": "Annex A Controls",
      "slides": [
        {"type": "text", "body": "<h2>Annex A</h2><p>Contains 93 controls across 4 domains: Organizational, People, Physical, and Technological.</p>"},
        {"type": "text", "body": "<h2>Statement of Applicability</h2><p>Documents which controls are applicable and how they are implemented.</p>"}
      ]
    },
    {
      "title": "Internal Audit",
      "slides": [
        {"type": "text", "body": "<h2>Internal Audits</h2><p>Regular internal audits are required to maintain certification. Auditors review controls, evidence, and processes.</p>"}
      ]
    }
  ]
}'::jsonb WHERE title = 'ISO 27001 Awareness';

UPDATE public.training_courses SET content = '{
  "sections": [
    {
      "title": "GDPR Overview",
      "slides": [
        {"type": "text", "body": "<h2>What is GDPR?</h2><p>The General Data Protection Regulation governs how organizations handle personal data of EU citizens.</p>"},
        {"type": "text", "body": "<h2>Key Principles</h2><p>Lawfulness, fairness, transparency, purpose limitation, data minimization, accuracy, storage limitation, integrity and confidentiality.</p>"}
      ]
    },
    {
      "title": "Data Subject Rights",
      "slides": [
        {"type": "text", "body": "<h2>DSRs</h2><p>Individuals have rights including: Right to Access, Rectification, Erasure, Portability, and to Object.</p>"},
        {"type": "text", "body": "<h2>DSR Workflows</h2><p>Your organization must respond to DSRs within 30 days. Use the DSR workflow in ZeroDay to track and manage requests.</p>"}
      ]
    },
    {
      "title": "Consent Management",
      "slides": [
        {"type": "text", "body": "<h2>Consent</h2><p>Consent must be freely given, specific, informed, and unambiguous. Record and manage consent in your CRM or consent platform.</p>"}
      ]
    }
  ]
}'::jsonb WHERE title = 'GDPR Data Subject Rights';
