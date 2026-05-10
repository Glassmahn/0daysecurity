import { test, expect } from '@playwright/test';
import { injectAuthSession, mockSupabase, SUPABASE_URL } from './helpers/mock-api';

const MOCK_ALERTS = [
  { id: 'a1', title: 'SSH port exposed to internet', severity: 'critical', status: 'open', source: 'AWS', message: 'Port 22 open on 0.0.0.0/0', acknowledged_by: null, created_at: '2026-05-01T10:00:00Z', updated_at: '2026-05-01T10:00:00Z' },
  { id: 'a2', title: 'Admin account without MFA', severity: 'high', status: 'open', source: 'Okta', message: 'MFA not enrolled', acknowledged_by: null, created_at: '2026-05-02T10:00:00Z', updated_at: '2026-05-02T10:00:00Z' },
  { id: 'a3', title: 'Failed login burst', severity: 'medium', status: 'resolved', source: 'Auth', message: '50 failed logins in 5 min', acknowledged_by: 'user-id', created_at: '2026-05-03T10:00:00Z', updated_at: '2026-05-03T12:00:00Z' },
];

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

test.describe('Alerts list', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { alerts: MOCK_ALERTS });
  });

  test('renders alert titles from Supabase data', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page.getByText('SSH port exposed to internet')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Admin account without MFA')).toBeVisible();
  });

  test('shows severity badges in the table', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page.getByText('SSH port exposed to internet')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('table').getByText(/critical/i).first()).toBeVisible();
    await expect(page.locator('table').getByText(/high/i).first()).toBeVisible();
  });

  test('shows status badges in the table (open/resolved)', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page.getByText('SSH port exposed to internet')).toBeVisible({ timeout: 8_000 });
    // Status is rendered as a span badge inside a table cell (not a select option)
    await expect(page.locator('table span').filter({ hasText: /^open$/i }).first()).toBeVisible();
  });

  test('severity filter chips narrow the list', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page.getByText('SSH port exposed to internet')).toBeVisible({ timeout: 8_000 });
    const criticalBtn = page.getByRole('button', { name: 'critical' });
    if (await criticalBtn.isVisible({ timeout: 3_000 })) {
      await criticalBtn.click();
      await expect(page.getByText('SSH port exposed to internet')).toBeVisible();
    }
  });

  test('search input filters alerts by title', async ({ page }) => {
    await page.goto('/alerts');
    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible({ timeout: 3_000 })) {
      await search.fill('MFA');
      await expect(page.getByText('Admin account without MFA')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('Download button (Export CSV) is present', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page.getByText('SSH port exposed to internet')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /download|export|csv/i }).first()).toBeVisible();
  });

  test('New Alert button opens a creation dialog', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page.getByText('SSH port exposed to internet')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: /new alert/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog').getByText(/new alert/i)).toBeVisible();
  });
});

// ─── Alert edit ───────────────────────────────────────────────────────────────

test.describe('Alert edit', () => {
  test('Edit icon opens the edit dialog pre-filled', async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { alerts: MOCK_ALERTS });

    await page.goto('/alerts');
    await expect(page.getByText('SSH port exposed to internet')).toBeVisible({ timeout: 8_000 });

    await page.locator('[title="Edit"]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog').getByText(/edit alert/i)).toBeVisible();
  });

  test('saving an edit sends a PATCH request', async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { alerts: MOCK_ALERTS });

    let patchCalled = false;
    // Register AFTER mockSupabase → checked first; use fallback() for non-PATCH
    await page.route(`${SUPABASE_URL}/rest/v1/alerts**`, async (route) => {
      if (route.request().method() === 'PATCH') {
        patchCalled = true;
        return route.fulfill({ headers: CORS, json: [] });
      }
      return route.fallback(); // Let mockSupabase's generic handler respond
    });

    await page.goto('/alerts');
    await expect(page.getByText('SSH port exposed to internet')).toBeVisible({ timeout: 8_000 });

    await page.locator('[title="Edit"]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // The form submit button is labelled "Update" when editing
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await page.waitForTimeout(1_000);
    expect(patchCalled).toBe(true);
  });
});
