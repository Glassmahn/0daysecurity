import { test, expect } from '@playwright/test';
import { injectAuthSession, mockSupabase } from './helpers/mock-api';

const MOCK_CONTROLS = [
  { id: 'c1', code: 'CC1.1', title: 'Access Control Policy', status: 'implemented', category: 'Access Control', framework_id: 'f1', description: null, implementation_details: null, last_reviewed: null, owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c2', code: 'CC2.1', title: 'Encryption at Rest', status: 'in_progress', category: 'Data Protection', framework_id: 'f1', description: null, implementation_details: null, last_reviewed: null, owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c3', code: 'CC3.1', title: 'Vulnerability Scanning', status: 'failing', category: 'Monitoring', framework_id: 'f1', description: null, implementation_details: null, last_reviewed: null, owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_FRAMEWORKS = [
  { id: 'f1', name: 'SOC 2', enabled: true, total_controls: 3, passing_controls: 1, score: 33, category: 'Trust Services', description: null, version: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_ALERTS = [
  { id: 'a1', title: 'SSH exposed to internet', severity: 'critical', status: 'open', source: 'AWS', message: null, acknowledged_by: null, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
];

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    // mockSupabase injects an admin role by default so all sidebar links are visible
    await mockSupabase(page, {
      controls: MOCK_CONTROLS,
      frameworks: MOCK_FRAMEWORKS,
      alerts: MOCK_ALERTS,
    });
  });

  test('loads and renders the page heading', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 12_000 });
    // The dashboard page should have a visible heading or KPI area
    await expect(page.getByText(/dashboard|compliance|overview/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('sidebar shows Dashboard link', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: /dashboard/i }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('sidebar shows Controls link', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: /controls/i }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('sidebar shows Alerts link (admin role)', async ({ page }) => {
    // The Alerts link is only rendered for admin and analyst — our mock injects admin role
    await page.goto('/dashboard');
    await expect(page.getByRole('link', { name: /alerts/i }).first()).toBeVisible({ timeout: 8_000 });
  });

  test('navigates to Controls via sidebar link', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /^controls$/i }).first().click();
    await expect(page).toHaveURL(/\/controls/, { timeout: 8_000 });
  });

  test('navigates to Frameworks via sidebar link', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /^frameworks$/i }).first().click();
    await expect(page).toHaveURL(/\/frameworks/, { timeout: 8_000 });
  });

  test('navigates to Reports via sidebar link', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /^reports$/i }).first().click();
    await expect(page).toHaveURL(/\/reports/, { timeout: 8_000 });
  });
});
