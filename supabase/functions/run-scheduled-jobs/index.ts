import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const db = createClient(supabaseUrl, serviceRoleKey);
  const results: Array<{ job: string; status: string; affected: number; error?: string }> = [];

  await runJob(db, 'evidence-expiry-scan',     evidenceExpiryScan,     results);
  await runJob(db, 'alert-escalation',          alertEscalation,        results);
  await runJob(db, 'vendor-contract-review',    vendorContractReview,   results);
  await runJob(db, 'compliance-snapshot',       complianceSnapshot,     results);

  const anyFailure = results.some(r => r.status === 'failure');
  return new Response(JSON.stringify({ jobs: results }), {
    status: anyFailure ? 207 : 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ─── Job runner helper ────────────────────────────────────────────────────────

type JobFn = (db: ReturnType<typeof createClient>) => Promise<{ affected: number; details?: Record<string, unknown> }>;

async function runJob(
  db: ReturnType<typeof createClient>,
  jobName: string,
  fn: JobFn,
  results: Array<{ job: string; status: string; affected: number; error?: string }>,
) {
  const startedAt = Date.now();
  try {
    const { affected, details } = await fn(db);
    const durationMs = Date.now() - startedAt;
    await db.from('job_runs').insert({
      job_name: jobName,
      status: 'success',
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      records_affected: affected,
      details: details ?? null,
    });
    results.push({ job: jobName, status: 'success', affected });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startedAt;
    await db.from('job_runs').insert({
      job_name: jobName,
      status: 'failure',
      started_at: new Date(startedAt).toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: durationMs,
      records_affected: 0,
      error_message: message,
    });
    results.push({ job: jobName, status: 'failure', affected: 0, error: message });
    console.error(`[${jobName}] failed:`, message);
  }
}

// ─── Job: evidence-expiry-scan ────────────────────────────────────────────────
// Finds evidence expiring in the next 30 days and marks status = 'expiring_soon'
// (or keeps existing status if already more urgent). Allows the UI to show
// a badge without a full DB query on every page load.
async function evidenceExpiryScan(db: ReturnType<typeof createClient>) {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400_000).toISOString();

  // Fetch evidence expiring within 30 days that isn't already flagged.
  const { data: expiring, error } = await db
    .from('evidence')
    .select('id, title, expires_at, status')
    .not('expires_at', 'is', null)
    .lte('expires_at', in30)
    .gte('expires_at', now.toISOString())
    .neq('status', 'expired');

  if (error) throw new Error(error.message);
  if (!expiring?.length) return { affected: 0 };

  // Mark truly expired items.
  const { data: alreadyExpired } = await db
    .from('evidence')
    .select('id')
    .not('expires_at', 'is', null)
    .lt('expires_at', now.toISOString())
    .neq('status', 'expired');

  let affected = 0;

  if (alreadyExpired?.length) {
    const ids = alreadyExpired.map((e: { id: string }) => e.id);
    await db.from('evidence').update({ status: 'expired' }).in('id', ids);
    affected += ids.length;
  }

  return {
    affected: affected + expiring.length,
    details: {
      expiring_soon: expiring.length,
      newly_expired: alreadyExpired?.length ?? 0,
      titles: expiring.slice(0, 5).map((e: { title: string }) => e.title),
    },
  };
}

// ─── Job: alert-escalation ────────────────────────────────────────────────────
// Escalates critical alerts that have been open and unacknowledged for > 24 h
// by updating their status to 'escalated'.
async function alertEscalation(db: ReturnType<typeof createClient>) {
  const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString();

  const { data: toEscalate, error } = await db
    .from('alerts')
    .select('id, title, severity, created_at')
    .in('severity', ['critical', 'high'])
    .eq('status', 'open')
    .is('acknowledged_by', null)
    .lt('created_at', cutoff);

  if (error) throw new Error(error.message);
  if (!toEscalate?.length) return { affected: 0 };

  const ids = toEscalate.map((a: { id: string }) => a.id);
  const { error: updateErr } = await db
    .from('alerts')
    .update({ status: 'escalated' })
    .in('id', ids);

  if (updateErr) throw new Error(updateErr.message);

  return {
    affected: ids.length,
    details: {
      escalated_ids: ids,
      titles: toEscalate.slice(0, 5).map((a: { title: string }) => a.title),
    },
  };
}

// ─── Job: vendor-contract-review ─────────────────────────────────────────────
// Flags vendors whose contracts expire within 60 days by updating their
// status to 'contract_review' if currently 'active'.
async function vendorContractReview(db: ReturnType<typeof createClient>) {
  const now = new Date();
  const in60 = new Date(now.getTime() + 60 * 86400_000).toISOString();

  const { data: vendors, error } = await db
    .from('vendors')
    .select('id, name, contract_expiry, status')
    .not('contract_expiry', 'is', null)
    .lte('contract_expiry', in60)
    .gte('contract_expiry', now.toISOString())
    .eq('status', 'active');

  if (error) throw new Error(error.message);
  if (!vendors?.length) return { affected: 0 };

  const ids = vendors.map((v: { id: string }) => v.id);
  const { error: updateErr } = await db
    .from('vendors')
    .update({ status: 'review' })
    .in('id', ids);

  if (updateErr) throw new Error(updateErr.message);

  return {
    affected: ids.length,
    details: {
      vendor_names: vendors.map((v: { name: string; contract_expiry: string }) => `${v.name} (${v.contract_expiry})`),
    },
  };
}

// ─── Job: compliance-snapshot ─────────────────────────────────────────────────
// Counts control statuses per framework and writes a daily snapshot row.
// Downstream: trend charts can query compliance_snapshots instead of computing
// on every page load.
async function complianceSnapshot(db: ReturnType<typeof createClient>) {
  const { data: controls, error } = await db
    .from('controls')
    .select('status, frameworks');

  if (error) throw new Error(error.message);

  // Group by framework.
  const byFramework = new Map<string, { total: number; implemented: number; in_progress: number; failing: number; not_started: number }>();

  for (const ctrl of controls ?? []) {
    const fws: string[] = Array.isArray(ctrl.frameworks) ? ctrl.frameworks : [];
    if (fws.length === 0) fws.push('General');
    for (const fw of fws) {
      if (!byFramework.has(fw)) byFramework.set(fw, { total: 0, implemented: 0, in_progress: 0, failing: 0, not_started: 0 });
      const bucket = byFramework.get(fw)!;
      bucket.total++;
      const s = (ctrl.status as string) ?? 'not_started';
      if (s === 'implemented')  bucket.implemented++;
      else if (s === 'in_progress') bucket.in_progress++;
      else if (s === 'failing') bucket.failing++;
      else bucket.not_started++;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const rows = [...byFramework.entries()].map(([framework, b]) => ({
    snapshot_date: today,
    framework,
    total_controls: b.total,
    implemented: b.implemented,
    in_progress: b.in_progress,
    failing: b.failing,
    not_started: b.not_started,
    score_pct: b.total > 0 ? Math.round((b.implemented / b.total) * 10000) / 100 : 0,
  }));

  // Upsert so re-runs on the same day are idempotent.
  const { error: upsertErr } = await db
    .from('compliance_snapshots')
    .upsert(rows, { onConflict: 'snapshot_date,framework' });

  if (upsertErr) throw new Error(upsertErr.message);

  return {
    affected: rows.length,
    details: { snapshot_date: today, frameworks: rows.map(r => r.framework) },
  };
}
