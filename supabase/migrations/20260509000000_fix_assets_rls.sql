-- Restrict assets SELECT to admin/analyst only.
-- IP addresses and physical locations are sensitive; viewers/auditors
-- should not have direct table access.
DROP POLICY IF EXISTS "Authenticated users can view assets" ON public.assets;

CREATE POLICY "Admin/analyst can view assets"
  ON public.assets FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'analyst'::app_role)
  );
