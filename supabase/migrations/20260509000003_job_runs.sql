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

-- Schedule the run-scheduled-jobs edge function via pg_cron.
-- Run daily at 06:00 UTC. Enable pg_cron extension first if not already active.
-- Execute the block below once in the Supabase SQL editor after deploying the function:
--
-- SELECT cron.schedule(
--   'run-daily-scheduled-jobs',
--   '0 6 * * *',
--   $$
--   SELECT net.http_post(
--     url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/run-scheduled-jobs',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
--       'Content-Type',  'application/json'
--     ),
--     body    := '{}'::jsonb
--   );
--   $$
-- );
