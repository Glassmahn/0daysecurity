import { test, expect } from '@playwright/test';
import { injectAuthSession, mockSupabase, SUPABASE_URL, MOCK_USER, MOCK_SESSION } from './helpers/mock-api';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

// ─── Login page UI ────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test('renders the login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });

  test('shows a link to the sign-up page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('shows a forgot-password link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('stays on /login when submitted empty (HTML5 required)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForTimeout(400);
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows an error message for invalid credentials', async ({ page }) => {
    // Block OPTIONS preflight then return 400 for the token endpoint
    await page.route(`${SUPABASE_URL}/auth/v1/token**`, route => {
      if (route.request().method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS });
      }
      return route.fulfill({
        status: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      });
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('bad@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // Supabase surfaces the error via setError(); match anything that could be an error div
    await expect(
      page.locator('[class*="destructive"]').or(page.locator('[class*="error"]')).first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects to /dashboard after successful login', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/auth/v1/token**`, route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      return route.fulfill({ headers: CORS, json: MOCK_SESSION });
    });
    await page.route(`${SUPABASE_URL}/auth/v1/user`, route =>
      route.fulfill({ headers: CORS, json: MOCK_USER }),
    );
    await page.route(`${SUPABASE_URL}/rest/v1/**`, route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      return route.fulfill({ headers: CORS, json: [] });
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 12_000 });
  });
});

// ─── Auth guard ───────────────────────────────────────────────────────────────

test.describe('Auth guard', () => {
  test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/auth/v1/**`, route =>
      route.fulfill({ status: 401, headers: CORS, json: { message: 'JWT expired' } }),
    );
    await page.route(`${SUPABASE_URL}/rest/v1/**`, route => route.fulfill({ headers: CORS, json: [] }));

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test('redirects unauthenticated users from /controls to /login', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/auth/v1/**`, route =>
      route.fulfill({ status: 401, headers: CORS, json: { message: 'JWT expired' } }),
    );
    await page.route(`${SUPABASE_URL}/rest/v1/**`, route => route.fulfill({ headers: CORS, json: [] }));

    await page.goto('/controls');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});

// ─── Sign-out ─────────────────────────────────────────────────────────────────

test.describe('Sign-out', () => {
  test('signs the user out via the TopBar dropdown', async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 12_000 });

    // The avatar dropdown trigger contains the user's display name derived from email.
    // Our mock user email is test@example.com → display name = "test"
    const trigger = page.getByRole('button').filter({ hasText: 'test' }).first();
    await expect(trigger).toBeVisible({ timeout: 5_000 });
    await trigger.click();

    await page.getByRole('menuitem', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});
