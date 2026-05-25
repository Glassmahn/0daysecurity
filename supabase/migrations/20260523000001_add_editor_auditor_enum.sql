-- Add editor and auditor values to the app_role enum
-- Must be run OUTSIDE a transaction (ALTER TYPE ... ADD VALUE cannot be in a transaction block)
-- This migration is designed to be run with supabase migration up --no-transaction

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'auditor';
