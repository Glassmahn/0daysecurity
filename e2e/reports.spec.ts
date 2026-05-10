import { test, expect } from '@playwright/test';
import { injectAuthSession, mockSupabase } from './helpers/mock-api';

const MOCK_CONTROLS = [
  { id: 'c1', code: 'CC1.1', title: 'Access Control Policy', status: 'implemented', category: 'Access Control', framework_id: 'f1', description: null, implementation_details: null, last_reviewed: null, owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c2', code: 'CC2.1', title: 'Encryption at Rest', status: 'in_progress', category: 'Data Protection', framework_id: 'f1', description: null, implementation_details: null, last_reviewed: null, owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_FRAMEWORKS = [
  { id: 'f1', name: 'SOC 2', enabled: true, total_controls: 2, passing_controls: 1, score: 50, category: 'Trust Services', description: null, version: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

// exportToCsv bails on empty arrays, so we need at least one row for CSV tests.
const MOCK_EVIDENCE = [
  { id: 'ev1', title: 'AWS Config Export', type: 'config_export', status: 'valid', source: 'AWS', expires_at: '2026-12-01', collected_at: '2026-05-01', control_id: 'c1', uploaded_by: null, file_url: null, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
  { id: 'ev2', title: 'Okta MFA Report', type: 'api_pull', status: 'expiring_soon', source: 'Okta', expires_at: '2026-05-20', collected_at: '2026-04-01', control_id: 'c2', uploaded_by: null, file_url: null, created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z' },
];

test.describe('Reports page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, {
      controls: MOCK_CONTROLS,
      frameworks: MOCK_FRAMEWORKS,
      alerts: [],
      risks: [],
      evidence: MOCK_EVIDENCE,
    });
  });

  test('renders report template cards', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Compliance Summary' })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('heading', { name: 'Control Status Report' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Risk Assessment' })).toBeVisible();
  });

  test('shows Generate PDF and Export CSV buttons', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Compliance Summary' })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /generate pdf/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /export csv/i }).first()).toBeVisible();
  });

  test('shows format badges (PDF, CSV)', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Compliance Summary' })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/^pdf$/i).first()).toBeVisible();
    await expect(page.getByText(/^csv$/i).first()).toBeVisible();
  });

  test('Scheduled Reports section lists recurring reports', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByText('Scheduled Reports')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/weekly|monthly|daily|quarterly/i).first()).toBeVisible();
  });

  test('Compliance Summary Generate PDF triggers a file download', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Compliance Summary' })).toBeVisible({ timeout: 8_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByRole('button', { name: /generate pdf/i }).first().click();

    const dl = await downloadPromise;
    expect(dl.suggestedFilename()).toMatch(/compliance-summary.*\.pdf$/i);
  });

  test('Evidence Coverage Export CSV triggers a file download', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Evidence Coverage Report' })).toBeVisible({ timeout: 8_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });

    // Evidence Coverage card is rpt-3 (3rd card) — "Export CSV" button
    await page.locator('.bg-card')
      .filter({ has: page.getByRole('heading', { name: 'Evidence Coverage Report' }) })
      .getByRole('button', { name: /export csv/i })
      .click();

    const dl = await downloadPromise;
    expect(dl.suggestedFilename()).toMatch(/evidence-coverage.*\.csv$/i);
  });

  test('Risk Assessment Generate PDF triggers a file download', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: 'Risk Assessment' })).toBeVisible({ timeout: 8_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });

    await page.locator('.bg-card')
      .filter({ has: page.getByRole('heading', { name: 'Risk Assessment' }) })
      .getByRole('button', { name: /generate pdf/i })
      .click();

    const dl = await downloadPromise;
    expect(dl.suggestedFilename()).toMatch(/risk-assessment.*\.pdf$/i);
  });
});
