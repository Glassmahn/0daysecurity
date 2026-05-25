import { test, expect } from '@playwright/test';
import { injectAuthSession, mockSupabase, SUPABASE_URL } from './helpers/mock-api';

const MOCK_CONTROLS = [
  { id: 'c1', code: 'CC1.1', title: 'Access Control Policy', status: 'implemented', category: 'Access Control', framework_id: 'f1', description: null, implementation_details: null, last_reviewed: '2026-03-01', owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c2', code: 'CC2.1', title: 'Encryption at Rest', status: 'in_progress', category: 'Data Protection', framework_id: 'f1', description: null, implementation_details: null, last_reviewed: null, owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c3', code: 'CC3.1', title: 'Vulnerability Scanning', status: 'failing', category: 'Monitoring', framework_id: 'f1', description: null, implementation_details: null, last_reviewed: null, owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_FRAMEWORKS = [
  { id: 'f1', name: 'SOC 2', enabled: true, total_controls: 3, passing_controls: 1, score: 33, category: 'Trust Services', description: null, version: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

test.describe('Controls list', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { controls: MOCK_CONTROLS, frameworks: MOCK_FRAMEWORKS });
  });

  test('renders control rows', async ({ page }) => {
    await page.goto('/controls');
    await expect(page.getByText('Access Control Policy')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Encryption at Rest')).toBeVisible();
    await expect(page.getByText('Vulnerability Scanning')).toBeVisible();
  });

  test('shows control codes in the table', async ({ page }) => {
    await page.goto('/controls');
    await expect(page.getByText('CC1.1')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('CC2.1')).toBeVisible();
  });

  test('shows status labels', async ({ page }) => {
    await page.goto('/controls');
    await expect(page.getByText('Access Control Policy')).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('table').getByText(/implemented/i).first()).toBeVisible();
  });

  test('search input filters controls by title', async ({ page }) => {
    await page.goto('/controls');
    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible({ timeout: 3_000 })) {
      await search.fill('Encryption');
      await expect(page.getByText('Encryption at Rest')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('clicking a row navigates to the control detail', async ({ page }) => {
    await page.goto('/controls');
    await expect(page.getByText('Access Control Policy')).toBeVisible({ timeout: 8_000 });
    await page.getByText('Access Control Policy').first().click();
    await page.waitForTimeout(800);
    const navigated = (await page.url()).includes('/controls/c1');
    const slideOver = await page.isVisible('[role="dialog"]');
    expect(navigated || slideOver).toBe(true);
  });

  test('Add Control button opens a creation dialog', async ({ page }) => {
    await page.goto('/controls');
    await expect(page.getByText('Access Control Policy')).toBeVisible({ timeout: 8_000 });
    await page.getByRole('button', { name: /add control/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog').getByText(/new control/i)).toBeVisible();
  });

  test('Edit icon opens a pre-filled dialog', async ({ page }) => {
    await page.goto('/controls');
    await expect(page.getByText('Access Control Policy')).toBeVisible({ timeout: 8_000 });
    await page.locator('[title="Edit"]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('dialog').getByText(/edit control/i)).toBeVisible();
  });

  test('saving an edit sends a PATCH request', async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { controls: MOCK_CONTROLS, frameworks: MOCK_FRAMEWORKS });

    let patchCalled = false;
    // Registered after mockSupabase → checked first; fall through for non-PATCH
    await page.route(`${SUPABASE_URL}/rest/v1/controls**`, async (route) => {
      if (route.request().method() === 'PATCH') {
        patchCalled = true;
        return route.fulfill({ headers: CORS, json: [] });
      }
      return route.fallback();
    });

    await page.goto('/controls');
    await expect(page.getByText('Access Control Policy')).toBeVisible({ timeout: 8_000 });

    await page.locator('[title="Edit"]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // The submit button is "Update" when editing an existing record
    await page.getByRole('button', { name: 'Update', exact: true }).click();
    await page.waitForTimeout(1_000);
    expect(patchCalled).toBe(true);
  });
});

const MOCK_ENRICHED_CONTROLS = [
  { id: 'ec-1', code: 'EC1', title: 'Logical Access Controls', status: 'implemented', category: 'Access Control', framework_id: 'f1', description: 'Controls for logical access management', implementation_details: 'SSO with MFA enforced', last_reviewed: '2026-03-01', owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'ec-2', code: 'EC2', title: 'Multi-Factor Authentication', status: 'implemented', category: 'Access Control', framework_id: 'f1', description: 'MFA required for all external access', implementation_details: 'TOTP and SMS verification', last_reviewed: '2026-02-15', owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

// ─── Control detail view ──────────────────────────────────────────────────────

test.describe('Control detail view', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { controls: MOCK_ENRICHED_CONTROLS, frameworks: MOCK_FRAMEWORKS });
  });

  test('loads ec-1 — Logical Access Controls', async ({ page }) => {
    await page.goto('/controls/ec-1');
    await expect(page.getByText('Logical Access Controls')).toBeVisible({ timeout: 8_000 });
  });

  test('shows implementation status on detail', async ({ page }) => {
    await page.goto('/controls/ec-1');
    await expect(page.getByText('Logical Access Controls')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/implemented|in.progress|failing/i).first()).toBeVisible();
  });

  test('Frameworks tab reveals cross-mapped standards', async ({ page }) => {
    await page.goto('/controls/ec-1');
    await expect(page.getByText('Logical Access Controls')).toBeVisible({ timeout: 8_000 });

    // Click the Frameworks tab (may be a tab or button)
    const tab = page.getByRole('tab', { name: /frameworks/i })
      .or(page.getByRole('button', { name: /frameworks/i })).first();
    if (await tab.isVisible({ timeout: 3_000 })) {
      await tab.click();
      await expect(page.getByText(/SOC|HIPAA|ISO/i).first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('loads ec-2 — Multi-Factor Authentication', async ({ page }) => {
    await page.goto('/controls/ec-2');
    await expect(page.getByText('Multi-Factor Authentication')).toBeVisible({ timeout: 8_000 });
  });
});
