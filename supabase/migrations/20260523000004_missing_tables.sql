-- Create tables that were referenced by edge functions but never created in migrations

-- vendor_portal_tokens: used by generate-vendor-token edge function
CREATE TABLE IF NOT EXISTS public.vendor_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked'))
);

ALTER TABLE public.vendor_portal_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendor_portal_tokens_select" ON public.vendor_portal_tokens FOR SELECT USING (
  org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "vendor_portal_tokens_insert" ON public.vendor_portal_tokens FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "vendor_portal_tokens_update" ON public.vendor_portal_tokens FOR UPDATE USING (
  org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "vendor_portal_tokens_delete" ON public.vendor_portal_tokens FOR DELETE USING (
  org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add org_id to vendor_portal_tokens
ALTER TABLE public.vendor_portal_tokens ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE;

-- evidence_recollection_attempts: used by run-scheduled-jobs edge function
CREATE TABLE IF NOT EXISTS public.evidence_recollection_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.orgs(id) ON DELETE CASCADE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  source TEXT NOT NULL DEFAULT 'auto'
);

ALTER TABLE public.evidence_recollection_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_recollection_attempts_select" ON public.evidence_recollection_attempts FOR SELECT USING (
  org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
);

CREATE POLICY "evidence_recollection_attempts_insert" ON public.evidence_recollection_attempts FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM public.user_roles WHERE user_id = auth.uid())
);
