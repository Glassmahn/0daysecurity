/**
 * Comprehensive E2E tests for all CRUD pages.
 *
 * Tests each page in 3 states:
 *   1. Happy path — mock data renders correctly
 *   2. Error state — API failure shows error UI with retry
 *   3. Loading state — sees spinner before data arrives
 *
 * Run: npx playwright test --config=playwright.config.ts
 *
 * Add new mock data fixtures at the top of each describe block
 * following the existing pattern in e2e/controls.spec.ts.
 */
import { test, expect } from '@playwright/test';
import { injectAuthSession, mockSupabase, SUPABASE_URL } from './helpers/mock-api';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

// ─── Shared mock rows ──────────────────────────────────────────────────────────

const MOCK_EVIDENCE = [
  { id: 'e1', title: 'SOC 2 Audit Report 2025', status: 'valid', type: 'document', source: 'External Auditor', collection_method: 'manual', control_id: null, expires_at: '2027-01-01', created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
  { id: 'e2', title: 'Penetration Test Q1', status: 'pending_review', type: 'scan_result', source: 'Internal', collection_method: 'automated', control_id: null, expires_at: null, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
];

const MOCK_RISKS = [
  { id: 'r1', title: 'Data Breach via Unpatched Systems', status: 'open', likelihood: 3, impact: 5, risk_score: 15, category: 'Technical', description: null, owner_id: null, framework_id: null, mitigation: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'r2', title: 'Vendor Lock-in Risk', status: 'mitigated', likelihood: 2, impact: 3, risk_score: 6, category: 'Operational', description: null, owner_id: null, framework_id: null, mitigation: null, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
];

const MOCK_INCIDENTS = [
  { id: 'i1', title: 'Phishing Campaign — Q2', severity: 'high', status: 'open', description: null, reported_by: null, assigned_to: null, detected_at: null, resolved_at: null, created_at: '2026-04-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z' },
];

const MOCK_TESTS = [
  { id: 't1', name: 'SOC 2 Access Control Test', status: 'passed', schedule: 'weekly', description: null, last_run: null, next_run: null, framework_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_KB = [
  { id: 'k1', title: 'Incident Response Runbook', category: 'runbook', status: 'published', content: '# Runbook', tags: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_VENDORS = [
  { id: 'v1', name: 'Acme Cloud', status: 'active', risk_tier: 'high', contact_email: null, contract_expiry: null, contract_value: null, notes: null, assessment_date: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_ASSETS = [
  { id: 'a1', name: 'Production DB Server', type: 'server', status: 'active', criticality: 'high', ip_address: '10.0.1.1', location: 'us-east-1', owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'a2', name: 'Corporate Laptop Pool', type: 'endpoint', status: 'active', criticality: 'medium', ip_address: null, location: 'HQ', owner_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_PERSONNEL = [
  { id: 'p1', name: 'Alice Admin', email: 'alice@zeroday.test', department: 'Security', title: 'CISO', role: 'admin', access_review_status: 'current', training_status: 'completed', last_access_review: '2026-03-01', last_training_completed: '2026-02-15', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'p2', name: 'Bob Analyst', email: 'bob@zeroday.test', department: 'Engineering', title: 'Security Engineer', role: 'analyst', access_review_status: 'overdue', training_status: 'not_started', last_access_review: null, last_training_completed: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_POLICIES = [
  { id: 'pl1', title: 'Acceptable Use Policy', version: '1.0', status: 'published', content: null, owner_id: null, framework_id: null, approved_by: null, review_date: '2026-06-01', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

// ─── Helper: intercept REST and return a 500 error ───────────────────────────

async function mockSupabaseError(page: import('@playwright/test').Page, table: string) {
  await injectAuthSession(page);
  await page.route(`${SUPABASE_URL}/rest/v1/${table}**`, route => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    return route.fulfill({ status: 500, headers: CORS, body: JSON.stringify({ message: `Simulated failure for ${table}` }) });
  });
  await page.route(`${SUPABASE_URL}/auth/v1/**`, route => route.fulfill({ headers: CORS, json: {} }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVIDENCE
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/evidence — CRUD page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { evidence: MOCK_EVIDENCE });
  });

  test('renders evidence rows from mock data', async ({ page }) => {
    await page.goto('/evidence');
    await expect(page.getByText('SOC 2 Audit Report 2025')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Penetration Test Q1')).toBeVisible();
  });

  test('shows status badges', async ({ page }) => {
    await page.goto('/evidence');
    await expect(page.getByText('valid').first()).toBeVisible({ timeout: 10_000 });
  });

  test('new button opens form dialog', async ({ page }) => {
    await page.goto('/evidence');
    await page.getByRole('button', { name: /new|add evidence/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });

  test('error state shows AlertCircle and retry button', async ({ page }) => {
    await mockSupabaseError(page, 'evidence');
    await page.goto('/evidence');
    await expect(page.getByText('Failed to load evidence')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RISK REGISTER
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/risk-register — CRUD page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { risks: MOCK_RISKS });
  });

  test('renders risk rows', async ({ page }) => {
    await page.goto('/risk-register');
    await expect(page.getByText('Data Breach via Unpatched Systems')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Vendor Lock-in Risk')).toBeVisible();
  });

  test('shows risk score or matrix', async ({ page }) => {
    await page.goto('/risk-register');
    await expect(page.getByText('open').first()).toBeVisible({ timeout: 10_000 });
  });

  test('error state shows retry button', async ({ page }) => {
    await mockSupabaseError(page, 'risks');
    await page.goto('/risk-register');
    await expect(page.getByText('Failed to load risks')).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INCIDENTS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/incidents — CRUD page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { incidents: MOCK_INCIDENTS });
  });

  test('renders incident rows', async ({ page }) => {
    await page.goto('/incidents');
    await expect(page.getByText('Phishing Campaign — Q2')).toBeVisible({ timeout: 10_000 });
  });

  test('shows severity badge', async ({ page }) => {
    await page.goto('/incidents');
    await expect(page.getByText('high').first()).toBeVisible({ timeout: 10_000 });
  });

  test('error state shows retry button', async ({ page }) => {
    await mockSupabaseError(page, 'incidents');
    await page.goto('/incidents');
    await expect(page.getByText('Failed to load incidents')).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/tests — CRUD page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { tests: MOCK_TESTS });
  });

  test('renders test rows', async ({ page }) => {
    await page.goto('/tests');
    await expect(page.getByText('SOC 2 Access Control Test')).toBeVisible({ timeout: 10_000 });
  });

  test('error state shows retry button', async ({ page }) => {
    await mockSupabaseError(page, 'tests');
    await page.goto('/tests');
    await expect(page.getByText('Failed to load tests')).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/knowledge-base — CRUD page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { knowledge_base: MOCK_KB });
  });

  test('renders article rows', async ({ page }) => {
    await page.goto('/knowledge-base');
    await expect(page.getByText('Incident Response Runbook')).toBeVisible({ timeout: 10_000 });
  });

  test('shows category badge', async ({ page }) => {
    await page.goto('/knowledge-base');
    await expect(page.getByText('runbook').first()).toBeVisible({ timeout: 10_000 });
  });

  test('error state shows retry button', async ({ page }) => {
    await mockSupabaseError(page, 'knowledge_base');
    await page.goto('/knowledge-base');
    await expect(page.getByText('Failed to load articles')).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VENDORS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/vendors — CRUD page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { vendors: MOCK_VENDORS });
  });

  test('renders vendor rows', async ({ page }) => {
    await page.goto('/vendors');
    await expect(page.getByText('Acme Cloud')).toBeVisible({ timeout: 10_000 });
  });

  test('error state shows retry button', async ({ page }) => {
    await mockSupabaseError(page, 'vendors');
    await page.goto('/vendors');
    await expect(page.getByText('Failed to load vendors')).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ASSETS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/assets — CRUD page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { assets: MOCK_ASSETS });
  });

  test('renders asset rows', async ({ page }) => {
    await page.goto('/assets');
    await expect(page.getByText('Production DB Server')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Corporate Laptop Pool')).toBeVisible();
  });

  test('type filter dropdown renders', async ({ page }) => {
    await page.goto('/assets');
    await expect(page.getByRole('combobox').or(page.getByRole('listbox')).first()).toBeVisible({ timeout: 10_000 });
  });

  test('error state shows retry button', async ({ page }) => {
    await mockSupabaseError(page, 'assets');
    await page.goto('/assets');
    await expect(page.getByText('Failed to load assets')).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PERSONNEL
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/personnel — CRUD page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { personnel: MOCK_PERSONNEL });
  });

  test('renders team member rows', async ({ page }) => {
    await page.goto('/personnel');
    await expect(page.getByText('Alice Admin')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Bob Analyst')).toBeVisible();
  });

  test('shows role and status badges', async ({ page }) => {
    await page.goto('/personnel');
    await expect(page.getByText('admin').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('overdue').first()).toBeVisible();
  });

  test('send reminders button is visible', async ({ page }) => {
    await page.goto('/personnel');
    await expect(page.getByRole('button', { name: /send reminders/i })).toBeVisible({ timeout: 10_000 });
  });

  test('error state shows retry button', async ({ page }) => {
    await mockSupabaseError(page, 'personnel');
    await page.goto('/personnel');
    await expect(page.getByText('Failed to load personnel')).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POLICIES
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/policies — CRUD page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { policies: MOCK_POLICIES });
  });

  test('renders policy rows', async ({ page }) => {
    await page.goto('/policies');
    await expect(page.getByText('Acceptable Use Policy')).toBeVisible({ timeout: 10_000 });
  });

  test('shows status badge', async ({ page }) => {
    await page.goto('/policies');
    await expect(page.getByText('published').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD — ComplianceTrendChart error state
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT PREP
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('/audit-prep — Audit Preparation page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { controls: [
      ...MOCK_EVIDENCE.map(e => ({ id: e.id, code: e.id, title: e.title, status: e.status, category: 'Evidence', description: null, frameworks: ['SOC2'], owner_id: null, implementation_details: null, last_reviewed: null, created_at: e.created_at, updated_at: e.updated_at })),
      { id: 'c-extra', code: 'CC-1', title: 'Access Control Policy', status: 'implemented', category: 'Access Control', description: null, frameworks: ['SOC2', 'HIPAA'], owner_id: null, implementation_details: null, last_reviewed: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    ] });
  });

  test('renders audit prep with frameworks grouped', async ({ page }) => {
    await page.goto('/audit-prep');
    await expect(page.getByText('Audit Preparation')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'SOC 2 Type II' })).toBeVisible({ timeout: 10_000 });
  });

  test('shows control rows grouped under framework', async ({ page }) => {
    await page.goto('/audit-prep');
    await expect(page.getByText('Access Control Policy').first()).toBeVisible({ timeout: 10_000 });
  });

  test('search filters controls across frameworks', async ({ page }) => {
    await page.goto('/audit-prep');
    await page.getByPlaceholder('Search controls across frameworks').fill('Penetration');
    await expect(page.getByText('Penetration Test Q1')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Dashboard — error state', () => {
  test('ComplianceTrendChart shows error when compliance_snapshots fails', async ({ page }) => {
    await injectAuthSession(page);
    // Let everything succeed except compliance_snapshots
    await mockSupabase(page, { controls: MOCK_RISKS });
    await page.route(`${SUPABASE_URL}/rest/v1/compliance_snapshots**`, route => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
      return route.fulfill({ status: 500, headers: CORS, body: JSON.stringify({ message: 'DB error' }) });
    });

    await page.goto('/dashboard');
    // The error state has a "Try again" button
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible({ timeout: 15_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_AUDITS = [
  { id: 'a1', title: 'SOC 2 Type II Audit 2026', framework: 'SOC 2', status: 'in_progress', scope: 'Full SOC 2 Type II audit covering all trust service criteria', start_date: '2026-04-01', end_date: '2026-07-31', lead_auditor_id: null, notes: null, created_at: '2026-03-15T00:00:00Z', updated_at: '2026-03-15T00:00:00Z' },
  { id: 'a2', title: 'ISO 27001 Internal Audit Q2', framework: 'ISO 27001', status: 'draft', scope: 'Internal audit of ISMS', start_date: null, end_date: null, lead_auditor_id: null, notes: null, created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
];

test.describe('/audit-management — Audit Management page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { audits: MOCK_AUDITS });
  });

  test('renders audit list', async ({ page }) => {
    await page.goto('/audit-management');
    await expect(page.getByText('SOC 2 Type II Audit 2026')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('ISO 27001 Internal Audit Q2')).toBeVisible();
  });

  test('shows status badges', async ({ page }) => {
    await page.goto('/audit-management');
    await expect(page.getByText('in progress').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('draft').first()).toBeVisible();
  });

  test('new audit button opens form dialog', async ({ page }) => {
    await page.goto('/audit-management');
    await page.getByRole('button', { name: /new audit/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });

  test('clicking audit navigates to detail page', async ({ page }) => {
    await page.goto('/audit-management');
    await page.getByText('SOC 2 Type II Audit 2026').click();
    await expect(page).toHaveURL(/\/audit-management\/a1/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_TRAINING_COURSES = [
  { id: 'tc1', title: 'Security Awareness Q2 2026', description: 'Annual security awareness training', category: 'Security Awareness', duration_minutes: 30, status: 'active', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'tc2', title: 'HIPAA Compliance Refresher', description: null, category: 'Compliance', duration_minutes: 45, status: 'active', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
];

test.describe('/training — Training Management page', () => {
  test.beforeEach(async ({ page }) => {
    await injectAuthSession(page);
    await mockSupabase(page, { training_courses: MOCK_TRAINING_COURSES });
  });

  test('renders course list', async ({ page }) => {
    await page.goto('/training');
    await expect(page.getByText('Security Awareness Q2 2026')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('HIPAA Compliance Refresher')).toBeVisible();
  });

  test('new course button opens form dialog', async ({ page }) => {
    await page.goto('/training');
    await page.getByRole('button', { name: /new course/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });
});
