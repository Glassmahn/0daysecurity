-- Add version_history JSONB column to policies for tracking version changes
ALTER TABLE public.policies
  ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;

-- Also add to knowledge_base for article version tracking
ALTER TABLE public.knowledge_base
  ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;
