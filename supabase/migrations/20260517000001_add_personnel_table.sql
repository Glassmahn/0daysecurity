-- Fix 1: Add 'in_progress' to controls status check constraint
ALTER TABLE public.controls DROP CONSTRAINT IF EXISTS controls_status_check;
ALTER TABLE public.controls ADD CONSTRAINT controls_status_check
  CHECK (status = ANY (ARRAY[
    'implemented', 'partially_implemented', 'not_implemented',
    'not_applicable', 'not_started', 'in_progress', 'failing'
  ]));

-- Fix 2: Create missing training tables
CREATE TABLE IF NOT EXISTS public.training_courses (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL,
  description   text,
  category      text,
  duration_minutes integer,
  status        text        NOT NULL DEFAULT 'active',
  content       jsonb       DEFAULT '{"sections": []}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_assignments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid        NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'assigned',
  completed_at  timestamptz,
  score         integer,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.training_quiz_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     uuid NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  question      text NOT NULL,
  options       jsonb NOT NULL,
  correct_index int NOT NULL,
  explanation   text
);

CREATE TABLE IF NOT EXISTS public.training_quiz_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.training_assignments(id) ON DELETE CASCADE,
  answers       jsonb NOT NULL,
  score         int NOT NULL,
  passed        boolean NOT NULL,
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

CREATE TABLE IF NOT EXISTS public.organization_settings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL DEFAULT '',
  industry        text NOT NULL DEFAULT '',
  slug            text NOT NULL UNIQUE DEFAULT '',
  primary_contact text NOT NULL DEFAULT '',
  logo_url        text,
  plan            text NOT NULL DEFAULT 'enterprise',
  settings        jsonb DEFAULT '{}',
  updated_by      uuid REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for training tables
DROP POLICY IF EXISTS "Anyone can view training courses" ON public.training_courses;
CREATE POLICY "Anyone can view training courses"
  ON public.training_courses FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can view own assignments" ON public.training_assignments;
CREATE POLICY "Users can view own assignments"
  ON public.training_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view quiz questions" ON public.training_quiz_questions;
CREATE POLICY "Anyone can view quiz questions"
  ON public.training_quiz_questions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can view own attempts" ON public.training_quiz_attempts;
CREATE POLICY "Users can view own attempts"
  ON public.training_quiz_attempts FOR SELECT
  TO authenticated
  USING (assignment_id IN (
    SELECT id FROM public.training_assignments WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Admins can manage organization_settings" ON public.organization_settings;
CREATE POLICY "Admins can manage organization_settings"
  ON public.organization_settings
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for organization_settings updated_at
DROP TRIGGER IF EXISTS handle_organization_settings_updated_at ON public.organization_settings;
CREATE TRIGGER handle_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- Fix 3: Create personnel table
CREATE TABLE IF NOT EXISTS public.personnel (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text        NOT NULL,
  email                  text        NOT NULL DEFAULT '',
  department             text,
  title                  text,
  role                   text        NOT NULL DEFAULT 'viewer',
  access_review_status   text        NOT NULL DEFAULT 'current' CHECK (access_review_status IN ('current', 'pending', 'overdue')),
  training_status        text        NOT NULL DEFAULT 'not_started' CHECK (training_status IN ('completed', 'in_progress', 'overdue', 'not_started')),
  last_access_review     timestamptz,
  last_training_completed timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view personnel" ON public.personnel;
CREATE POLICY "Authenticated users can view personnel"
  ON public.personnel FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage personnel" ON public.personnel;
CREATE POLICY "Admins can manage personnel"
  ON public.personnel FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS handle_personnel_updated_at ON public.personnel;
CREATE TRIGGER handle_personnel_updated_at
  BEFORE UPDATE ON public.personnel
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
