import { defineConfig, devices } from '@playwright/test';

/**
 * Production smoke test config.
 * Runs against the built SSR server (dist/server/index.js) — no Vite dev server.
 * Does NOT use Supabase route mocking (server-side fetches bypass page.route()).
 * Use `npx playwright test --config=playwright.prod.config.ts` to run.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/smoke.spec.ts',
  workers: 1,
  use: {
    baseURL: 'http://localhost:8080',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
