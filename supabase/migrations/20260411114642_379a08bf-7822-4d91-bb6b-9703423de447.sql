
CREATE TABLE public.kb_article_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.knowledge_base(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  status TEXT,
  changed_by UUID,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kb_article_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view article versions"
  ON public.kb_article_versions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins/analysts can manage article versions"
  ON public.kb_article_versions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

CREATE INDEX idx_kb_versions_article ON public.kb_article_versions (article_id, version_number DESC);

-- Add version counter to knowledge_base
ALTER TABLE public.knowledge_base ADD COLUMN current_version INTEGER NOT NULL DEFAULT 1;

-- Trigger to snapshot old version before update
CREATE OR REPLACE FUNCTION public.snapshot_kb_article_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only snapshot if title or content actually changed
  IF OLD.title IS DISTINCT FROM NEW.title OR OLD.content IS DISTINCT FROM NEW.content
     OR OLD.category IS DISTINCT FROM NEW.category OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.kb_article_versions (article_id, version_number, title, content, category, status, changed_by)
    VALUES (OLD.id, OLD.current_version, OLD.title, OLD.content, OLD.category, OLD.status, auth.uid());

    NEW.current_version := OLD.current_version + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER kb_article_version_snapshot
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_kb_article_version();
