-- Fix 1: Restrict vendors SELECT to admin/analyst only
DROP POLICY IF EXISTS "Authenticated users can view vendors" ON public.vendors;

CREATE POLICY "Admin/analyst can view vendors"
  ON public.vendors FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

-- Fix 2: Restrict audit_logs SELECT — admins see all, others see only own entries
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));