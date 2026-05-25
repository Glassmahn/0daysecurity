-- Fix: Create all missing tables referenced by seed data and app code

-- ==========================================
-- Trust Portal Shares
-- ==========================================
CREATE TABLE IF NOT EXISTS public.trust_portal_shares (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  token            text        NOT NULL UNIQUE,
  frameworks       text[]      NOT NULL DEFAULT '{}',
  status           text        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active','expired','revoked')),
  expires_at       timestamptz,
  include_reports  boolean     NOT NULL DEFAULT true,
  include_evidence boolean     NOT NULL DEFAULT true,
  allowed_domains  text[]      NOT NULL DEFAULT '{}',
  last_accessed_at timestamptz,
  access_count     int         NOT NULL DEFAULT 0,
  created_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trust_portal_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage trust portal shares" ON public.trust_portal_shares;
CREATE POLICY "Admins manage trust portal shares"
  ON public.trust_portal_shares FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users view trust portal shares" ON public.trust_portal_shares;
CREATE POLICY "Authenticated users view trust portal shares"
  ON public.trust_portal_shares FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Public access via token" ON public.trust_portal_shares;
CREATE POLICY "Public access via token"
  ON public.trust_portal_shares FOR SELECT TO anon
  USING (status = 'active' AND (expires_at IS NULL OR expires_at > now()));

DROP TRIGGER IF EXISTS trg_trust_portal_shares_updated_at ON public.trust_portal_shares;
CREATE TRIGGER trg_trust_portal_shares_updated_at
  BEFORE UPDATE ON public.trust_portal_shares
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- Policy Acknowledgments
-- ==========================================
CREATE TABLE IF NOT EXISTS public.policy_acknowledgments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id           uuid        NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at     timestamptz NOT NULL DEFAULT now(),
  version_acknowledged text       NOT NULL DEFAULT '1.0',
  status              text        NOT NULL DEFAULT 'acknowledged'
                                  CHECK (status IN ('acknowledged', 'declined', 'pending')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (policy_id, user_id)
);

ALTER TABLE public.policy_acknowledgments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own acknowledgments" ON public.policy_acknowledgments;
CREATE POLICY "Users manage own acknowledgments"
  ON public.policy_acknowledgments FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all acknowledgments" ON public.policy_acknowledgments;
CREATE POLICY "Admins view all acknowledgments"
  ON public.policy_acknowledgments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- Vendor Assessments
-- ==========================================
CREATE TABLE IF NOT EXISTS public.vendor_assessments (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  status          text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','sent','in_progress','completed','expired')),
  score           int,
  responses       jsonb       DEFAULT '{}'::jsonb,
  sent_at         timestamptz,
  responded_at    timestamptz,
  due_at          timestamptz,
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage vendor assessments" ON public.vendor_assessments;
CREATE POLICY "Admins manage vendor assessments"
  ON public.vendor_assessments FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Analysts view vendor assessments" ON public.vendor_assessments;
CREATE POLICY "Analysts view vendor assessments"
  ON public.vendor_assessments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'analyst'));

DROP TRIGGER IF EXISTS trg_vendor_assessments_updated_at ON public.vendor_assessments;
CREATE TRIGGER trg_vendor_assessments_updated_at
  BEFORE UPDATE ON public.vendor_assessments
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- Access Review Campaigns
-- ==========================================
CREATE TABLE IF NOT EXISTS public.access_review_campaigns (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  status        text        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','in_progress','completed','cancelled')),
  due_date      date,
  notes         text,
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_review_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage review campaigns" ON public.access_review_campaigns;
CREATE POLICY "Admins manage review campaigns"
  ON public.access_review_campaigns FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_access_review_campaigns_updated_at ON public.access_review_campaigns;
CREATE TRIGGER trg_access_review_campaigns_updated_at
  BEFORE UPDATE ON public.access_review_campaigns
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- Access Review Assignments
-- ==========================================
CREATE TABLE IF NOT EXISTS public.access_review_assignments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid        NOT NULL REFERENCES public.access_review_campaigns(id) ON DELETE CASCADE,
  reviewer_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewee_id   uuid        NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','rejected','changes_requested')),
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_review_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage review assignments" ON public.access_review_assignments;
CREATE POLICY "Admins manage review assignments"
  ON public.access_review_assignments FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- Custom Field Definitions
-- ==========================================
CREATE TABLE IF NOT EXISTS public.custom_field_definitions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   text        NOT NULL,
  field_name    text        NOT NULL,
  field_type    text        NOT NULL DEFAULT 'text'
                            CHECK (field_type IN ('text','textarea','select','number','date','boolean')),
  options       jsonb       DEFAULT '[]'::jsonb,
  required      boolean     NOT NULL DEFAULT false,
  sort_order    int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, field_name)
);

ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage custom fields" ON public.custom_field_definitions;
CREATE POLICY "Admins manage custom fields"
  ON public.custom_field_definitions FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "All authenticated users view custom field definitions" ON public.custom_field_definitions;
CREATE POLICY "All authenticated users view custom field definitions"
  ON public.custom_field_definitions FOR SELECT TO authenticated
  USING (true);

-- ==========================================
-- Custom Field Values
-- ==========================================
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  field_definition_id uuid        NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  entity_id           uuid        NOT NULL,
  value               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_definition_id, entity_id)
);

ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage custom field values" ON public.custom_field_values;
CREATE POLICY "Admins manage custom field values"
  ON public.custom_field_values FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "All authenticated users view custom field values" ON public.custom_field_values;
CREATE POLICY "All authenticated users view custom field values"
  ON public.custom_field_values FOR SELECT TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS trg_custom_field_values_updated_at ON public.custom_field_values;
CREATE TRIGGER trg_custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- Audits
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audits (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  framework        text,
  status           text        NOT NULL DEFAULT 'draft',
  scope            text,
  start_date       date,
  end_date         date,
  lead_auditor_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view audits" ON public.audits;
CREATE POLICY "Authenticated users can view audits"
  ON public.audits FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins/analysts can manage audits" ON public.audits;
CREATE POLICY "Admins/analysts can manage audits"
  ON public.audits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));

DROP TRIGGER IF EXISTS trg_audits_updated_at ON public.audits;
CREATE TRIGGER trg_audits_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- Audit Findings
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_findings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id      uuid        NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  control_id    uuid        REFERENCES public.controls(id) ON DELETE SET NULL,
  title         text        NOT NULL,
  severity      text        NOT NULL DEFAULT 'medium',
  status        text        NOT NULL DEFAULT 'open',
  description   text,
  remediation   text,
  evidence_refs text[]      DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view audit findings" ON public.audit_findings;
CREATE POLICY "Authenticated users can view audit findings"
  ON public.audit_findings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins/analysts can manage audit findings" ON public.audit_findings;
CREATE POLICY "Admins/analysts can manage audit findings"
  ON public.audit_findings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));

CREATE INDEX IF NOT EXISTS idx_audit_findings_audit ON public.audit_findings (audit_id);

DROP TRIGGER IF EXISTS trg_audit_findings_updated_at ON public.audit_findings;
CREATE TRIGGER trg_audit_findings_updated_at
  BEFORE UPDATE ON public.audit_findings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- Audit Evidence Requests
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_evidence_requests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id         uuid        NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  finding_id       uuid        REFERENCES public.audit_findings(id) ON DELETE SET NULL,
  title            text        NOT NULL,
  description      text,
  requested_by_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  status           text        NOT NULL DEFAULT 'pending',
  due_date         date,
  submitted_at     timestamptz,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_evidence_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view audit evidence requests" ON public.audit_evidence_requests;
CREATE POLICY "Authenticated users can view audit evidence requests"
  ON public.audit_evidence_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins/analysts can manage audit evidence requests" ON public.audit_evidence_requests;
CREATE POLICY "Admins/analysts can manage audit evidence requests"
  ON public.audit_evidence_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));

CREATE INDEX IF NOT EXISTS idx_audit_evidence_requests_audit ON public.audit_evidence_requests (audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_requests_assigned ON public.audit_evidence_requests (assigned_to_id);

DROP TRIGGER IF EXISTS trg_audit_evidence_requests_updated_at ON public.audit_evidence_requests;
CREATE TRIGGER trg_audit_evidence_requests_updated_at
  BEFORE UPDATE ON public.audit_evidence_requests
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- SSO / SAML Configurations
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sso_configurations (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           text        NOT NULL DEFAULT 'saml',
  entity_id          text,
  sso_url            text,
  certificate        text,
  attribute_mapping  jsonb       DEFAULT '{}',
  status             text        NOT NULL DEFAULT 'inactive',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage SSO configurations" ON public.sso_configurations;
CREATE POLICY "Admins manage SSO configurations"
  ON public.sso_configurations FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_sso_configurations_updated_at ON public.sso_configurations;
CREATE TRIGGER trg_sso_configurations_updated_at
  BEFORE UPDATE ON public.sso_configurations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ==========================================
-- Report Schedules
-- ==========================================
CREATE TABLE IF NOT EXISTS public.report_schedules (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  report_type   text        NOT NULL,
  format        text        NOT NULL DEFAULT 'pdf',
  schedule      text        NOT NULL DEFAULT 'weekly',
  recipients    text[]      DEFAULT '{}',
  filters       jsonb       DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'active',
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins/analysts can view report schedules" ON public.report_schedules;
CREATE POLICY "Admins/analysts can view report schedules"
  ON public.report_schedules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));

DROP POLICY IF EXISTS "Admins/analysts can manage report schedules" ON public.report_schedules;
CREATE POLICY "Admins/analysts can manage report schedules"
  ON public.report_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));

DROP TRIGGER IF EXISTS trg_report_schedules_updated_at ON public.report_schedules;
CREATE TRIGGER trg_report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
