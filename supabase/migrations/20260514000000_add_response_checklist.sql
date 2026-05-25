ALTER TABLE incidents ADD COLUMN IF NOT EXISTS response_checklist JSONB DEFAULT '{}'::jsonb;
