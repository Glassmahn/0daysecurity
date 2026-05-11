/**
 * Production smoke tests — no Supabase mocking.
 * These run against the built SSR server where page.route() cannot intercept
 * server-side fetches. Tests only what is verifiable without auth injection.
 *
 * Run: npx playwright test --config=playwright.prod.config.ts
 */
import { test, expect } from '@playwright/test';

test.describe('Server health', () => {
  test('GET / returns 200 or redirect', async ({ request }) => {
    const res = await request.get('/', { maxRedirects: 0 });
    expect([200, 301, 302, 307, 308]).toContain(res.status());
  });

  test('GET /login returns 200', async ({ request }) => {
    const res = await request.get('/login');
    expect(res.status()).toBe(200);
  });

  test('static assets endpoint responds', async ({ request }) => {
    const res = await request.get('/login');
    const html = await res.text();
    // Built app injects a <script> tag pointing to the JS bundle
    expect(html).toContain('<script');
  });
});

test.describe('Login page', () => {
  test('renders welcome heading', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 8_000 });
  });

  test('shows email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('shows Sign in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible({ timeout: 8_000 });
  });

  test('shows sign-up and forgot-password links', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('empty submit stays on /login (HTML5 required)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForTimeout(400);
    await expect(page).toHaveURL(/\/login/);
  });
});

// Auth guard redirect tests require Supabase network connectivity to resolve
// getSession() before the client-side redirect fires. These are validated in
// the integration suite (npx playwright test --config=playwright.config.ts)
// which mocks Supabase so the guard resolves instantly.

test.describe('Public routes', () => {
  test('/signup page renders', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /create|sign up|get started/i }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('/forgot-password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    // Should render a form of some kind, not crash
    await expect(page.locator('form, input[type="email"]').first()).toBeVisible({ timeout: 8_000 });
  });
});
