-- Schedule cron jobs for periodic edge function execution.
-- Requires pg_cron extension (enabled by default on Supabase Pro/Team plans).
-- Run this migration after deploying all referenced edge functions.
-- Replace <SERVICE_ROLE_KEY> with the actual service role key from
-- your Supabase project dashboard (Settings → API) before running.
-- Project ref: sjtsnkxgxjigtrrvicfp
-- Alternatively, use Vault secrets:
--   SELECT vault.create_secret('https://sjtsnkxgxjigtrrvicfp.supabase.co', 'supabase_url');
--   SELECT vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');

-- Daily scheduled jobs at 06:00 UTC
SELECT cron.schedule(
  'run-daily-scheduled-jobs',
  '0 6 * * *',
  $$SELECT net.http_post(
    url     := 'https://sjtsnkxgxjigtrrvicfp.supabase.co/functions/v1/run-scheduled-jobs',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdHNua3hneGppZ3RycnZpY2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc3Mzg0NCwiZXhwIjoyMDk0MzQ5ODQ0fQ.nqfNd6Y1OFBwZfzhHHxUyUATEzgc61S2K2epj9zxhso',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );$$
);

-- Daily notifications at 08:00 UTC
SELECT cron.schedule(
  'send-daily-notifications',
  '0 8 * * *',
  $$SELECT net.http_post(
    url     := 'https://sjtsnkxgxjigtrrvicfp.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdHNua3hneGppZ3RycnZpY2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc3Mzg0NCwiZXhwIjoyMDk0MzQ5ODQ0fQ.nqfNd6Y1OFBwZfzhHHxUyUATEzgc61S2K2epj9zxhso',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );$$
);

-- Integration connectors every 30 minutes
SELECT cron.schedule(
  'run-integration-connectors',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url     := 'https://sjtsnkxgxjigtrrvicfp.supabase.co/functions/v1/run-integration-connectors',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdHNua3hneGppZ3RycnZpY2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc3Mzg0NCwiZXhwIjoyMDk0MzQ5ODQ0fQ.nqfNd6Y1OFBwZfzhHHxUyUATEzgc61S2K2epj9zxhso',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );$$
);

-- Control monitoring every 4 hours
SELECT cron.schedule(
  'control-monitoring',
  '0 */4 * * *',
  $$SELECT net.http_post(
    url     := 'https://sjtsnkxgxjigtrrvicfp.supabase.co/functions/v1/control-monitoring',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdHNua3hneGppZ3RycnZpY2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc3Mzg0NCwiZXhwIjoyMDk0MzQ5ODQ0fQ.nqfNd6Y1OFBwZfzhHHxUyUATEzgc61S2K2epj9zxhso',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );$$
);

-- Jira sync daily at 02:00 UTC
SELECT cron.schedule(
  'jira-sync',
  '0 2 * * *',
  $$SELECT net.http_post(
    url     := 'https://sjtsnkxgxjigtrrvicfp.supabase.co/functions/v1/jira-sync',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdHNua3hneGppZ3RycnZpY2ZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc3Mzg0NCwiZXhwIjoyMDk0MzQ5ODQ0fQ.nqfNd6Y1OFBwZfzhHHxUyUATEzgc61S2K2epj9zxhso',
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );$$
);
