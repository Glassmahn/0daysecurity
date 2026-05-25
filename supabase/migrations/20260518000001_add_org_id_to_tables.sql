-- Migration 1A: Add org_id to all user-data tables
-- Default org UUID is '00000000-0000-0000-0000-000000000001'

DO $$
DECLARE
  default_org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN

-- 1. access_review_assignments
ALTER TABLE public.access_review_assignments ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.access_review_assignments SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.access_review_assignments ALTER COLUMN org_id SET NOT NULL;

-- 2. access_review_campaigns
ALTER TABLE public.access_review_campaigns ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.access_review_campaigns SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.access_review_campaigns ALTER COLUMN org_id SET NOT NULL;

-- 3. alerts
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.alerts SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.alerts ALTER COLUMN org_id SET NOT NULL;

-- 4. assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.assets SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.assets ALTER COLUMN org_id SET NOT NULL;

-- 5. audit_evidence_requests
ALTER TABLE public.audit_evidence_requests ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.audit_evidence_requests SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.audit_evidence_requests ALTER COLUMN org_id SET NOT NULL;

-- 6. audit_findings
ALTER TABLE public.audit_findings ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.audit_findings SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.audit_findings ALTER COLUMN org_id SET NOT NULL;

-- 7. audits
ALTER TABLE public.audits ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.audits SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.audits ALTER COLUMN org_id SET NOT NULL;

-- 8. audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.audit_logs SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.audit_logs ALTER COLUMN org_id SET NOT NULL;

-- 9. compliance_snapshots
ALTER TABLE public.compliance_snapshots ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.compliance_snapshots SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.compliance_snapshots ALTER COLUMN org_id SET NOT NULL;

-- 10. controls
ALTER TABLE public.controls ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.controls SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.controls ALTER COLUMN org_id SET NOT NULL;

-- 11. custom_field_definitions
ALTER TABLE public.custom_field_definitions ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.custom_field_definitions SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.custom_field_definitions ALTER COLUMN org_id SET NOT NULL;

-- 12. custom_field_values
ALTER TABLE public.custom_field_values ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.custom_field_values SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.custom_field_values ALTER COLUMN org_id SET NOT NULL;

-- 13. evidence
ALTER TABLE public.evidence ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.evidence SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.evidence ALTER COLUMN org_id SET NOT NULL;

-- 14. incidents
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.incidents SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.incidents ALTER COLUMN org_id SET NOT NULL;

-- 15. integrations
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.integrations SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.integrations ALTER COLUMN org_id SET NOT NULL;

-- 16. kb_article_versions
ALTER TABLE public.kb_article_versions ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.kb_article_versions SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.kb_article_versions ALTER COLUMN org_id SET NOT NULL;

-- 17. knowledge_base
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.knowledge_base SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.knowledge_base ALTER COLUMN org_id SET NOT NULL;

-- 18. notification_preferences
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.notification_preferences SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN org_id SET NOT NULL;

-- 19. organization_settings
ALTER TABLE public.organization_settings ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.organization_settings SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.organization_settings ALTER COLUMN org_id SET NOT NULL;

-- 20. personnel
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.personnel SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.personnel ALTER COLUMN org_id SET NOT NULL;

-- 21. policies
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.policies SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.policies ALTER COLUMN org_id SET NOT NULL;

-- 22. policy_acknowledgments
ALTER TABLE public.policy_acknowledgments ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.policy_acknowledgments SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.policy_acknowledgments ALTER COLUMN org_id SET NOT NULL;

-- 23. report_schedules
ALTER TABLE public.report_schedules ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.report_schedules SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.report_schedules ALTER COLUMN org_id SET NOT NULL;

-- 24. risks
ALTER TABLE public.risks ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.risks SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.risks ALTER COLUMN org_id SET NOT NULL;

-- 25. sso_configurations
ALTER TABLE public.sso_configurations ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.sso_configurations SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.sso_configurations ALTER COLUMN org_id SET NOT NULL;

-- 26. tests
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.tests SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.tests ALTER COLUMN org_id SET NOT NULL;

-- 27. training_assignments
ALTER TABLE public.training_assignments ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.training_assignments SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.training_assignments ALTER COLUMN org_id SET NOT NULL;

-- 28. training_quiz_attempts
ALTER TABLE public.training_quiz_attempts ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.training_quiz_attempts SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.training_quiz_attempts ALTER COLUMN org_id SET NOT NULL;

-- 29. trust_portal_shares
ALTER TABLE public.trust_portal_shares ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.trust_portal_shares SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.trust_portal_shares ALTER COLUMN org_id SET NOT NULL;

-- 30. user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.user_roles SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.user_roles ALTER COLUMN org_id SET NOT NULL;

-- 31. vendor_assessments
ALTER TABLE public.vendor_assessments ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.vendor_assessments SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.vendor_assessments ALTER COLUMN org_id SET NOT NULL;

-- 32. vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS org_id uuid;
UPDATE public.vendors SET org_id = default_org_id WHERE org_id IS NULL;
ALTER TABLE public.vendors ALTER COLUMN org_id SET NOT NULL;

END $$;

-- Set DEFAULT using literal UUID (cannot use variable in DEFAULT)
ALTER TABLE public.access_review_assignments ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.access_review_campaigns ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.alerts ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.assets ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.audit_evidence_requests ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.audit_findings ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.audits ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.audit_logs ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.compliance_snapshots ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.controls ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.custom_field_definitions ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.custom_field_values ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.evidence ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.incidents ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.integrations ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.kb_article_versions ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.knowledge_base ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.notification_preferences ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.organization_settings ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.personnel ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.policies ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.policy_acknowledgments ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.report_schedules ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.risks ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.sso_configurations ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.tests ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.training_assignments ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.training_quiz_attempts ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.trust_portal_shares ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.user_roles ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.vendor_assessments ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
ALTER TABLE public.vendors ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
