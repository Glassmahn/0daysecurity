-- Add indexes on org_id for all org-scoped tables to support RLS performance
-- Every RLS policy filters by org_id IN (SELECT org_id FROM user_roles WHERE user_id = auth.uid())
-- Without indexes, every query performs a sequential scan

CREATE INDEX IF NOT EXISTS idx_access_review_assignments_org_id ON public.access_review_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_access_review_campaigns_org_id ON public.access_review_campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org_id ON public.alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON public.api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_assets_org_id ON public.assets(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_requests_org_id ON public.audit_evidence_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_org_id ON public.audit_findings(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audits_org_id ON public.audits(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_snapshots_org_id ON public.compliance_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_controls_org_id ON public.controls(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_definitions_org_id ON public.custom_field_definitions(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_org_id ON public.custom_field_values(org_id);
CREATE INDEX IF NOT EXISTS idx_evidence_org_id ON public.evidence(org_id);
CREATE INDEX IF NOT EXISTS idx_frameworks_org_id ON public.frameworks(org_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_org_id ON public.incident_comments(org_id);
CREATE INDEX IF NOT EXISTS idx_incidents_org_id ON public.incidents(org_id);
CREATE INDEX IF NOT EXISTS idx_integrations_org_id ON public.integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_kb_article_versions_org_id ON public.kb_article_versions(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_org_id ON public.knowledge_base(org_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_org_id ON public.notification_preferences(org_id);
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id ON public.organization_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_personnel_org_id ON public.personnel(org_id);
CREATE INDEX IF NOT EXISTS idx_policies_org_id ON public.policies(org_id);
CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_org_id ON public.policy_acknowledgments(org_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_org_id ON public.report_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_risks_org_id ON public.risks(org_id);
CREATE INDEX IF NOT EXISTS idx_sso_configurations_org_id ON public.sso_configurations(org_id);
CREATE INDEX IF NOT EXISTS idx_subprocessors_org_id ON public.subprocessors(org_id);
CREATE INDEX IF NOT EXISTS idx_tests_org_id ON public.tests(org_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_org_id ON public.training_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_training_quiz_attempts_org_id ON public.training_quiz_attempts(org_id);
CREATE INDEX IF NOT EXISTS idx_trust_portal_shares_org_id ON public.trust_portal_shares(org_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_id ON public.user_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_vendor_assessments_org_id ON public.vendor_assessments(org_id);
CREATE INDEX IF NOT EXISTS idx_vendor_portal_tokens_org_id ON public.vendor_portal_tokens(org_id);
CREATE INDEX IF NOT EXISTS idx_vendors_org_id ON public.vendors(org_id);
