
ALTER TABLE public.knowledge_base
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
) STORED;

CREATE INDEX idx_knowledge_base_fts ON public.knowledge_base USING GIN (search_vector);
