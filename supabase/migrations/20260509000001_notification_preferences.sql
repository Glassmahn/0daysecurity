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

-- Schedule the send-notifications edge function to run daily at 08:00 UTC.
-- Requires the pg_cron extension (enabled by default on Supabase Pro/Team plans).
-- Replace <PROJECT_REF> and <SERVICE_ROLE_KEY> with your project values, then
-- run this block once from the Supabase SQL editor.
--
-- SELECT cron.schedule(
--   'send-daily-notifications',
--   '0 8 * * *',
--   $$
--   SELECT net.http_post(
--     url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-notifications',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
--       'Content-Type',  'application/json'
--     ),
--     body    := '{}'::jsonb
--   );
--   $$
-- );
