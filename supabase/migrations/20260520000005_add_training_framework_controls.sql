ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS framework_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.training_courses ADD COLUMN IF NOT EXISTS control_ids TEXT[] DEFAULT '{}';
