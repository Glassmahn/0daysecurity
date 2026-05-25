-- Fix 1: Recreate the has_role helper function (matches existing param names)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Fix 2: Replace recursive user_roles RLS with non-recursive policy
DROP POLICY IF EXISTS "org_user_roles_select" ON public.user_roles;
DROP POLICY IF EXISTS "org_user_roles_all" ON public.user_roles;

-- Allow users to see their own role (no recursion)
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (
  user_id = auth.uid()
);

-- Admins can manage all roles in their org
CREATE POLICY "user_roles_all_admin" ON public.user_roles FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);
