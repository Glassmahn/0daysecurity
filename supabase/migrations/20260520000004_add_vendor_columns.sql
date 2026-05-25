ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS data_access TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
