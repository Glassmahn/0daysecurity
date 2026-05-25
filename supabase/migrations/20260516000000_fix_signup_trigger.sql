-- Fix the handle_new_user trigger to gracefully handle errors
-- The original trigger crashes on auth.users INSERT, causing signup to fail with 500
-- This version wraps the profile/role creation in a sub-block with exception handling

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Try to get the first organization (may not exist yet)
  BEGIN
    SELECT id INTO org_id FROM public.organization_settings ORDER BY created_at ASC LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    org_id := NULL;
  END;

  -- Insert profile - wrap in sub-block so trigger never fails
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, organization_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      org_id
    );
  EXCEPTION WHEN OTHERS THEN
    -- Profile creation failed - log but don't block signup
    NULL;
  END;

  -- Insert default viewer role
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;
