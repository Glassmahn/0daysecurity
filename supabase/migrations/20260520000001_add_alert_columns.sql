ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS affected_control_id UUID REFERENCES public.controls(id) ON DELETE SET NULL;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS affected_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL;
