import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// Standalone config — does not inherit the lovable/cloudflare production plugins.
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    // Satisfy env.ts Zod validation at import time during tests.
    'import.meta.env.VITE_SUPABASE_URL': '"https://test.supabase.co"',
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '"test-anon-key-for-vitest-only"',
    'import.meta.env.VITE_SUPABASE_PROJECT_ID': '"test"',
    'import.meta.env.DEV': 'false',
    'import.meta.env.MODE': '"test"',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/components/**', 'src/hooks/**'],
      exclude: ['src/lib/mock-data*.ts', 'src/integrations/**'],
    },
  },
});
