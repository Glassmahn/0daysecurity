-- Trust Portal: subprocessors table for vendor disclosures
CREATE TABLE IF NOT EXISTS public.subprocessors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_review')),
  data_handled TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subprocessors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_subprocessors_select" ON public.subprocessors
  FOR SELECT USING (
    org_id = '00000000-0000-0000-0000-000000000001'
    OR org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "org_subprocessors_insert" ON public.subprocessors
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "org_subprocessors_update" ON public.subprocessors
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "org_subprocessors_delete" ON public.subprocessors
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );
