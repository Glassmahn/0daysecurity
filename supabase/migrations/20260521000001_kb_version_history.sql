-- Knowledge Base: add version_history JSONB, framework_ids and control_ids arrays
ALTER TABLE public.knowledge_base
  ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS framework_ids text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS control_ids text[] DEFAULT '{}';
