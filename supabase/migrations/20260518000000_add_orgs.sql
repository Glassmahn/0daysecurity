-- Migration 1A: Create orgs table + seed default org

CREATE TABLE IF NOT EXISTS public.orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  industry text,
  size text,
  plan text DEFAULT 'free',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER set_orgs_updated_at
  BEFORE UPDATE ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime();

-- Seed default org
INSERT INTO public.orgs (id, name, slug, industry, size, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Meridians Health Tech',
  'meridians-health-tech',
  'Healthcare',
  'medium',
  'enterprise'
)
ON CONFLICT (slug) DO NOTHING;

-- Migration existing organization_settings to link to org
DO $$
DECLARE
  org_id uuid := '00000000-0000-0000-0000-000000000001';
  existing_count integer;
BEGIN
  SELECT count(*) INTO existing_count FROM public.organization_settings;
  IF existing_count = 0 THEN
    INSERT INTO public.organization_settings (id, name, industry, slug, plan, settings)
    VALUES (org_id, 'Meridians Health Tech', 'Healthcare', 'meridians-health-tech', 'enterprise', '{}'::jsonb);
  END IF;
END $$;

-- Function to set current org context for RLS policies
CREATE OR REPLACE FUNCTION public.set_current_org_id(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id::text, false);
END;
$$;

-- Helper function for RLS policies
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN current_setting('app.current_org_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;
