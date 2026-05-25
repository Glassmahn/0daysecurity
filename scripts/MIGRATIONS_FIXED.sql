-- ============ CORRECTED MIGRATIONS ============
-- Run this entire file in Supabase SQL Editor

-- 1. Add enum values
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'auditor';

-- 2. Create missing tables
CREATE TABLE IF NOT EXISTS public.subprocessors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  services TEXT[],
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  data_classification TEXT,
  contract_signed_at TIMESTAMPTZ,
  contract_expires_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  vendor_id UUID,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT,
  message TEXT,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evidence_recollection_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  evidence_id UUID REFERENCES public.evidence(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  triggered_by UUID,
  assigned_to UUID,
  message TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update trigger (fixed: no organization_id on profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_role public.app_role;
BEGIN
  BEGIN
    SELECT id INTO v_org_id FROM public.organization_settings ORDER BY created_at ASC LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_org_id := NULL;
  END;
  BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  v_role := CASE WHEN (SELECT COUNT(*) FROM public.user_roles) = 0 THEN 'admin'::app_role ELSE 'viewer'::app_role END;
  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$;
