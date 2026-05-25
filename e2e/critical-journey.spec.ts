import { test, expect } from '@playwright/test';
import { injectAuthSession, mockSupabase } from './helpers/mock-api';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

test.describe('Critical user journey: login → dashboard → risk register', () => {
  test('full navigation flow with authenticated session', async ({ page }) => {
    await mockSupabase(page);

    // Inject auth
    await injectAuthSession(page);

    // Navigate to app root (redirects to dashboard when authenticated)
    await page.goto('/');
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText('Compliance Score')).toBeVisible({ timeout: 10000 });

    // Dashboard widgets rendered
    await expect(page.getByText('Controls Passing')).toBeVisible();
    await expect(page.getByRole('heading', { name: /frameworks/i }).first()).toBeVisible();

    // Navigate to risk register via keyboard shortcut
    await page.keyboard.press('g');
    await page.keyboard.press('r');
    await page.waitForURL(/\/risk-register/);
    await expect(page.getByText('Risk Register')).toBeVisible({ timeout: 5000 });

    // Navigate to controls via sidebar
    await page.goto('/controls');
    await page.waitForURL(/\/controls/);
    await expect(page.getByText('Controls')).toBeVisible({ timeout: 5000 });

    // Navigate to incidents
    await page.goto('/incidents');
    await page.waitForURL(/\/incidents/);
    await expect(page.getByText('Incidents')).toBeVisible({ timeout: 5000 });

    // Navigate to assets
    await page.goto('/assets');
    await page.waitForURL(/\/assets/);
    await expect(page.getByText('Assets')).toBeVisible({ timeout: 5000 });

    // Navigate to evidence
    await page.goto('/evidence');
    await page.waitForURL(/\/evidence/);
    await expect(page.getByText('Evidence')).toBeVisible({ timeout: 5000 });
  });
});
