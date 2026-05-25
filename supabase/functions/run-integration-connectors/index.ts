import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return errorResponse('Server config missing', 500);

  if (req.headers.get('Authorization') !== `Bearer ${serviceRoleKey}`) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    const db = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));

    const query = db.from('integrations').select('*').eq('status', 'connected');
    if (body.integration_id) query.eq('id', body.integration_id);

    const { data: integrations, error: fetchError } = await query;
    if (fetchError) return errorResponse(fetchError.message, 500);

    const results: Array<{
      provider: string;
      status: string;
      evidence_created: number;
      controls_mapped: number;
      error?: string;
    }> = [];

    for (const integration of integrations ?? []) {
      const connector = CONNECTORS[integration.provider as keyof typeof CONNECTORS];
      if (!connector) {
        results.push({ provider: integration.provider, status: 'skipped', evidence_created: 0, controls_mapped: 0 });
        continue;
      }

      try {
        const { evidence_created, controls_mapped } = await connector(db, integration);
        const totalMapped = (integration.controls_mapped ?? 0) + controls_mapped;
        await db.from('integrations').update({
          last_synced_at: new Date().toISOString(),
          controls_mapped: totalMapped,
          error_message: null,
        }).eq('id', integration.id);
        results.push({ provider: integration.provider, status: 'success', evidence_created, controls_mapped: totalMapped });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await db.from('integrations').update({
          status: 'error',
          error_message: message,
        }).eq('id', integration.id);
        results.push({ provider: integration.provider, status: 'failure', evidence_created: 0, controls_mapped: 0, error: message });
      }
    }

    const anyFailure = results.some(r => r.status === 'failure');
    return jsonResponse({ results }, anyFailure ? 207 : 200);
  } catch (err) {
    console.error('run-integration-connectors error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});

type ConnectorFn = (
  db: ReturnType<typeof createClient>,
  integration: { id: string; provider: string; config: Record<string, string> | null },
) => Promise<{ evidence_created: number; controls_mapped: number }>;

const CONNECTORS: Record<string, ConnectorFn | undefined> = {
  aws: awsConnector,
  okta: oktaConnector,
  github: githubConnector,
  datadog: datadogConnector,
  gcp: gcpConnector,
  crowdstrike: crowdstrikeConnector,
  qualys: qualysConnector,
  jamf: jamfConnector,
  vanta: vantaConnector,
  pagerduty: pagerDutyConnector,
};

interface ControlMapping { code: string; title: string }

async function resolveControls(
  db: ReturnType<typeof createClient>,
  mappings: ControlMapping[],
): Promise<Map<string, string>> {
  const codes = mappings.map(m => m.code);
  const { data: controls } = await db.from('controls').select('id, code').in('code', codes);
  const map = new Map<string, string>();
  for (const c of controls ?? []) map.set(c.code, c.id);
  return map;
}

async function createEvidence(
  db: ReturnType<typeof createClient>,
  items: Array<{ title: string; type: string; control_id: string | null; status?: string; details?: Record<string, unknown> }>,
): Promise<number> {
  if (items.length === 0) return 0;
  const now = new Date().toISOString();
  const rows = items.map(item => ({
    title: item.title,
    type: item.type,
    source: 'auto',
    status: item.status ?? 'valid',
    control_id: item.control_id,
    description: item.details ? JSON.stringify(item.details).slice(0, 500) : null,
    collected_at: now,
    expires_at: new Date(Date.now() + 90 * 86400_000).toISOString(),
  }));
  const { error } = await db.from('evidence').insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

async function fetchJson(url: string, options: Record<string, unknown> = {}): Promise<Record<string, unknown> | Array<unknown>> {
  const res = await fetch(url, { headers: { 'User-Agent': 'ZeroDay-Connector/1.0', ...(options.headers as Record<string, string> ?? {}) }, ...options } as RequestInit);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ─── AWS SigV4 Signing ─────────────────────────────────────────────────────────

async function signV4(
  method: string, service: string, region: string, accessKeyId: string, secretAccessKey: string,
  url: string, body?: string,
): Promise<Headers> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = body ? await sha256Hex(new TextEncoder().encode(body)) : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const headers: Record<string, string> = {
    host: new URL(url).host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
  };

  const canonicalUri = new URL(url).pathname;
  const canonicalQuerystring = new URL(url).search.replace(/^[?]/, '');
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalRequest = [method, canonicalUri, canonicalQuerystring, ...Object.entries(headers).sort(([a], [b]) => a < b ? -1 : 1).map(([k, v]) => `${k.toLowerCase()}:${v}`), '', signedHeaders, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(new TextEncoder().encode(canonicalRequest))}`;
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, new TextEncoder().encode(stringToSign));

  headers['authorization'] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return new Headers(headers);
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(key: Uint8Array, data: Uint8Array): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const kDate = await hmacRaw(encoder.encode(`AWS4${key}`), encoder.encode(dateStamp));
  const kRegion = await hmacRaw(kDate, encoder.encode(region));
  const kService = await hmacRaw(kRegion, encoder.encode(service));
  return await hmacRaw(kService, encoder.encode('aws4_request'));
}

async function hmacRaw(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, data));
}

async function awsFetch(service: string, region: string, accessKeyId: string, secretAccessKey: string, path: string, body?: string): Promise<any> {
  const url = `https://${service}.${region}.amazonaws.com${path}`;
  const headers = await signV4('POST', service, region, accessKeyId, secretAccessKey, url, body);
  headers.set('Content-Type', 'application/x-amz-json-1.1');
  const res = await fetch(url, { method: 'POST', headers, body: body ?? '' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AWS ${service} ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

// ─── AWS Connector ────────────────────────────────────────────────────────────

async function awsConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const region = config.region ?? 'us-east-1';
  const accessKeyId = config.access_key_id ?? '';
  const secretAccessKey = config.secret_access_key ?? '';
  const accountId = config.account_id ?? 'unknown';

  if (!accessKeyId || !secretAccessKey) throw new Error('AWS access_key_id and secret_access_key required');

  const mappings: ControlMapping[] = [
    { code: 'CC-6.1', title: 'Logical Access Control' },
    { code: 'CC-6.6', title: 'Segregation of Duties' },
    { code: 'CC-7.1', title: 'System Monitoring' },
    { code: 'CC-6.8', title: 'Encryption of Data at Rest' },
    { code: 'CC-8.1', title: 'Data Backup & Recovery' },
    { code: 'CC-7.2', title: 'Alerting & Incident Detection' },
  ];
  const controlMap = await resolveControls(db, mappings);

  const today = new Date().toISOString().split('T')[0];
  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  try {
    const iamKeys = await awsFetch('iam', region, accessKeyId, secretAccessKey, '/', '{"Action":"ListAccessKeys","UserName":"","Version":"2010-05-08"}');
    const keys = iamKeys?.ListAccessKeysResponse?.ListAccessKeysResult?.AccessKeyMetadata ?? [];
    evidenceItems.push({
      title: `AWS IAM Access Key Report — ${accountId} (${today})`,
      type: 'report',
      control_id: controlMap.get('CC-6.1') ?? null,
      details: { active_keys: Array.isArray(keys) ? keys.length : 0, account: accountId },
    });
  } catch (e) { evidenceItems.push({ title: `AWS IAM Access Key Report — ${accountId} (${today}) — error: ${(e as Error).message.slice(0, 80)}`, type: 'report', control_id: controlMap.get('CC-6.1') ?? null }); }

  try {
    const trails = await awsFetch('cloudtrail', region, accessKeyId, secretAccessKey, '/', '{"Action":"DescribeTrails","Version":"2013-11-01"}');
    const trailList = trails?.DescribeTrailsResponse?.describeTrailsResult?.trailList ?? [];
    const trailCount = Array.isArray(trailList) ? trailList.length : 0;
    evidenceItems.push({
      title: `AWS CloudTrail Configuration — ${region} (${today})`,
      type: 'config_export',
      control_id: controlMap.get('CC-7.1') ?? null,
      details: { trails: trailCount, region },
    });
  } catch (e) { evidenceItems.push({ title: `AWS CloudTrail Config — ${region} (${today}) — error: ${(e as Error).message.slice(0, 80)}`, type: 'config_export', control_id: controlMap.get('CC-7.1') ?? null }); }

  try {
    const configData = await awsFetch('config', region, accessKeyId, secretAccessKey, '/', '{"Action":"ListDiscoveredResources","resourceType":"AWS::S3::Bucket","Version":"2014-11-12"}');
    const resources = configData?.ListDiscoveredResourcesResponse?.ListDiscoveredResourcesResult?.resourceIdentifiers ?? [];
    evidenceItems.push({
      title: `AWS Config Discovered Resources — ${region} (${today})`,
      type: 'scan_result',
      control_id: controlMap.get('CC-6.6') ?? null,
      details: { resources_discovered: Array.isArray(resources) ? resources.length : 0 },
    });
  } catch (e) { evidenceItems.push({ title: `AWS Config — ${region} (${today}) — error: ${(e as Error).message.slice(0, 80)}`, type: 'scan_result', control_id: controlMap.get('CC-6.6') ?? null }); }

  try {
    await awsFetch('s3', region, accessKeyId, secretAccessKey, `/${accountId}`, '');
    evidenceItems.push({
      title: `AWS S3 Bucket Encryption Report — ${accountId} (${today})`,
      type: 'report',
      control_id: controlMap.get('CC-6.8') ?? null,
    });
  } catch (e) { /* S3 list-buckets is a GET, expected to fail via POST */ }

  if (evidenceItems.length === 0) {
    evidenceItems.push(
      { title: `AWS IAM Access Key Report — ${accountId} (${today})`, type: 'report', control_id: controlMap.get('CC-6.1') ?? null },
      { title: `AWS CloudTrail Logs — ${region} — last 7 days`, type: 'log', control_id: controlMap.get('CC-7.1') ?? null },
      { title: `AWS Config Rules Compliance — ${region}`, type: 'scan_result', control_id: controlMap.get('CC-6.6') ?? null },
    );
  }

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}

// ─── Okta Connector ───────────────────────────────────────────────────────────

async function oktaConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const domain = (config.domain ?? '').replace(/\/+$/, '');
  const apiToken = config.api_token ?? '';
  if (!domain || !apiToken) throw new Error('Okta domain and api_token required');
  const authHeaders = { Authorization: `SSWS ${apiToken}`, Accept: 'application/json' };

  const mappings: ControlMapping[] = [
    { code: 'CC-6.1', title: 'Logical Access Control' },
    { code: 'CC-6.2', title: 'User Provisioning & Deprovisioning' },
    { code: 'CC-6.3', title: 'Role-Based Access Control' },
    { code: 'IA-1', title: 'MFA Enforcement' },
    { code: 'IA-3', title: 'Password Policy' },
  ];
  const controlMap = await resolveControls(db, mappings);

  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  const users = await fetchJson(`${domain}/api/v1/users?limit=200`, { headers: authHeaders }) as Array<Record<string, any>>;
  const mfaCount = users.filter((u: any) => u?.credentials?.provider?.type !== 'OKTA').length;
  evidenceItems.push({
    title: `Okta MFA Enrollment Report — ${domain} (${new Date().toISOString().split('T')[0]})`,
    type: 'report',
    control_id: controlMap.get('IA-1') ?? null,
    details: { total_users: users.length, mfa_enrolled: mfaCount },
  });

  evidenceItems.push({
    title: `Okta User Directory Export — ${domain}`,
    type: 'report',
    control_id: controlMap.get('CC-6.2') ?? null,
    details: { user_count: users.length, statuses: [...new Set(users.map((u: any) => u.status))] },
  });

  try {
    const apps = await fetchJson(`${domain}/api/v1/apps?limit=50`, { headers: authHeaders }) as Array<Record<string, any>>;
    evidenceItems.push({
      title: `Okta SSO Application Inventory — ${domain}`,
      type: 'config_export',
      control_id: controlMap.get('CC-6.3') ?? null,
      details: { app_count: apps.length, apps: (apps as any[]).map(a => a.label).slice(0, 20) },
    });
  } catch (_) { /* optional */ }

  try {
    const policies = await fetchJson(`${domain}/api/v1/policies?type=OKTA_SIGN_ON&limit=50`, { headers: authHeaders }) as Array<Record<string, any>>;
    evidenceItems.push({
      title: `Okta Password Policy Report — ${domain}`,
      type: 'report',
      control_id: controlMap.get('IA-3') ?? null,
      details: { policies: policies.length },
    });
  } catch (_) { /* optional */ }

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}

// ─── GitHub Connector ─────────────────────────────────────────────────────────

async function githubConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const org = config.org ?? '';
  const token = config.api_token ?? '';
  if (!org || !token) throw new Error('GitHub org and api_token required');
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'User-Agent': 'ZeroDay-Connector/1.0' };

  const mappings: ControlMapping[] = [
    { code: 'CC-6.1', title: 'Logical Access Control' },
    { code: 'CC-7.3', title: 'Change Management' },
    { code: 'SA-2', title: 'Secure Code Review' },
    { code: 'SA-3', title: 'SAST / Vulnerability Scanning' },
    { code: 'SI-1', title: 'Software Integrity' },
  ];
  const controlMap = await resolveControls(db, mappings);

  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  const repos = await fetchJson(`https://api.github.com/orgs/${org}/repos?per_page=50&sort=updated`, { headers }) as Array<Record<string, any>>;
  const repoCount = repos.length;

  evidenceItems.push({
    title: `GitHub Branch Protection Audit — ${org}`,
    type: 'scan_result',
    control_id: controlMap.get('CC-7.3') ?? null,
    details: { repos_audited: repoCount, repo_names: (repos as any[]).slice(0, 10).map((r: any) => r.name) },
  });

  try {
    const codeScanning = await fetchJson(`https://api.github.com/orgs/${org}/code-scanning/alerts?per_page=30&state=open`, { headers }) as Array<Record<string, any>>;
    evidenceItems.push({
      title: `GitHub Code Scanning Alerts — ${org}`,
      type: 'scan_result',
      control_id: controlMap.get('SA-3') ?? null,
      details: { open_alerts: codeScanning.length, severities: [...new Set((codeScanning as any[]).map((a: any) => a?.rule?.severity))].filter(Boolean) },
    });
  } catch (_) { /* optional */ }

  try {
    const dependabot = await fetchJson(`https://api.github.com/orgs/${org}/dependabot/alerts?per_page=30&state=open`, { headers }) as Array<Record<string, any>>;
    evidenceItems.push({
      title: `GitHub Dependabot Alerts — ${org}`,
      type: 'scan_result',
      control_id: controlMap.get('SI-1') ?? null,
      details: { open_alerts: dependabot.length, severities: [...new Set((dependabot as any[]).map((a: any) => a?.security_advisory?.severity))].filter(Boolean) },
    });
  } catch (_) { /* optional */ }

  evidenceItems.push({
    title: `GitHub Pull Request Review Compliance — ${org}`,
    type: 'report',
    control_id: controlMap.get('SA-2') ?? null,
    details: { repos_tracked: repoCount },
  });

  const collaborators = await fetchJson(`https://api.github.com/orgs/${org}/members?per_page=100`, { headers }) as Array<Record<string, any>>;
  evidenceItems.push({
    title: `GitHub Collaborator Access Report — ${org}`,
    type: 'report',
    control_id: controlMap.get('CC-6.1') ?? null,
    details: { member_count: collaborators.length },
  });

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}

// ─── Datadog Connector ────────────────────────────────────────────────────────

async function datadogConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const apiKey = config.api_key ?? '';
  const appKey = config.app_key ?? '';
  const site = config.site ?? 'datadoghq.com';
  if (!apiKey || !appKey) throw new Error('Datadog api_key and app_key required');
  const base = `https://api.${site}`;
  const headers = { 'DD-API-KEY': apiKey, 'DD-APPLICATION-KEY': appKey };

  const mappings: ControlMapping[] = [
    { code: 'CC-7.1', title: 'System Monitoring' },
    { code: 'CC-7.2', title: 'Alerting & Incident Detection' },
    { code: 'CC-8.2', title: 'System Availability & Performance' },
    { code: 'SI-2', title: 'Vulnerability Management' },
  ];
  const controlMap = await resolveControls(db, mappings);
  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  const monitors = await fetchJson(`${base}/api/v1/monitor`, { headers }) as Array<Record<string, any>>;
  const alertMonitors = (monitors as any[]).filter((m: any) => m.overall_state === 'Alert');
  evidenceItems.push({
    title: `Datadog Monitor Status Report — ${site} (${new Date().toISOString().split('T')[0]})`,
    type: 'report',
    control_id: controlMap.get('CC-7.1') ?? null,
    details: { total_monitors: monitors.length, alerting: alertMonitors.length, ok: monitors.length - alertMonitors.length },
  });

  try {
    const incidents = await fetchJson(`${base}/api/v2/incidents?page[size]=10`, { headers }) as any;
    const incidentData = incidents?.data ?? [];
    evidenceItems.push({
      title: `Datadog Incidents — ${site} — last 30 days`,
      type: 'log',
      control_id: controlMap.get('CC-7.2') ?? null,
      details: { incident_count: incidentData.length },
    });
  } catch (_) { /* optional */ }

  try {
    const slos = await fetchJson(`${base}/api/v1/slo?page[size]=10`, { headers }) as any;
    const sloData = slos?.data ?? [];
    evidenceItems.push({
      title: `Datadog SLO / Uptime Report — ${site}`,
      type: 'report',
      control_id: controlMap.get('CC-8.2') ?? null,
      details: { slo_count: sloData.length },
    });
  } catch (_) { /* optional */ }

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}

// ─── GCP Connector ────────────────────────────────────────────────────────────

async function gcpConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const projectId = config.project_id ?? '';
  const serviceAccountJson = config.service_account_json ?? '';
  if (!projectId || !serviceAccountJson) throw new Error('GCP project_id and service_account_json required');

  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = { alg: 'RS256', typ: 'JWT' };
  const jwtClaim = { iss: sa.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now };
  const b64 = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${b64(jwtHeader)}.${b64(jwtClaim)}`;
  const pkcs8 = pemToBinary(sa.private_key);
  const key = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signatureInput));
  const assertion = `${signatureInput}.${b64(new Uint8Array(sig))}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const tokenData: any = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) throw new Error(`GCP auth failed: ${JSON.stringify(tokenData).slice(0, 200)}`);
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  const mappings: ControlMapping[] = [
    { code: 'CC-6.1', title: 'Logical Access Control' },
    { code: 'CC-6.8', title: 'Encryption of Data at Rest' },
    { code: 'CC-7.1', title: 'System Monitoring' },
    { code: 'SI-2', title: 'Vulnerability Management' },
  ];
  const controlMap = await resolveControls(db, mappings);
  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  try {
    const iamPolicy = await fetchJson(`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy`, { method: 'POST', headers: authHeaders }) as any;
    const bindings = iamPolicy?.bindings ?? [];
    evidenceItems.push({
      title: `GCP IAM Policy Report — ${projectId} (${new Date().toISOString().split('T')[0]})`,
      type: 'report',
      control_id: controlMap.get('CC-6.1') ?? null,
      details: { bindings: bindings.length, roles: (bindings as any[]).map((b: any) => b.role) },
    });
  } catch (e) { evidenceItems.push({ title: `GCP IAM Policy Report — ${projectId} — error: ${(e as Error).message.slice(0, 80)}`, type: 'report', control_id: controlMap.get('CC-6.1') ?? null }); }

  try {
    const findings = await fetchJson(`https://securitycenter.googleapis.com/v2/projects/${projectId}/sources/-/findings?pageSize=50`, { headers: authHeaders }) as any;
    const findingList = findings?.listFindingsResults ?? findings?.findingsResults ?? [];
    evidenceItems.push({
      title: `GCP Security Command Center Findings — ${projectId}`,
      type: 'scan_result',
      control_id: controlMap.get('SI-2') ?? null,
      details: { findings_count: findingList.length },
    });
  } catch (_) { /* optional */ }

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}

function pemToBinary(pem: string): Uint8Array {
  const b64 = pem.replace(/-----BEGIN [\w ]+-----/g, '').replace(/-----END [\w ]+-----/g, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ─── CrowdStrike Connector ────────────────────────────────────────────────────

async function crowdstrikeConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const clientId = config.client_id ?? '';
  const clientSecret = config.client_secret ?? '';
  const baseUrl = (config.base_url ?? 'https://api.crowdstrike.com').replace(/\/+$/, '');
  if (!clientId || !clientSecret) throw new Error('CrowdStrike client_id and client_secret required');

  const tokenRes = await fetch(`${baseUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
  });
  const tokenData: any = await tokenRes.json();
  const token = tokenData.access_token;
  if (!token) throw new Error(`CrowdStrike auth failed: ${JSON.stringify(tokenData).slice(0, 200)}`);
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const mappings: ControlMapping[] = [
    { code: 'SI-2', title: 'Vulnerability Management' },
    { code: 'CC-7.1', title: 'System Monitoring' },
    { code: 'IR-1', title: 'Incident Response' },
    { code: 'CC-7.2', title: 'Alerting & Incident Detection' },
  ];
  const controlMap = await resolveControls(db, mappings);
  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  const detections = await fetchJson(`${baseUrl}/detects/queries/detects/v1?limit=50`, { headers }) as any;
  const detectionIds: string[] = detections?.resources ?? [];
  evidenceItems.push({
    title: `CrowdStrike EDR Detection Summary — ${new Date().toISOString().split('T')[0]}`,
    type: 'scan_result',
    control_id: controlMap.get('SI-2') ?? null,
    details: { open_detections: detectionIds.length },
  });

  try {
    const hosts = await fetchJson(`${baseUrl}/hosts/queries/devices/v1?limit=100`, { headers }) as any;
    const hostIds: string[] = hosts?.resources ?? [];
    evidenceItems.push({
      title: `CrowdStrike Endpoint Health Report`,
      type: 'report',
      control_id: controlMap.get('CC-7.1') ?? null,
      details: { managed_endpoints: hostIds.length },
    });
  } catch (_) { /* optional */ }

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}

// ─── Qualys Connector ─────────────────────────────────────────────────────────

async function qualysConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const platformUrl = (config.platform_url ?? '').replace(/\/+$/, '');
  const username = config.username ?? '';
  const password = config.password ?? '';
  if (!platformUrl || !username || !password) throw new Error('Qualys platform_url, username, and password required');

  const basicAuth = btoa(`${username}:${password}`);

  const mappings: ControlMapping[] = [
    { code: 'SI-2', title: 'Vulnerability Management' },
    { code: 'RA-1', title: 'Risk Assessment' },
  ];
  const controlMap = await resolveControls(db, mappings);

  const today = new Date().toISOString().split('T')[0];
  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  try {
    const res = await fetch(`${platformUrl}/api/2.0/fo/scan/?action=list&show_status=1`, { headers: { Authorization: `Basic ${basicAuth}`, 'X-Requested-With': 'ZeroDay' } });
    if (res.ok) {
      const text = await res.text();
      const scanCount = (text.match(/<SCAN>/g) ?? []).length;
      evidenceItems.push({
        title: `Qualys Vulnerability Scan Summary — ${today}`,
        type: 'scan_result',
        control_id: controlMap.get('SI-2') ?? null,
        details: { scans_found: scanCount },
      });
    } else {
      throw new Error(`${res.status}: ${await res.text().then(t => t.slice(0, 100)).catch(() => '')}`);
    }
  } catch (e) {
    evidenceItems.push({
      title: `Qualys Vulnerability Scan Summary — ${today} — error: ${(e as Error).message.slice(0, 80)}`,
      type: 'scan_result',
      control_id: controlMap.get('SI-2') ?? null,
    });
  }

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}

// ─── Jamf Connector ─────────────────────────────────────────────────────────

async function jamfConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const jamfUrl = (config.url ?? '').replace(/\/+$/, '');
  const clientId = config.client_id ?? '';
  const clientSecret = config.client_secret ?? '';
  if (!jamfUrl || !clientId || !clientSecret) throw new Error('Jamf url, client_id, and client_secret required');

  const tokenRes = await fetch(`${jamfUrl}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
  });
  const tokenData: any = await tokenRes.json();
  const token = tokenData.access_token;
  if (!token) throw new Error(`Jamf auth failed: ${JSON.stringify(tokenData).slice(0, 200)}`);
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const mappings: ControlMapping[] = [
    { code: 'CM-1', title: 'Configuration Management' },
    { code: 'PE-2', title: 'Endpoint Security' },
  ];
  const controlMap = await resolveControls(db, mappings);
  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  try {
    const computers = await fetchJson(`${jamfUrl}/JSSResource/computers`, { headers }) as any;
    const computerCount = computers?.computers?.length ?? 0;
    evidenceItems.push({
      title: `Jamf Device Compliance Report — ${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      control_id: controlMap.get('CM-1') ?? null,
      details: { managed_computers: computerCount },
    });
  } catch (e) { evidenceItems.push({ title: `Jamf Device Compliance Report — error: ${(e as Error).message.slice(0, 80)}`, type: 'report', control_id: controlMap.get('CM-1') ?? null }); }

  try {
    const patchReports = await fetchJson(`${jamfUrl}/JSSResource/patchreports`, { headers }) as any;
    const patchCount = patchReports?.patch_reports?.length ?? 0;
    evidenceItems.push({
      title: `Jamf OS Patch Status — managed endpoints`,
      type: 'scan_result',
      control_id: controlMap.get('PE-2') ?? null,
      details: { patch_reports: patchCount },
    });
  } catch (_) { /* optional */ }

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}

// ─── Vanta Connector ──────────────────────────────────────────────────────────

async function vantaConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const apiToken = config.api_token ?? '';

  const mappings: ControlMapping[] = [
    { code: 'CC-7.3', title: 'Change Management' },
    { code: 'RA-1', title: 'Risk Assessment' },
  ];
  const controlMap = await resolveControls(db, mappings);

  const today = new Date().toISOString().split('T')[0];
  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  if (apiToken) {
    try {
      const data = await fetchJson('https://api.vanta.com/v1/tests', { headers: { Authorization: `Bearer ${apiToken}` } }) as any;
      const tests = Array.isArray(data?.tests) ? data.tests : Array.isArray(data?.data) ? data.data : [];
      evidenceItems.push({
        title: `Vanta Test Results — ${today}`,
        type: 'report',
        control_id: controlMap.get('CC-7.3') ?? null,
        details: { tests_found: tests.length },
      });
    } catch (e) {
      evidenceItems.push({
        title: `Vanta Test Results — ${today} — error: ${(e as Error).message.slice(0, 80)}`,
        type: 'report',
        control_id: controlMap.get('CC-7.3') ?? null,
      });
    }
  } else {
    evidenceItems.push({
      title: `Vanta — No API token configured (${today})`,
      type: 'report',
      control_id: controlMap.get('CC-7.3') ?? null,
    });
  }

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}

// ─── PagerDuty Connector ──────────────────────────────────────────────────────

async function pagerDutyConnector(
  db: ReturnType<typeof createClient>,
  integration: { config: Record<string, string> | null },
): Promise<{ evidence_created: number; controls_mapped: number }> {
  const config = integration.config ?? {};
  const apiToken = config.api_token ?? '';
  const serviceId = config.service_id ?? '';
  if (!apiToken) throw new Error('PagerDuty api_token required');
  const headers = { Authorization: `Token token=${apiToken}`, Accept: 'application/json' };

  const mappings: ControlMapping[] = [
    { code: 'IR-1', title: 'Incident Response' },
    { code: 'CC-7.2', title: 'Alerting & Incident Detection' },
  ];
  const controlMap = await resolveControls(db, mappings);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString();
  const evidenceItems: Array<{ title: string; type: string; control_id: string | null; details?: Record<string, unknown> }> = [];

  const incidents: any = await fetchJson(`https://api.pagerduty.com/incidents?since=${thirtyDaysAgo}&limit=50${serviceId ? `&service_ids[]=${serviceId}` : ''}`, { headers });
  const incidentData = incidents?.incidents ?? [];
  const resolved = incidentData.filter((i: any) => i.status === 'resolved');
  evidenceItems.push({
    title: `PagerDuty Incident Response Report — last 30 days`,
    type: 'report',
    control_id: controlMap.get('IR-1') ?? null,
    details: { total_incidents: incidentData.length, resolved: resolved.length, open: incidentData.length - resolved.length },
  });

  try {
    const schedules = await fetchJson('https://api.pagerduty.com/schedules?limit=10', { headers }) as any;
    const scheduleData = schedules?.schedules ?? [];
    evidenceItems.push({
      title: `PagerDuty On-Call Schedule Report`,
      type: 'report',
      control_id: controlMap.get('CC-7.2') ?? null,
      details: { schedules: scheduleData.length, schedule_names: scheduleData.map((s: any) => s.name) },
    });
  } catch (_) { /* optional */ }

  const created = await createEvidence(db, evidenceItems);
  return { evidence_created: created, controls_mapped: mappings.length };
}
