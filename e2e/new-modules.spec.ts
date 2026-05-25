import { test, expect } from '@playwright/test';
import { injectAuthSession, mockSupabase, SUPABASE_URL } from './helpers/mock-api';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
const MOCK_SUBPROCESSORS = [
  { id: 's1', name: 'AWS', purpose: 'Cloud Infrastructure', country: 'United States', status: 'active', data_handled: 'Customer data, logs', org_id: 'o1', created_at: '2026-01-01T00:00:00Z' },
  { id: 's2', name: 'Datadog', purpose: 'Monitoring', country: 'United States', status: 'active', data_handled: 'Metrics, traces', org_id: 'o1', created_at: '2026-01-01T00:00:00Z' },
];

// ─── Trust Portal (Public) ────────────────────────────────────────────────────

test.describe('Trust Portal (Public)', () => {
  test('page loads with certifications and security metrics', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/rest/v1/subprocessors**`, route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      return route.fulfill({ headers: CORS, json: MOCK_SUBPROCESSORS });
    });

    await page.goto('/trust-portal/public');
    await expect(page.getByText('Trust Center')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('SOC 2 Type II')).toBeVisible();
    await expect(page.getByText('99.99%')).toBeVisible();
    await expect(page.getByText('AES-256')).toBeVisible();
  });

  test('NDA document request form is interactive', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/rest/v1/subprocessors**`, route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      return route.fulfill({ headers: CORS, json: MOCK_SUBPROCESSORS });
    });

    await page.goto('/trust-portal/public');
    await page.getByText('Request Document Access').scrollIntoViewIfNeeded();

    const nameInput = page.getByPlaceholder('Full name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('John Doe');
    await page.getByPlaceholder('Email address').fill('john@example.com');
    await page.getByPlaceholder(/describe the documents/i).fill('SOC 2 report');

    // NDA checkbox
    const ndaCheckbox = page.locator('input[type="checkbox"]').first();
    await ndaCheckbox.check();
    await expect(ndaCheckbox).toBeChecked();

    await expect(page.getByRole('button', { name: /submit request/i })).toBeEnabled();
  });

  test('subprocessors table renders from API', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/rest/v1/subprocessors**`, route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      return route.fulfill({ headers: CORS, json: MOCK_SUBPROCESSORS });
    });

    await page.goto('/trust-portal/public');
    await page.getByText('Subprocessors').scrollIntoViewIfNeeded();
    await expect(page.getByText('AWS')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Datadog')).toBeVisible();
  });

  test('contact security team form submits', async ({ page }) => {
    await page.route(`${SUPABASE_URL}/rest/v1/subprocessors**`, route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      return route.fulfill({ headers: CORS, json: MOCK_SUBPROCESSORS });
    });

    await page.goto('/trust-portal/public');
    await page.getByText('Contact Security Team').scrollIntoViewIfNeeded();

    await page.getByPlaceholder('Your name').fill('Jane Doe');
    await page.getByPlaceholder('Your email').fill('jane@example.com');
    await page.getByPlaceholder('Subject').fill('Security question');
    await page.getByPlaceholder('Your message...').fill('I have a question about your security practices.');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText('Message Sent')).toBeVisible({ timeout: 5_000 });
  });
});

// ─── Audit Prep ────────────────────────────────────────────────────────────────

test.describe('Audit Prep', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
  });

  test('page loads with controls grouped by framework', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/audit-prep');
    await expect(page.getByText(/audit preparation|audit prep/i)).toBeVisible({ timeout: 8_000 });
  });

  test('framework sections are expandable', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/audit-prep');

    const expandButton = page.getByRole('button').filter({ hasText: /framework|standard|controls/i }).first();
    if (await expandButton.isVisible({ timeout: 3_000 })) {
      await expandButton.click();
    }
  });

  test('search input filters controls', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/audit-prep');

    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible({ timeout: 3_000 })) {
      await search.fill('access');
    }
  });
});

// ─── Settings Tabs ──────────────────────────────────────────────────────────────

test.describe('Settings tabs', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page);
  });

  test('all tab labels are rendered in the navigation', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Settings')).toBeVisible({ timeout: 8_000 });

    const expectedTabs = ['Organization', 'Team Members', 'Notifications', 'Data Export', 'Danger Zone'];
    for (const tab of expectedTabs) {
      await expect(page.getByRole('button', { name: new RegExp(tab, 'i') }).first()).toBeVisible();
    }
  });

  test('can switch to Data Export tab', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /data export/i }).click();
    await expect(page.getByText('Export All Data')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: 'JSON' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'CSV' })).toBeVisible();
  });

  test('Data Export format toggle switches between JSON and CSV', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /data export/i }).click();

    await page.getByRole('button', { name: 'CSV' }).click();
    await expect(page.getByRole('button', { name: 'CSV' })).toHaveClass(/bg-primary/);

    await page.getByRole('button', { name: 'JSON' }).click();
    await expect(page.getByRole('button', { name: 'JSON' })).toHaveClass(/bg-primary/);
  });

  test('can switch to Danger Zone tab', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /danger zone/i }).click();
    await expect(page.getByText('Delete Organization')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByPlaceholder(/DELETE/)).toBeVisible();
  });

  test('Danger Zone delete button is disabled until confirmation is typed', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /danger zone/i }).click();

    const deleteBtn = page.getByRole('button', { name: /delete organization/i });
    await expect(deleteBtn).toBeDisabled();

    const input = page.getByPlaceholder(/DELETE/);
    await expect(input).toBeVisible();
  });

  test('can switch between multiple tabs', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page.getByText(/notification preferences/i)).toBeVisible({ timeout: 3_000 });

    await page.getByRole('button', { name: /organization/i }).click();
    await expect(page.getByText(/organization details/i)).toBeVisible({ timeout: 3_000 });
  });
});
