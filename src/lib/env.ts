import { z } from 'zod';

const schema = z.object({
  VITE_SUPABASE_URL: z.string().url('must be a valid URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'required'),
  VITE_SUPABASE_PROJECT_ID: z.string().min(1, 'required'),
});

const result = schema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
});

if (!result.success) {
  const issues = result.error.issues
    .map((i) => `  • ${String(i.path[0])}: ${i.message}`)
    .join('\n');
  throw new Error(
    `Missing or invalid environment variables:\n${issues}\n\nCopy .env.example to .env and fill in your Supabase credentials.`
  );
}

export const env = result.data;
