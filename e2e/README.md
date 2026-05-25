# E2E Test Framework — ZeroDay Harmony GRC

## Overview

End-to-end tests using [Playwright](https://playwright.dev/) against a mocked Supabase backend. Tests run locally without any external database or network dependencies.

## Quick Start

```bash
# 1. Install Playwright browsers (one-time)
npx playwright install chromium

# 2. Run all E2E tests
npx playwright test

# 3. Run a specific test file
npx playwright test e2e/auth.spec.ts

# 4. Run tests matching a pattern
npx playwright test --grep "evidence"
```

## What's Tested

| Test File | Coverage |
|-----------|----------|
| `auth.spec.ts` | Login, auth guard redirect, sign-out |
| `smoke.spec.ts` | Server health, public page rendering |
| `full-app-audit.spec.ts` | All 15+ routes, JS error detection |
| `dashboard.spec.ts` | Dashboard widgets, sidebar navigation |
| `controls.spec.ts` | Control list, search, navigation |
| `alerts.spec.ts` | Alerts list rendering |
| `reports.spec.ts` | Reports page, generate buttons |
| `all-crud-pages.spec.ts` | All 10 CRUD pages: happy path, error state, loading state |

**Total: 8 spec files, 50+ test cases covering every route in the application.**

## Architecture

```
e2e/
  helpers/
    mock-api.ts     # Supabase mock: inject auth session, intercept REST API
  auth.spec.ts              # Login, auth guard, sign-out
  smoke.spec.ts             # Server health, public page rendering
  full-app-audit.spec.ts    # Authenticated route audit
  dashboard.spec.ts         # Dashboard + sidebar
  controls.spec.ts          # Controls CRUD
  alerts.spec.ts            # Alerts page
  reports.spec.ts           # Reports page
  all-crud-pages.spec.ts    # All remaining CRUD pages (evidence, risk, incidents,
                            # tests, knowledge-base, vendors, assets, personnel, policies)
  README.md
  report/             # HTML report output (after run)
  results/            # Test artifacts (screenshots, traces)
playwright.config.ts  # Playwright configuration
```

## Test Design

Each test file follows the same pattern:

1. **Mock auth**: `injectAuthSession(page)` writes a fake Supabase session to localStorage
2. **Mock data**: `mockSupabase(page, { tableName: mockRows })` intercepts all Supabase REST calls
3. **Test states**: Each page is tested in 3 states:
   - **Happy path**: mock data renders correctly
   - **Error state**: API returns 500 → error UI with AlertCircle + retry button
   - **Loading state**: slow response → skeleton/spinner (default from `useSupabaseCrud`)

## Mock API System

The helper at `e2e/helpers/mock-api.ts` intercepts all Supabase endpoints:

```
SUPABASE_URL (from env or default)
  ├── /auth/v1/user          → returns MOCK_USER
  ├── /auth/v1/token**       → returns MOCK_SESSION
  ├── /auth/v1/logout        → returns 204
  └── /rest/v1/{table}       → returns fixture data for that table
                              or 500 error for error-state tests
```

### Adding a New Test

```typescript
import { test, expect } from '@playwright/test';
import { injectAuthSession, mockSupabase } from './helpers/mock-api';

const MOCK_DATA = [
  { id: '1', name: 'Widget', /* all column values */ },
];

test('my new test', async ({ page }) => {
  await injectAuthSession(page);
  await mockSupabase(page, { my_table: MOCK_DATA });
  await page.goto('/my-page');
  await expect(page.getByText('Widget')).toBeVisible();
});
```

## Configuration

- `playwright.config.ts` — local dev (starts `npm run dev` automatically)
- `playwright.prod.config.ts` — production/staging (set `PLAYWRIGHT_BASE_URL`)

### CI/CD

```bash
# Point to a running instance
export PLAYWRIGHT_BASE_URL=https://staging.example.com
npx playwright test
```

## Viewing Results

After a run, open the HTML report:

```bash
npx playwright show-report e2e/report
```

## Troubleshooting

- **Tests hang on "waiting for selector"**: The dev server may not be ready. Run `npm run dev` in a separate terminal first.
- **"Executable doesn't exist"**: Run `npx playwright install chromium` to download the browser binary.
- **Tests fail on Windows**: Ensure `npm run dev` uses port 8080 (or set `PLAYWRIGHT_BASE_URL` to the correct port).
