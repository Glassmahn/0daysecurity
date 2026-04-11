
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
