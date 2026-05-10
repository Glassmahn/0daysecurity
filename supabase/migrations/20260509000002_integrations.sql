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
