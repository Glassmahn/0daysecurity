-- Migration 1A fix: Replace current_org_id() RLS with direct subquery on user_roles
-- This works without needing to set session variables (which don't persist across HTTP requests in supabase-js)

-- Drop existing org-scoped policies
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname LIKE 'org_%'
    ORDER BY tablename, policyname
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  END LOOP;
END $$;

-- ============================================
-- Access Review Assignments
-- ============================================
CREATE POLICY "org_access_review_assignments_select" ON public.access_review_assignments
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_access_review_assignments_all" ON public.access_review_assignments
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Access Review Campaigns
-- ============================================
CREATE POLICY "org_access_review_campaigns_select" ON public.access_review_campaigns
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_access_review_campaigns_all" ON public.access_review_campaigns
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Alerts
-- ============================================
CREATE POLICY "org_alerts_select" ON public.alerts
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_alerts_all" ON public.alerts
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Assets
-- ============================================
CREATE POLICY "org_assets_select" ON public.assets
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_assets_all" ON public.assets
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Audit Evidence Requests
-- ============================================
CREATE POLICY "org_audit_evidence_requests_select" ON public.audit_evidence_requests
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_audit_evidence_requests_all" ON public.audit_evidence_requests
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Audit Findings
-- ============================================
CREATE POLICY "org_audit_findings_select" ON public.audit_findings
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_audit_findings_all" ON public.audit_findings
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Audits
-- ============================================
CREATE POLICY "org_audits_select" ON public.audits
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_audits_all" ON public.audits
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Audit Logs
-- ============================================
CREATE POLICY "org_audit_logs_select" ON public.audit_logs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND auth.uid() = user_id
  );

-- ============================================
-- Compliance Snapshots
-- ============================================
CREATE POLICY "org_compliance_snapshots_select" ON public.compliance_snapshots
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Controls
-- ============================================
CREATE POLICY "org_controls_select" ON public.controls
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_controls_all" ON public.controls
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Custom Field Definitions
-- ============================================
CREATE POLICY "org_custom_field_definitions_select" ON public.custom_field_definitions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_custom_field_definitions_all" ON public.custom_field_definitions
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Custom Field Values
-- ============================================
CREATE POLICY "org_custom_field_values_select" ON public.custom_field_values
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_custom_field_values_all" ON public.custom_field_values
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Evidence
-- ============================================
CREATE POLICY "org_evidence_select" ON public.evidence
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_evidence_all" ON public.evidence
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Incidents
-- ============================================
CREATE POLICY "org_incidents_select" ON public.incidents
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_incidents_all" ON public.incidents
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Integrations
-- ============================================
CREATE POLICY "org_integrations_select" ON public.integrations
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role) OR has_role(auth.uid(), 'viewer'::app_role))
  );
CREATE POLICY "org_integrations_all" ON public.integrations
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- KB Article Versions
-- ============================================
CREATE POLICY "org_kb_article_versions_select" ON public.kb_article_versions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_kb_article_versions_all" ON public.kb_article_versions
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Knowledge Base
-- ============================================
CREATE POLICY "org_knowledge_base_select" ON public.knowledge_base
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND ((status = 'published'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_knowledge_base_all" ON public.knowledge_base
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Notification Preferences
-- ============================================
CREATE POLICY "org_notification_preferences_select" ON public.notification_preferences
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );
CREATE POLICY "org_notification_preferences_all" ON public.notification_preferences
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- ============================================
-- Organization Settings
-- ============================================
CREATE POLICY "org_organization_settings_select" ON public.organization_settings
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_organization_settings_all" ON public.organization_settings
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Personnel
-- ============================================
CREATE POLICY "org_personnel_select" ON public.personnel
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_personnel_all" ON public.personnel
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Policies
-- ============================================
CREATE POLICY "org_policies_select" ON public.policies
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_policies_all" ON public.policies
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Policy Acknowledgments
-- ============================================
CREATE POLICY "org_policy_acknowledgments_select" ON public.policy_acknowledgments
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_policy_acknowledgments_all" ON public.policy_acknowledgments
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- ============================================
-- Report Schedules
-- ============================================
CREATE POLICY "org_report_schedules_select" ON public.report_schedules
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_report_schedules_all" ON public.report_schedules
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Risks
-- ============================================
CREATE POLICY "org_risks_select" ON public.risks
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_risks_all" ON public.risks
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- SSO Configurations
-- ============================================
CREATE POLICY "org_sso_configurations_select" ON public.sso_configurations
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_sso_configurations_all" ON public.sso_configurations
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Tests
-- ============================================
CREATE POLICY "org_tests_select" ON public.tests
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_tests_all" ON public.tests
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- Training Assignments
-- ============================================
CREATE POLICY "org_training_assignments_select" ON public.training_assignments
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  );
CREATE POLICY "org_training_assignments_all" ON public.training_assignments
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Training Quiz Attempts
-- ============================================
CREATE POLICY "org_training_quiz_attempts_select" ON public.training_quiz_attempts
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (auth.uid() IN (SELECT user_id FROM public.training_assignments WHERE id = assignment_id) OR has_role(auth.uid(), 'admin'::app_role))
  );

-- ============================================
-- Trust Portal Shares
-- ============================================
CREATE POLICY "org_trust_portal_shares_select" ON public.trust_portal_shares
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_trust_portal_shares_all" ON public.trust_portal_shares
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- User Roles
-- ============================================
CREATE POLICY "org_user_roles_select" ON public.user_roles
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
  );
CREATE POLICY "org_user_roles_all" ON public.user_roles
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Vendor Assessments
-- ============================================
CREATE POLICY "org_vendor_assessments_select" ON public.vendor_assessments
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_vendor_assessments_all" ON public.vendor_assessments
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- Vendors
-- ============================================
CREATE POLICY "org_vendors_select" ON public.vendors
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_vendors_all" ON public.vendors
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
