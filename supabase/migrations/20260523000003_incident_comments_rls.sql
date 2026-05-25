-- Add RLS policies for incident_comments table
-- incident_comments has an incident_id FK but no direct org_id column.
-- We infer org_id through the parent incident.

CREATE POLICY "incident_comments_select" ON public.incident_comments FOR SELECT USING (
  incident_id IN (
    SELECT id FROM public.incidents WHERE org_id IN (
      SELECT org_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "incident_comments_insert" ON public.incident_comments FOR INSERT WITH CHECK (
  incident_id IN (
    SELECT id FROM public.incidents WHERE org_id IN (
      SELECT org_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
  AND user_id = auth.uid()
);

CREATE POLICY "incident_comments_update" ON public.incident_comments FOR UPDATE USING (
  incident_id IN (
    SELECT id FROM public.incidents WHERE org_id IN (
      SELECT org_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
  AND user_id = auth.uid()
);

CREATE POLICY "incident_comments_delete" ON public.incident_comments FOR DELETE USING (
  incident_id IN (
    SELECT id FROM public.incidents WHERE org_id IN (
      SELECT org_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  )
  AND (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ))
);
