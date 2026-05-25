-- Migration 1A: Rewrite all RLS policies to filter by org_id
-- Uses current_org_id() function defined in migration 20260518000000

-- Helper: drop all existing policies on a table
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  END LOOP;
END $$;

-- ============================================
-- access_review_assignments
-- ============================================
CREATE POLICY "org_access_review_assignments_select" ON public.access_review_assignments
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_access_review_assignments_all" ON public.access_review_assignments
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- access_review_campaigns
-- ============================================
CREATE POLICY "org_access_review_campaigns_select" ON public.access_review_campaigns
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_access_review_campaigns_all" ON public.access_review_campaigns
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- alerts
-- ============================================
CREATE POLICY "org_alerts_select" ON public.alerts
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_alerts_all" ON public.alerts
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- assets
-- ============================================
CREATE POLICY "org_assets_select" ON public.assets
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_assets_all" ON public.assets
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- audit_evidence_requests
-- ============================================
CREATE POLICY "org_audit_evidence_requests_select" ON public.audit_evidence_requests
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_audit_evidence_requests_all" ON public.audit_evidence_requests
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- audit_findings
-- ============================================
CREATE POLICY "org_audit_findings_select" ON public.audit_findings
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_audit_findings_all" ON public.audit_findings
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- audits
-- ============================================
CREATE POLICY "org_audits_select" ON public.audits
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_audits_all" ON public.audits
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- audit_logs
-- ============================================
CREATE POLICY "org_audit_logs_select" ON public.audit_logs
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_audit_logs_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (
    org_id = current_org_id()
    AND auth.uid() = user_id
  );

-- ============================================
-- compliance_snapshots
-- ============================================
CREATE POLICY "org_compliance_snapshots_select" ON public.compliance_snapshots
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- controls
-- ============================================
CREATE POLICY "org_controls_select" ON public.controls
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_controls_all" ON public.controls
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- custom_field_definitions
-- ============================================
CREATE POLICY "org_custom_field_definitions_select" ON public.custom_field_definitions
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_custom_field_definitions_all" ON public.custom_field_definitions
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- custom_field_values
-- ============================================
CREATE POLICY "org_custom_field_values_select" ON public.custom_field_values
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_custom_field_values_all" ON public.custom_field_values
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- evidence
-- ============================================
CREATE POLICY "org_evidence_select" ON public.evidence
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_evidence_all" ON public.evidence
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- frameworks (global catalog, no org_id - RLS stays role-based only)
-- ============================================
CREATE POLICY "frameworks_select" ON public.frameworks
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));
CREATE POLICY "frameworks_all" ON public.frameworks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- incidents
-- ============================================
CREATE POLICY "org_incidents_select" ON public.incidents
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_incidents_all" ON public.incidents
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- integrations
-- ============================================
CREATE POLICY "org_integrations_select" ON public.integrations
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role) OR has_role(auth.uid(), 'viewer'::app_role))
  );
CREATE POLICY "org_integrations_all" ON public.integrations
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- kb_article_versions
-- ============================================
CREATE POLICY "org_kb_article_versions_select" ON public.kb_article_versions
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_kb_article_versions_all" ON public.kb_article_versions
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- knowledge_base
-- ============================================
CREATE POLICY "org_knowledge_base_select" ON public.knowledge_base
  FOR SELECT USING (
    org_id = current_org_id()
    AND ((status = 'published'::text) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_knowledge_base_all" ON public.knowledge_base
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- notification_preferences
-- ============================================
CREATE POLICY "org_notification_preferences_select" ON public.notification_preferences
  FOR SELECT USING (
    org_id = current_org_id()
    AND user_id = auth.uid()
  );
CREATE POLICY "org_notification_preferences_all" ON public.notification_preferences
  FOR ALL USING (
    org_id = current_org_id()
    AND user_id = auth.uid()
  );

-- ============================================
-- organization_settings
-- ============================================
CREATE POLICY "org_organization_settings_select" ON public.organization_settings
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_organization_settings_all" ON public.organization_settings
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- personnel
-- ============================================
CREATE POLICY "org_personnel_select" ON public.personnel
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_personnel_all" ON public.personnel
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- policies
-- ============================================
CREATE POLICY "org_policies_select" ON public.policies
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_policies_all" ON public.policies
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- policy_acknowledgments
-- ============================================
CREATE POLICY "org_policy_acknowledgments_select" ON public.policy_acknowledgments
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_policy_acknowledgments_all" ON public.policy_acknowledgments
  FOR ALL USING (
    org_id = current_org_id()
    AND user_id = auth.uid()
  );

-- ============================================
-- profiles (no org_id - user-level table)
-- ============================================
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- report_schedules
-- ============================================
CREATE POLICY "org_report_schedules_select" ON public.report_schedules
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_report_schedules_all" ON public.report_schedules
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- risks
-- ============================================
CREATE POLICY "org_risks_select" ON public.risks
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_risks_all" ON public.risks
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- sso_configurations
-- ============================================
CREATE POLICY "org_sso_configurations_select" ON public.sso_configurations
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_sso_configurations_all" ON public.sso_configurations
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- tests
-- ============================================
CREATE POLICY "org_tests_select" ON public.tests
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_tests_all" ON public.tests
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );

-- ============================================
-- training_assignments
-- ============================================
CREATE POLICY "org_training_assignments_select" ON public.training_assignments
  FOR SELECT USING (
    org_id = current_org_id()
    AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  );
CREATE POLICY "org_training_assignments_all" ON public.training_assignments
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- training_courses (global catalog, no org_id)
-- ============================================
CREATE POLICY "training_courses_select" ON public.training_courses
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

-- ============================================
-- training_quiz_attempts
-- ============================================
CREATE POLICY "org_training_quiz_attempts_select" ON public.training_quiz_attempts
  FOR SELECT USING (
    org_id = current_org_id()
    AND (auth.uid() IN (SELECT user_id FROM public.training_assignments WHERE id = assignment_id) OR has_role(auth.uid(), 'admin'::app_role))
  );

-- ============================================
-- training_quiz_questions (global catalog, no org_id)
-- ============================================
CREATE POLICY "training_quiz_questions_select" ON public.training_quiz_questions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

-- ============================================
-- trust_portal_shares
-- ============================================
CREATE POLICY "org_trust_portal_shares_select" ON public.trust_portal_shares
  FOR SELECT USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
CREATE POLICY "org_trust_portal_shares_all" ON public.trust_portal_shares
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );
-- Anonymous users can see active shares by token (cross-org, no org_id check)
CREATE POLICY "public_trust_portal_shares_select" ON public.trust_portal_shares
  FOR SELECT USING (
    status = 'active'::text
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ============================================
-- user_roles
-- ============================================
CREATE POLICY "org_user_roles_select" ON public.user_roles
  FOR SELECT USING (
    org_id = current_org_id()
    AND (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
  );
CREATE POLICY "org_user_roles_all" ON public.user_roles
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- vendor_assessments
-- ============================================
CREATE POLICY "org_vendor_assessments_select" ON public.vendor_assessments
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_vendor_assessments_all" ON public.vendor_assessments
  FOR ALL USING (
    org_id = current_org_id()
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================
-- vendors
-- ============================================
CREATE POLICY "org_vendors_select" ON public.vendors
  FOR SELECT USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
CREATE POLICY "org_vendors_all" ON public.vendors
  FOR ALL USING (
    org_id = current_org_id()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role))
  );
