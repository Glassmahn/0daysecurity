-- First user to sign up gets admin role instead of viewer.
-- This replaces the handle_new_user trigger so the app is self-bootstrapping.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
  role_to_assign public.app_role;
BEGIN
  BEGIN
    SELECT id INTO org_id FROM public.organization_settings ORDER BY created_at ASC LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    org_id := NULL;
  END;

  BEGIN
    INSERT INTO public.profiles (user_id, display_name, organization_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      org_id
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- First user ever gets admin; everyone else gets viewer
  role_to_assign := CASE WHEN (SELECT COUNT(*) FROM public.user_roles) = 0 THEN 'admin'::app_role ELSE 'viewer'::app_role END;

  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, role_to_assign);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$;
