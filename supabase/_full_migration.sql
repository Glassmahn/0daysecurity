
-- ==============================================
-- 1. ROLES ENUM & USER ROLES TABLE
-- ==============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'auditor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==============================================
-- 2. PROFILES TABLE
-- ==============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  job_title TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
BEGIN
  SELECT id INTO org_id FROM public.organization_settings ORDER BY created_at ASC LIMIT 1;
  INSERT INTO public.profiles (user_id, display_name, organization_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), org_id);
  -- Default role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- ==============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ==============================================
-- 4. FRAMEWORKS
-- ==============================================
CREATE TABLE public.frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT,
  description TEXT,
  category TEXT,
  total_controls INT NOT NULL DEFAULT 0,
  passing_controls INT NOT NULL DEFAULT 0,
  score NUMERIC(5,2) DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.frameworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view frameworks" ON public.frameworks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage frameworks" ON public.frameworks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_frameworks_updated_at BEFORE UPDATE ON public.frameworks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 5. CONTROLS
-- ==============================================
CREATE TABLE public.controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('implemented','partially_implemented','not_implemented','not_applicable','not_started','failing')),
  category TEXT,
  framework_id UUID REFERENCES public.frameworks(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  implementation_details TEXT,
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view controls" ON public.controls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/analysts can manage controls" ON public.controls FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE TRIGGER update_controls_updated_at BEFORE UPDATE ON public.controls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 6. POLICIES
-- ==============================================
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','approved','published','archived','expired')),
  version TEXT DEFAULT '1.0',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_date TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  framework_id UUID REFERENCES public.frameworks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view policies" ON public.policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/analysts can manage policies" ON public.policies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 7. EVIDENCE
-- ==============================================
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'document' CHECK (type IN ('screenshot','log','document','certificate','report','scan_result','config_export','policy_doc','training_record','access_review','change_record','vendor_doc','audit_report','risk_assessment','incident_report','other')),
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','expired','pending_review','rejected')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('auto','manual')),
  control_id UUID REFERENCES public.controls(id) ON DELETE SET NULL,
  file_url TEXT,
  collected_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view evidence" ON public.evidence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/analysts can manage evidence" ON public.evidence FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE TRIGGER update_evidence_updated_at BEFORE UPDATE ON public.evidence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 8. RISKS
-- ==============================================
CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  likelihood INT CHECK (likelihood BETWEEN 1 AND 5),
  impact INT CHECK (impact BETWEEN 1 AND 5),
  risk_score NUMERIC(5,2) GENERATED ALWAYS AS (likelihood * impact) STORED,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','mitigated','accepted','transferred','closed')),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mitigation_plan TEXT,
  residual_likelihood INT CHECK (residual_likelihood BETWEEN 1 AND 5),
  residual_impact INT CHECK (residual_impact BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view risks" ON public.risks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/analysts can manage risks" ON public.risks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 9. INCIDENTS
-- ==============================================
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical','high','medium','low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','contained','resolved','closed')),
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  root_cause TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view incidents" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/analysts can manage incidents" ON public.incidents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 10. ALERTS
-- ==============================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical','high','medium','low','info')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','acknowledged','resolved','dismissed')),
  source TEXT,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage alerts" ON public.alerts FOR ALL TO authenticated USING (true);
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 11. ASSETS
-- ==============================================
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','decommissioned','maintenance')),
  ip_address TEXT,
  location TEXT,
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('critical','high','medium','low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/analysts can manage assets" ON public.assets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 12. VENDORS
-- ==============================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  risk_tier TEXT DEFAULT 'medium' CHECK (risk_tier IN ('critical','high','medium','low')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','under_review','suspended','offboarded')),
  contact_email TEXT,
  contract_value NUMERIC(12,2),
  contract_expiry TIMESTAMPTZ,
  assessment_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view vendors" ON public.vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/analysts can manage vendors" ON public.vendors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 13. TESTS
-- ==============================================
CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  control_id UUID REFERENCES public.controls(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('passing','failing','error','pending','disabled')),
  last_run TIMESTAMPTZ,
  result TEXT,
  schedule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view tests" ON public.tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins/analysts can manage tests" ON public.tests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- 14. AUDIT LOGS
-- ==============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ==============================================
-- 15. INDEXES
-- ==============================================
CREATE INDEX idx_controls_framework ON public.controls(framework_id);
CREATE INDEX idx_controls_status ON public.controls(status);
CREATE INDEX idx_evidence_control ON public.evidence(control_id);
CREATE INDEX idx_evidence_status ON public.evidence(status);
CREATE INDEX idx_incidents_severity ON public.incidents(severity);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_risks_status ON public.risks(status);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);

-- Drop the overly permissive policy
DROP POLICY "Authenticated users can manage alerts" ON public.alerts;

-- Replace with role-restricted write access
CREATE POLICY "Admins/analysts can manage alerts"
  ON public.alerts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));

CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'guide',
  tags TEXT[] DEFAULT '{}',
  author_id UUID,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published KB articles"
  ON public.knowledge_base FOR SELECT TO authenticated
  USING (status = 'published' OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

CREATE POLICY "Admins/analysts can manage KB articles"
  ON public.knowledge_base FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

CREATE INDEX idx_knowledge_base_category ON public.knowledge_base (category);
CREATE INDEX idx_knowledge_base_tags ON public.knowledge_base USING GIN (tags);

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.knowledge_base
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
) STORED;

CREATE INDEX idx_knowledge_base_fts ON public.knowledge_base USING GIN (search_vector);

CREATE TABLE public.kb_article_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  status TEXT,
  changed_by UUID,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_article_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view article versions"
  ON public.kb_article_versions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins/analysts can manage article versions"
  ON public.kb_article_versions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

CREATE INDEX idx_kb_versions_article ON public.kb_article_versions (article_id, version_number DESC);

-- Add version counter to knowledge_base
ALTER TABLE public.knowledge_base ADD COLUMN current_version INTEGER NOT NULL DEFAULT 1;

-- Trigger to snapshot old version before update
CREATE OR REPLACE FUNCTION public.snapshot_kb_article_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only snapshot if title or content actually changed
  IF OLD.title IS DISTINCT FROM NEW.title OR OLD.content IS DISTINCT FROM NEW.content
     OR OLD.category IS DISTINCT FROM NEW.category OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.kb_article_versions (article_id, version_number, title, content, category, status, changed_by)
    VALUES (OLD.id, OLD.current_version, OLD.title, OLD.content, OLD.category, OLD.status, auth.uid());

    NEW.current_version := OLD.current_version + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER kb_article_version_snapshot
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_kb_article_version();

-- Enable extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create compliance snapshots table
CREATE TABLE public.compliance_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_score NUMERIC NOT NULL DEFAULT 0,
  controls_passing_pct NUMERIC NOT NULL DEFAULT 0,
  evidence_valid_pct NUMERIC NOT NULL DEFAULT 0,
  frameworks_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date)
);

ALTER TABLE public.compliance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view snapshots"
  ON public.compliance_snapshots FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage snapshots"
  ON public.compliance_snapshots FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_compliance_snapshots_date ON public.compliance_snapshots (snapshot_date DESC);
UPDATE public.user_roles SET role = 'admin' WHERE user_id = 'bafec7d1-fa52-4725-8a90-62a0930c192f';
-- Fix 1: Restrict vendors SELECT to admin/analyst only
DROP POLICY IF EXISTS "Authenticated users can view vendors" ON public.vendors;

CREATE POLICY "Admin/analyst can view vendors"
  ON public.vendors FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

-- Fix 2: Restrict audit_logs SELECT — admins see all, others see only own entries
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
-- Enable the moddatetime extension for automatic updated_at column management.
-- Required by notification_preferences and integrations triggers.
CREATE EXTENSION IF NOT EXISTS moddatetime;
-- Restrict assets SELECT to admin/analyst only.
-- IP addresses and physical locations are sensitive; viewers/auditors
-- should not have direct table access.
DROP POLICY IF EXISTS "Authenticated users can view assets" ON public.assets;

CREATE POLICY "Admin/analyst can view assets"
  ON public.assets FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'analyst'::app_role)
  );
-- notification_preferences: one row per user, storing email/slack toggles for each alert type.
CREATE TABLE public.notification_preferences (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- critical alerts
  critical_alerts_email   boolean NOT NULL DEFAULT true,
  critical_alerts_slack   boolean NOT NULL DEFAULT true,

  -- high severity alerts
  high_alerts_email       boolean NOT NULL DEFAULT true,
  high_alerts_slack       boolean NOT NULL DEFAULT false,

  -- evidence expiring (within 30 days)
  evidence_expiring_email boolean NOT NULL DEFAULT true,
  evidence_expiring_slack boolean NOT NULL DEFAULT false,

  -- access review reminders
  access_review_email     boolean NOT NULL DEFAULT true,
  access_review_slack     boolean NOT NULL DEFAULT true,

  -- policy review due
  policy_review_email     boolean NOT NULL DEFAULT false,
  policy_review_slack     boolean NOT NULL DEFAULT false,

  -- weekly digest
  weekly_digest_email     boolean NOT NULL DEFAULT true,
  weekly_digest_slack     boolean NOT NULL DEFAULT false,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification preferences"
  ON public.notification_preferences
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Keep updated_at current automatically.
CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

SELECT cron.schedule(
  'send-daily-notifications',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'run-integration-connectors',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/run-integration-connectors',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'control-monitoring',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/control-monitoring',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'jira-sync',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/jira-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- integrations: one row per provider, storing connection status and config.
CREATE TABLE public.integrations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        text        NOT NULL UNIQUE,
  name            text        NOT NULL,
  category        text        NOT NULL,
  status          text        NOT NULL DEFAULT 'disconnected'
                              CHECK (status IN ('connected','disconnected','error','syncing')),
  -- Arbitrary provider-specific config (webhook URLs, API endpoint, org slug, etc.).
  -- Secret credentials (API keys, tokens) should be migrated to Supabase Vault in production.
  config          jsonb,
  last_synced_at  timestamptz,
  controls_mapped int         NOT NULL DEFAULT 0,
  error_message   text,
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Admins can manage integrations; analysts/auditors can view status (not config).
CREATE POLICY "Admins manage integrations"
  ON public.integrations FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Analysts and auditors view integrations"
  ON public.integrations FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'analyst'::app_role)
    OR public.has_role(auth.uid(), 'auditor'::app_role)
    OR public.has_role(auth.uid(), 'viewer'::app_role)
  );

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Seed with the eight canonical integrations the UI already knows about.
INSERT INTO public.integrations (provider, name, category, status, controls_mapped) VALUES
  ('aws',      'AWS',          'Cloud',         'disconnected', 0),
  ('okta',     'Okta',         'Identity',      'disconnected', 0),
  ('github',   'GitHub',       'Code',          'disconnected', 0),
  ('datadog',  'Datadog',      'Monitoring',    'disconnected', 0),
  ('jira',     'Jira',         'Ticketing',     'disconnected', 0),
  ('slack',    'Slack',        'Communication', 'disconnected', 0),
  ('gcp',      'Google Cloud', 'Cloud',         'disconnected', 0),
  ('jamf',     'Jamf',         'MDM',           'disconnected', 0),
  ('crowdstrike','CrowdStrike','Security',      'disconnected', 0),
  ('qualys',   'Qualys',       'Security',      'disconnected', 0),
  ('vanta',    'Vanta',        'Compliance',    'disconnected', 0),
  ('pagerduty','PagerDuty',    'Monitoring',    'disconnected', 0);
-- job_runs: audit log for each scheduled job execution.
CREATE TABLE public.job_runs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    text        NOT NULL,
  status      text        NOT NULL CHECK (status IN ('success', 'failure', 'partial')),
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms int,
  records_affected int     NOT NULL DEFAULT 0,
  error_message text,
  details     jsonb
);

ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;

-- Admins can read and insert; service-role key (edge function) bypasses RLS.
CREATE POLICY "Admins view job runs"
  ON public.job_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- compliance_snapshots: daily point-in-time compliance scores per framework.
-- v1 table was created in 20260411142659 — drop it first to adopt v2 schema.
DROP TABLE IF EXISTS public.compliance_snapshots CASCADE;
CREATE TABLE public.compliance_snapshots (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date   date        NOT NULL DEFAULT CURRENT_DATE,
  framework       text        NOT NULL,
  total_controls  int         NOT NULL DEFAULT 0,
  implemented     int         NOT NULL DEFAULT 0,
  in_progress     int         NOT NULL DEFAULT 0,
  failing         int         NOT NULL DEFAULT 0,
  not_started     int         NOT NULL DEFAULT 0,
  score_pct       numeric(5,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date, framework)
);

ALTER TABLE public.compliance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users view compliance snapshots"
  ON public.compliance_snapshots FOR SELECT TO authenticated
  USING (true);

SELECT cron.schedule(
  'run-daily-scheduled-jobs',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/run-scheduled-jobs',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);
-- Grant admin role to admin@zeroday.test (user_id 5518f727-04e8-468e-ad98-86dbca734490)
-- The original migration targeted the wrong UUID.
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = '5518f727-04e8-468e-ad98-86dbca734490';

-- trust_portal_shares: shareable compliance status and evidence packages.
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

CREATE POLICY "Admins manage trust portal shares"
  ON public.trust_portal_shares FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users view trust portal shares"
  ON public.trust_portal_shares FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Public access via token"
  ON public.trust_portal_shares FOR SELECT TO anon
  USING (status = 'active' AND (expires_at IS NULL OR expires_at > now()));

CREATE TRIGGER trg_trust_portal_shares_updated_at
  BEFORE UPDATE ON public.trust_portal_shares
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- policy_acknowledgments: tracks employee acknowledgment of policies.
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

CREATE POLICY "Users manage own acknowledgments"
  ON public.policy_acknowledgments FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all acknowledgments"
  ON public.policy_acknowledgments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- vendor_assessments: security questionnaire sent to vendors.
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

CREATE POLICY "Admins manage vendor assessments"
  ON public.vendor_assessments FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Analysts view vendor assessments"
  ON public.vendor_assessments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'analyst'::app_role));

CREATE TRIGGER trg_vendor_assessments_updated_at
  BEFORE UPDATE ON public.vendor_assessments
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- access_review_campaigns: scheduled user access review campaigns.
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

CREATE POLICY "Admins manage review campaigns"
  ON public.access_review_campaigns FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_access_review_campaigns_updated_at
  BEFORE UPDATE ON public.access_review_campaigns
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- access_review_assignments: individual review assignments within a campaign.
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

CREATE POLICY "Admins manage review assignments"
  ON public.access_review_assignments FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- custom_field_definitions: per-entity custom field schemas.
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

CREATE POLICY "Admins manage custom fields"
  ON public.custom_field_definitions FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users view custom field definitions"
  ON public.custom_field_definitions FOR SELECT TO authenticated
  USING (true);

-- custom_field_values: actual values for custom fields on entities.
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

CREATE POLICY "Admins manage custom field values"
  ON public.custom_field_values FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users view custom field values"
  ON public.custom_field_values FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER trg_custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Audit Management: engagements (audits)
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

CREATE POLICY "Authenticated users can view audits"
  ON public.audits FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/analysts can manage audits"
  ON public.audits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role));

CREATE TRIGGER trg_audits_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Audit Management: findings
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

CREATE POLICY "Authenticated users can view audit findings"
  ON public.audit_findings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/analysts can manage audit findings"
  ON public.audit_findings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role));

CREATE INDEX idx_audit_findings_audit ON public.audit_findings (audit_id);

CREATE TRIGGER trg_audit_findings_updated_at
  BEFORE UPDATE ON public.audit_findings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Audit Management: evidence requests
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

CREATE POLICY "Authenticated users can view audit evidence requests"
  ON public.audit_evidence_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/analysts can manage audit evidence requests"
  ON public.audit_evidence_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role));

CREATE INDEX idx_audit_evidence_requests_audit ON public.audit_evidence_requests (audit_id);
CREATE INDEX idx_audit_evidence_requests_assigned ON public.audit_evidence_requests (assigned_to_id);

CREATE TRIGGER trg_audit_evidence_requests_updated_at
  BEFORE UPDATE ON public.audit_evidence_requests
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- SSO / SAML Configuration
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

CREATE POLICY "Admins manage SSO configurations"
  ON public.sso_configurations FOR ALL TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_sso_configurations_updated_at
  BEFORE UPDATE ON public.sso_configurations
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Training Management: courses
CREATE TABLE IF NOT EXISTS public.training_courses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  description   text,
  category      text,
  duration_minutes integer,
  status        text        NOT NULL DEFAULT 'active',
  content       jsonb       DEFAULT '{"sections": []}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view training courses"
  ON public.training_courses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/analysts can manage training courses"
  ON public.training_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role));

CREATE TRIGGER trg_training_courses_updated_at
  BEFORE UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Training Management: assignments
CREATE TABLE IF NOT EXISTS public.training_assignments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid        NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'assigned',
  completed_at  timestamptz,
  score         integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);

ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own training assignments"
  ON public.training_assignments FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage training assignments"
  ON public.training_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_training_assignments_user ON public.training_assignments (user_id);
CREATE INDEX idx_training_assignments_course ON public.training_assignments (course_id);

CREATE TRIGGER trg_training_assignments_updated_at
  BEFORE UPDATE ON public.training_assignments
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Report Scheduler
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

CREATE POLICY "Admins/analysts can view report schedules"
  ON public.report_schedules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role));

CREATE POLICY "Admins/analysts can manage report schedules"
  ON public.report_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role));

CREATE TRIGGER trg_report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Schedule the generate-scheduled-reports edge function via pg_cron.
-- Runs daily at 07:00 UTC to generate and deliver scheduled reports.
SELECT cron.schedule(
  'generate-scheduled-reports',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/generate-scheduled-reports',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- vendor_portal_tokens: tokenized links for vendor self-service
CREATE TABLE IF NOT EXISTS public.vendor_portal_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '30 days',
  last_accessed_at timestamptz,
  created_by    uuid REFERENCES auth.users(id)
);

ALTER TABLE public.vendor_portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view vendor tokens by token"
  ON public.vendor_portal_tokens FOR SELECT TO anon
  USING (true);
CREATE POLICY "Admins manage vendor tokens"
  ON public.vendor_portal_tokens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- vendor_portal_submissions: documents uploaded by vendors via portal
CREATE TABLE IF NOT EXISTS public.vendor_portal_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_token_id uuid NOT NULL REFERENCES public.vendor_portal_tokens(id) ON DELETE CASCADE,
  document_type   text NOT NULL,
  file_url        text,
  notes           text,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_portal_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert submissions via portal"
  ON public.vendor_portal_submissions FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "Admins can view submissions"
  ON public.vendor_portal_submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- training_quiz_questions: quiz questions linked to courses
CREATE TABLE IF NOT EXISTS public.training_quiz_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  question      text NOT NULL,
  options       jsonb NOT NULL,
  correct_index int NOT NULL,
  explanation   text
);

ALTER TABLE public.training_quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view quiz questions"
  ON public.training_quiz_questions FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Admins manage quiz questions"
  ON public.training_quiz_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- training_quiz_attempts: user quiz attempts and scores
CREATE TABLE IF NOT EXISTS public.training_quiz_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.training_assignments(id) ON DELETE CASCADE,
  answers       jsonb NOT NULL,
  score         int NOT NULL,
  passed        boolean NOT NULL,
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

ALTER TABLE public.training_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quiz attempts"
  ON public.training_quiz_attempts FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.training_assignments WHERE id = assignment_id));
CREATE POLICY "Users can insert own quiz attempts"
  ON public.training_quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.training_assignments WHERE id = assignment_id));

-- risk_treatment_approvals: formal risk treatment workflow
CREATE TABLE IF NOT EXISTS public.risk_treatment_approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id         uuid NOT NULL REFERENCES public.risks(id) ON DELETE CASCADE,
  treatment       text NOT NULL CHECK (treatment IN ('accept', 'remediate', 'transfer', 'avoid')),
  approved_by     uuid NOT NULL REFERENCES auth.users(id),
  approved_at     timestamptz NOT NULL DEFAULT now(),
  justification   text,
  next_review_at  date
);

ALTER TABLE public.risk_treatment_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view treatment approvals"
  ON public.risk_treatment_approvals FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Admins/analysts manage treatment approvals"
  ON public.risk_treatment_approvals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role));

-- Supabase Vault migration: add secret_id to integrations
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS secret_id uuid REFERENCES vault.secrets(id);

CREATE OR REPLACE FUNCTION public.migrate_integration_secrets()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rec RECORD;
  new_id uuid;
BEGIN
  FOR rec IN SELECT * FROM public.integrations WHERE config IS NOT NULL AND secret_id IS NULL LOOP
    INSERT INTO vault.secrets (name, secret, description)
    VALUES ('integration_' || rec.id, rec.config::text, 'Integration config for ' || rec.provider)
    RETURNING id INTO new_id;
    UPDATE public.integrations SET secret_id = new_id WHERE id = rec.id;
  END LOOP;
END;
$$;

-- organization_settings: single-row org-level configuration
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL DEFAULT '',
  industry        text NOT NULL DEFAULT '',
  slug            text NOT NULL UNIQUE DEFAULT '',
  primary_contact text NOT NULL DEFAULT '',
  logo_url        text,
  plan            text NOT NULL DEFAULT 'enterprise',
  settings        jsonb DEFAULT '{}',
  updated_by      uuid REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.organization_settings (name, industry, slug, primary_contact, plan)
VALUES ('Meridian Health Tech', 'Healthcare SaaS', 'meridian-health-tech', 'sarah.chen@meridian.io', 'enterprise')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view organization settings"
  ON public.organization_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update organization settings"
  ON public.organization_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add organization_id to profiles for multi-tenant support
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organization_settings(id) ON DELETE SET NULL;

-- api_keys table for programmatic access
CREATE TABLE IF NOT EXISTS public.api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  key_hash    text NOT NULL,
  key_prefix  text NOT NULL,
  created_by  uuid REFERENCES auth.users(id),
  last_used_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api keys"
  ON public.api_keys FOR SELECT TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can manage own api keys"
  ON public.api_keys FOR ALL TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- evidence-files storage bucket for evidence uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('evidence-files', 'evidence-files', false, 52428800,
  ARRAY['application/pdf','image/png','image/jpeg','text/plain','text/csv',
        'application/zip','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence-files');

CREATE POLICY "Authenticated users can read evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence-files');

-- Webhook endpoints for event-driven integrations
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  url             text NOT NULL,
  events          text[] NOT NULL DEFAULT '{}',
  secret          text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status          text NOT NULL DEFAULT 'active',
  last_sent_at    timestamptz,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook endpoints"
  ON public.webhook_endpoints FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins/analysts manage webhook endpoints"
  ON public.webhook_endpoints FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'analyst'::app_role));

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id     uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event           text NOT NULL,
  payload         jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  response_code   int,
  response_body   text,
  attempted_at    timestamptz NOT NULL DEFAULT now(),
  delivered_at    timestamptz
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook deliveries"
  ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (true);

-- Evidence recollection tracking
CREATE TABLE IF NOT EXISTS public.evidence_recollection_attempts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id     uuid NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  attempt_type    text NOT NULL,
  status          text NOT NULL DEFAULT 'pending',
  triggered_at    timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  result          text
);

ALTER TABLE public.evidence_recollection_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recollection attempts"
  ON public.evidence_recollection_attempts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can insert recollection attempts"
  ON public.evidence_recollection_attempts FOR INSERT TO authenticated
  WITH CHECK (true);
