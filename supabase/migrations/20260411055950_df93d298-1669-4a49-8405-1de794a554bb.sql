
-- Drop the overly permissive policy
DROP POLICY "Authenticated users can manage alerts" ON public.alerts;

-- Replace with role-restricted write access
CREATE POLICY "Admins/analysts can manage alerts"
  ON public.alerts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
