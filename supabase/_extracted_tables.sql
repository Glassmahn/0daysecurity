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
