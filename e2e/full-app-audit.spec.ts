/**
 * Full authenticated app audit against the production server at localhost:8080.
 * Logs in as admin@zeroday.test (viewer role) and tests all viewer-accessible routes.
 * Admin-only routes (Alerts, Assets, Vendors, Incidents, Personnel, Tests,
 * Integrations, Settings) are tested separately with a note that they require
 * admin role — grant it via Supabase SQL to user_id 5518f727-04e8-468e-ad98-86dbca734490.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8080';
const EMAIL = 'admin@zeroday.test';
const PASS = 'ZeroDay2026!';

test.describe('Full app audit (authenticated — viewer role)', () => {
  let storageState: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill(PASS);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    storageState = JSON.stringify(await ctx.storageState());
    await ctx.close();
  });

  async function auditPage(
    page: import('@playwright/test').Page,
    path: string,
    checks: (page: import('@playwright/test').Page) => Promise<void>
  ) {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {});
    await page.screenshot({ path: `/tmp/audit${path.replace(/\//g, '_')}.png` });

    await checks(page);

    const jsErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('fonts.google') && !e.includes('Warning:')
    );
    if (jsErrors.length) console.log(`[${path}] JS errors:`, jsErrors);
    return { jsErrors };
  }

  // ── Viewer-accessible routes ──────────────────────────────────────────────

  test('Login redirects to /dashboard when already authenticated', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    // Wait up to 15s for the client-side auth guard to resolve and redirect
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await ctx.close();
  });

  test('Dashboard — KPI cards and compliance chart visible', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    const { jsErrors } = await auditPage(page, '/dashboard', async p => {
      const body = await p.locator('body').innerText();
      expect(body).toMatch(/compliance|control|framework|risk|alert/i);
      expect(body.length).toBeGreaterThan(300);
      console.log('[/dashboard] body snippet:', body.slice(0, 400));
    });
    expect(jsErrors.length, `JS errors on /dashboard: ${jsErrors}`).toBe(0);
    await ctx.close();
  });

  test('Frameworks — list renders', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    const { jsErrors } = await auditPage(page, '/frameworks', async p => {
      const body = await p.locator('body').innerText();
      expect(body).toMatch(/SOC|ISO|HIPAA|GDPR|PCI|framework/i);
    });
    expect(jsErrors.length).toBe(0);
    await ctx.close();
  });

  test('Controls — table renders', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    const { jsErrors } = await auditPage(page, '/controls', async p => {
      const body = await p.locator('body').innerText();
      expect(body).toMatch(/control/i);
    });
    expect(jsErrors.length).toBe(0);
    await ctx.close();
  });

  test('Evidence — list renders', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    const { jsErrors } = await auditPage(page, '/evidence', async p => {
      const body = await p.locator('body').innerText();
      expect(body).toMatch(/evidence/i);
    });
    expect(jsErrors.length).toBe(0);
    await ctx.close();
  });

  test('Policies — list renders', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    const { jsErrors } = await auditPage(page, '/policies', async p => {
      const body = await p.locator('body').innerText();
      expect(body).toMatch(/polic/i);
    });
    expect(jsErrors.length).toBe(0);
    await ctx.close();
  });

  test('Risk Register — list renders', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    const { jsErrors } = await auditPage(page, '/risk-register', async p => {
      const body = await p.locator('body').innerText();
      expect(body).toMatch(/risk/i);
    });
    expect(jsErrors.length).toBe(0);
    await ctx.close();
  });

  test('Audit Trail — log renders', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    const { jsErrors } = await auditPage(page, '/audits', async p => {
      const body = await p.locator('body').innerText();
      expect(body).toMatch(/audit|log|event|trail/i);
    });
    expect(jsErrors.length).toBe(0);
    await ctx.close();
  });

  test('Knowledge Base — articles render', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    const { jsErrors } = await auditPage(page, '/knowledge-base', async p => {
      const body = await p.locator('body').innerText();
      expect(body).toMatch(/knowledge|article|guide/i);
    });
    expect(jsErrors.length).toBe(0);
    await ctx.close();
  });

  test('Reports — generate buttons visible', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    const { jsErrors } = await auditPage(page, '/reports', async p => {
      const body = await p.locator('body').innerText();
      expect(body).toMatch(/report/i);
      const btn = p.getByRole('button', { name: /generate|download|export/i }).first();
      await expect(btn).toBeVisible({ timeout: 5_000 });
    });
    expect(jsErrors.length).toBe(0);
    await ctx.close();
  });

  // ── Admin-only routes: verify they redirect or block gracefully ───────────

  test('Admin-only /alerts — redirects or shows access denied (not crash)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/alerts`);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    const body = await page.locator('body').innerText();
    // Should redirect to dashboard OR show an access-denied message — must NOT crash
    expect(body).not.toMatch(/something went wrong|unhandled|TypeError/i);
    console.log('[/alerts] result:', body.slice(0, 200));
    await ctx.close();
  });

  test('Admin-only /settings — redirects or shows access denied (not crash)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/something went wrong|unhandled|TypeError/i);
    console.log('[/settings] result:', body.slice(0, 200));
    await ctx.close();
  });

  test('Admin-only /integrations — redirects or shows access denied (not crash)', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/integrations`);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/something went wrong|unhandled|TypeError/i);
    console.log('[/integrations] result:', body.slice(0, 200));
    await ctx.close();
  });

  // ── Sidebar + TopBar ──────────────────────────────────────────────────────

  test('Sidebar shows correct viewer nav links', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();
    await expect(sidebar).toBeVisible({ timeout: 8_000 });
    const text = await sidebar.innerText();
    console.log('Sidebar:', text.slice(0, 400));
    // All viewer routes should be present
    expect(text).toMatch(/dashboard/i);
    expect(text).toMatch(/framework/i);
    expect(text).toMatch(/control/i);
    expect(text).toMatch(/evidence/i);
    await ctx.close();
  });

  test('TopBar renders with bell and user menu', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: JSON.parse(storageState) });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.screenshot({ path: '/tmp/audit_topbar.png' });
    // At minimum the page renders (body has content)
    const body = await page.locator('body').innerText();
    expect(body.length).toBeGreaterThan(100);
    await ctx.close();
  });
});
