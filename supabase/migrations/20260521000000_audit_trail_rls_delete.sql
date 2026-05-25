-- Audit Trail: explicitly prevent DELETE on audit_logs (immutable by design)
-- RLS already blocks DELETE by default when no policy exists, but this makes
-- the intent explicit and prevents future policy changes from allowing deletes.

CREATE POLICY "prevent_delete_audit_logs" ON public.audit_logs
  FOR DELETE USING (false);
