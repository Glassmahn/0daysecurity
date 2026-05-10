import type { Page, Route } from '@playwright/test';

const PROJECT_REF = process.env.VITE_SUPABASE_PROJECT_ID ?? 'meueuzgxtjnjyqjhbuql';
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? `https://${PROJECT_REF}.supabase.co`;

const FAKE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  Buffer.from(JSON.stringify({ sub: 'test-user-id', email: 'test@example.com', role: 'authenticated', exp: 9999999999 })).toString('base64').replace(/=/g, '') +
  '.fake-sig';

export const MOCK_USER = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'authenticated',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  aud: 'authenticated',
};

export const MOCK_SESSION = {
  access_token: FAKE_TOKEN,
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 9999999999,
  refresh_token: 'fake-refresh-token',
  user: MOCK_USER,
};

const ADMIN_ROLE_ROW = [{ id: 'r1', user_id: 'test-user-id', role: 'admin' }];

// CORS headers so cross-origin fetch() calls inside the app aren't blocked.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, apikey, x-client-info',
  'Content-Type': 'application/json',
};

/** Write a fake Supabase auth session into localStorage before the page loads. */
export async function injectAuthSession(page: Page) {
  const key = `sb-${PROJECT_REF}-auth-token`;
  const session = MOCK_SESSION;
  await page.addInitScript(
    ({ k, s }) => localStorage.setItem(k, JSON.stringify(s)),
    { k: key, s: session },
  );
}

/**
 * Intercept all Supabase auth + REST requests.
 * `fixtures` maps table name → array of row objects.
 * `user_roles` defaults to an admin row unless overridden.
 */
export async function mockSupabase(page: Page, fixtures: Record<string, unknown[]> = {}) {
  const tables: Record<string, unknown[]> = {
    user_roles: ADMIN_ROLE_ROW,
    ...fixtures,
  };

  // OPTIONS preflight — respond immediately so fetch doesn't fail CORS.
  await page.route(`${SUPABASE_URL}/**`, async (route: Route) => {
    if (route.request().method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    return route.fallback();
  });

  // Auth: getUser
  await page.route(`${SUPABASE_URL}/auth/v1/user`, (route: Route) =>
    route.fulfill({ headers: CORS_HEADERS, json: MOCK_USER }),
  );

  // Auth: token (sign-in / refresh)
  await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route: Route) =>
    route.fulfill({ headers: CORS_HEADERS, json: { ...MOCK_SESSION } }),
  );

  // Auth: logout
  await page.route(`${SUPABASE_URL}/auth/v1/logout`, (route: Route) =>
    route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' }),
  );

  // REST: data tables — return fixture data or empty array
  await page.route(`${SUPABASE_URL}/rest/v1/**`, (route: Route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.replace(/^\/rest\/v1\//, '').split('?')[0];
    const data = tables[table] ?? [];
    return route.fulfill({ headers: CORS_HEADERS, json: data });
  });
}
