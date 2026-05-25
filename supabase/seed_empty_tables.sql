-- Seed data for tables that were empty after migration
-- Admin user ID: bfcbebb1-7c5b-4841-94ea-c290f4bc8f95

-- ==========================================
-- Policy Acknowledgments
-- ==========================================
INSERT INTO public.policy_acknowledgments (policy_id, user_id, version_acknowledged, status)
SELECT id, 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95', '1.0', 'acknowledged'
FROM public.policies
WHERE NOT EXISTS (SELECT 1 FROM public.policy_acknowledgments WHERE policy_id = policies.id AND user_id = 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95');

-- ==========================================
-- Vendor Assessments
-- ==========================================
INSERT INTO public.vendor_assessments (vendor_id, status, score, responses, sent_at, responded_at, due_at, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'completed', 92, '{"q1": "yes", "q2": "yes", "q3": "partial", "q4": "yes"}'::jsonb, now() - interval '30 days', now() - interval '5 days', now() + interval '60 days', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95'),
  ('00000000-0000-0000-0000-000000000002', 'in_progress', 78, '{"q1": "yes", "q2": "partial"}'::jsonb, now() - interval '14 days', null, now() + interval '30 days', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95'),
  ('00000000-0000-0000-0000-000000000005', 'draft', null, '{}'::jsonb, null, null, now() + interval '90 days', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95')
ON CONFLICT DO NOTHING;

-- ==========================================
-- Access Review Campaigns
-- ==========================================
INSERT INTO public.access_review_campaigns (name, status, due_date, notes, created_by)
VALUES
  ('Q2 2026 Access Review', 'in_progress', '2026-06-30', 'Quarterly review of all production system access', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95'),
  ('Quarterly IT Access Review', 'completed', '2026-03-31', 'Q1 2026 review - all access verified', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95')
ON CONFLICT DO NOTHING;

-- ==========================================
-- Access Review Assignments
-- ==========================================
INSERT INTO public.access_review_assignments (campaign_id, reviewer_id, reviewee_id, status, notes)
SELECT
  c.id,
  'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95',
  p.id,
  CASE p.name
    WHEN 'Alex Chen' THEN 'approved'
    WHEN 'Sarah Johnson' THEN 'approved'
    WHEN 'Mike Torres' THEN 'approved'
    WHEN 'Lisa Park' THEN 'changes_requested'
    WHEN 'James Wilson' THEN 'pending'
  END,
  CASE p.name
    WHEN 'Alex Chen' THEN 'All access verified, no changes needed'
    WHEN 'Sarah Johnson' THEN 'Access appropriate for role'
    WHEN 'Mike Torres' THEN 'Confirmed - standard developer access'
    WHEN 'Lisa Park' THEN 'Please remove access to legacy HR system'
    WHEN 'James Wilson' THEN NULL
  END
FROM public.access_review_campaigns c
CROSS JOIN public.personnel p
WHERE c.status = 'in_progress'
  AND NOT EXISTS (SELECT 1 FROM public.access_review_assignments WHERE campaign_id = c.id AND reviewee_id = p.id);

-- Also add completed assignments for the completed campaign
INSERT INTO public.access_review_assignments (campaign_id, reviewer_id, reviewee_id, status, notes, completed_at)
SELECT
  c.id,
  'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95',
  p.id,
  'approved',
  'Access verified in Q1 review',
  now() - interval '45 days'
FROM public.access_review_campaigns c
CROSS JOIN public.personnel p
WHERE c.status = 'completed'
  AND NOT EXISTS (SELECT 1 FROM public.access_review_assignments WHERE campaign_id = c.id AND reviewee_id = p.id);

-- ==========================================
-- Audits
-- ==========================================
INSERT INTO public.audits (title, framework, status, scope, start_date, end_date, lead_auditor_id, notes)
VALUES
  ('SOC 2 Type II Internal Audit', 'SOC 2', 'in_progress', 'All trust services criteria (security, availability, processing integrity, confidentiality, privacy) for production systems', '2026-06-01', '2026-08-15', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95', 'Internal readiness assessment ahead of external auditor engagement'),
  ('ISO 27001 Surveillance Audit', 'ISO 27001', 'draft', 'ISMS scope: corporate systems, engineering, and cloud infrastructure', '2026-09-01', '2026-10-15', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95', 'Annual surveillance audit preparation'),
  ('HIPAA Risk Assessment', 'HIPAA', 'completed', 'Covered entity assessment for PHI handling across all business units', '2026-01-10', '2026-02-20', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95', 'Annual HIPAA security risk analysis completed. All findings addressed.')
ON CONFLICT DO NOTHING;

-- ==========================================
-- Audit Findings
-- ==========================================
INSERT INTO public.audit_findings (audit_id, control_id, title, severity, status, description, remediation)
SELECT
  a.id,
  c.id,
  f.title,
  f.severity,
  f.status,
  f.description,
  f.remediation
FROM (
  VALUES
    ('SOC 2 Type II Internal Audit', 1, 'Incomplete vulnerability scanning coverage', 'high', 'open', 'Two production subnets are not included in the weekly vulnerability scan scope.', 'Extend scan scope to cover all production subnets and verify coverage in the scanning tool configuration.'),
    ('SOC 2 Type II Internal Audit', 2, 'MFA not enforced on legacy admin console', 'critical', 'open', 'The legacy admin console at admin-legacy.internal does not enforce MFA for administrative access.', 'Upgrade the legacy console or implement a reverse proxy with MFA enforcement in front of it.'),
    ('SOC 2 Type II Internal Audit', 3, 'Access review documentation incomplete', 'medium', 'open', 'Q1 2026 access review for the finance team lacks sign-off documentation.', 'Complete the pending access review and obtain manager sign-off.'),
    ('ISO 27001 Surveillance Audit', 4, 'Risk assessment not updated for new cloud region', 'high', 'open', 'The risk assessment has not been updated to reflect the new EU cloud region deployment.', 'Conduct a risk assessment for the new EU region, document findings, and update the risk register.'),
    ('ISO 27001 Surveillance Audit', 5, 'Supplier security reviews overdue', 'medium', 'open', 'Three vendors have not undergone their annual security review.', 'Schedule and complete security reviews for the overdue vendors within 30 days.'),
    ('HIPAA Risk Assessment', 6, 'PHI access logs not reviewed monthly', 'medium', 'resolved', 'Access logs for the EHR system were not reviewed for the month of December 2025.', 'Implement automated log review workflow and verify December logs retrospectively.'),
    ('HIPAA Risk Assessment', 7, 'Encryption key rotation policy non-compliant', 'low', 'resolved', 'Encryption keys for PHI databases are rotated annually instead of the required 6-month cadence.', 'Updated key rotation policy and completed key rotation for all PHI databases.')
) AS f(audit_title, sort_order, title, severity, status, description, remediation)
JOIN public.audits a ON a.title = f.audit_title
LEFT JOIN public.controls c ON c.code = 'CC-' || f.sort_order
WHERE NOT EXISTS (SELECT 1 FROM public.audit_findings WHERE title = f.title);

-- ==========================================
-- Audit Evidence Requests
-- ==========================================
INSERT INTO public.audit_evidence_requests (audit_id, finding_id, title, description, requested_by_id, assigned_to_id, status, due_date)
SELECT
  a.id,
  af.id,
  er.title,
  er.description,
  'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95',
  'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95',
  er.status,
  er.due_date
FROM (
  VALUES
    ('SOC 2 Type II Internal Audit', 'Incomplete vulnerability scanning coverage', 'Vulnerability Scan Report', 'Provide the most recent vulnerability scan report showing all production subnets', 'pending', '2026-07-01'::date),
    ('SOC 2 Type II Internal Audit', 'Incomplete vulnerability scanning coverage', 'Scan Configuration Export', 'Export the scanning tool configuration showing the scope settings', 'pending', '2026-07-01'::date),
    ('SOC 2 Type II Internal Audit', 'MFA not enforced on legacy admin console', 'MFA Enforcement Evidence', 'Provide screenshots or configuration showing current auth settings for admin-legacy console', 'submitted', '2026-06-15'::date),
    ('SOC 2 Type II Internal Audit', 'Access review documentation incomplete', 'Access Review Sign-off', 'Provide completed access review forms with manager signatures', 'approved', '2026-06-10'::date),
    ('HIPAA Risk Assessment', 'Encryption key rotation policy non-compliant', 'Key Rotation Certificate', 'Provide the updated key rotation policy and certificate of completion', 'approved', '2026-03-01'::date)
) AS er(audit_title, finding_title, title, description, status, due_date)
JOIN public.audits a ON a.title = er.audit_title
JOIN public.audit_findings af ON af.title = er.finding_title AND af.audit_id = a.id
WHERE NOT EXISTS (SELECT 1 FROM public.audit_evidence_requests WHERE title = er.title AND audit_id = a.id);

-- ==========================================
-- Report Schedules
-- ==========================================
INSERT INTO public.report_schedules (name, report_type, format, schedule, recipients, filters, status, created_by)
VALUES
  ('Weekly Compliance Summary', 'compliance_summary', 'pdf', 'weekly', ARRAY['admin@zeroday.test'], '{"status": "all", "frameworks": ["SOC2", "HIPAA"]}', 'active', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95'),
  ('Monthly Risk Register Export', 'risk_register', 'csv', 'monthly', ARRAY['admin@zeroday.test', 'risk-owner@zeroday.test'], '{"status": ["open", "mitigated"]}', 'active', 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95')
ON CONFLICT DO NOTHING;

-- ==========================================
-- SSO / SAML Configurations
-- ==========================================
INSERT INTO public.sso_configurations (provider, entity_id, sso_url, certificate, status)
VALUES
  ('saml', 'https://zeroday.test/saml/metadata', 'https://okta.com/sso/saml/zeroday', '-----BEGIN CERTIFICATE-----\nMIID...demo-cert...\n-----END CERTIFICATE-----', 'inactive')
ON CONFLICT DO NOTHING;

-- ==========================================
-- Custom Field Definitions
-- ==========================================
INSERT INTO public.custom_field_definitions (entity_type, field_name, field_type, options, required, sort_order)
VALUES
  ('assets', 'Data Classification', 'select', '["Public", "Internal", "Confidential", "Restricted"]'::jsonb, true, 1),
  ('vendors', 'Business Unit', 'select', '["Engineering", "Finance", "HR", "Marketing", "Operations"]'::jsonb, false, 1),
  ('incidents', 'Compliance Impact', 'boolean', '[]'::jsonb, true, 1),
  ('risks', 'Risk Category Detail', 'text', '[]'::jsonb, false, 1)
ON CONFLICT (entity_type, field_name) DO NOTHING;

-- ==========================================
-- Custom Field Values
-- ==========================================
INSERT INTO public.custom_field_values (field_definition_id, entity_id, value)
SELECT
  cfd.id,
  a.id,
  CASE cfd.field_name
    WHEN 'Data Classification' THEN 'Confidential'
  END
FROM public.custom_field_definitions cfd
CROSS JOIN public.assets a
WHERE cfd.entity_type = 'assets'
  AND cfd.field_name = 'Data Classification'
  AND NOT EXISTS (SELECT 1 FROM public.custom_field_values WHERE field_definition_id = cfd.id AND entity_id = a.id);

-- ==========================================
-- Trust Portal Shares
-- ==========================================
INSERT INTO public.trust_portal_shares (name, token, frameworks, status, expires_at, include_reports, include_evidence, created_by)
VALUES
  ('SOC 2 Report for Acme Corp', 'sh_tkn_' || encode(gen_random_bytes(16), 'hex'), ARRAY['SOC2'], 'active', now() + interval '90 days', true, true, 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95'),
  ('ISO 27001 Due Diligence Package', 'sh_tkn_' || encode(gen_random_bytes(16), 'hex'), ARRAY['ISO27001'], 'active', now() + interval '180 days', true, false, 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95')
ON CONFLICT DO NOTHING;

-- ==========================================
-- Training Assignments
-- ==========================================
INSERT INTO public.training_assignments (course_id, user_id, status, completed_at, score)
SELECT
  tc.id,
  'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95',
  CASE tc.title
    WHEN 'Security Awareness Fundamentals' THEN 'completed'
    WHEN 'HIPAA Privacy & Security' THEN 'completed'
    WHEN 'SOC 2 Orientation' THEN 'completed'
    WHEN 'ISO 27001 Awareness' THEN 'in_progress'
    WHEN 'GDPR Data Subject Rights' THEN 'assigned'
  END,
  CASE tc.title
    WHEN 'Security Awareness Fundamentals' THEN now() - interval '60 days'
    WHEN 'HIPAA Privacy & Security' THEN now() - interval '30 days'
    WHEN 'SOC 2 Orientation' THEN now() - interval '15 days'
    ELSE NULL
  END,
  CASE tc.title
    WHEN 'Security Awareness Fundamentals' THEN 95
    WHEN 'HIPAA Privacy & Security' THEN 88
    WHEN 'SOC 2 Orientation' THEN 92
    ELSE NULL
  END
FROM public.training_courses tc
WHERE NOT EXISTS (SELECT 1 FROM public.training_assignments WHERE course_id = tc.id AND user_id = 'bfcbebb1-7c5b-4841-94ea-c290f4bc8f95');
