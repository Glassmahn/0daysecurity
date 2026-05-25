import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  if (req.headers.get('Authorization') !== `Bearer ${serviceRoleKey}`) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    const db = createClient(supabaseUrl, serviceRoleKey);

  // Fetch all controls with their evidence.
  const { data: controls, error: ctrlError } = await db
    .from('controls')
    .select('id, code, title, status');

  if (ctrlError) {
    return errorResponse(ctrlError.message, 500);
  }

  const controlIds = controls?.map(c => c.id) ?? [];
  if (controlIds.length === 0) {
    return new Response(JSON.stringify({ tested: 0, passed: 0, failed: 0 }));
  }

  // Fetch evidence grouped by control_id.
  const { data: evidence, error: evError } = await db
    .from('evidence')
    .select('id, control_id, status, collected_at, expires_at')
    .in('control_id', controlIds);

  if (evError) {
    return errorResponse(evError.message, 500);
  }

  const evidenceByControl = new Map<string, typeof evidence>();
  for (const e of evidence ?? []) {
    if (!e.control_id) continue;
    if (!evidenceByControl.has(e.control_id)) evidenceByControl.set(e.control_id, []);
    evidenceByControl.get(e.control_id)!.push(e);
  }

  const now = new Date();

  // For each control, evaluate status based on linked evidence.
  let tested = 0;
  let passed = 0;
  let failed = 0;

  // Track which integrations to log test history for.
  const testResults: Array<{
    control_id: string;
    result: string;
    notes: string;
  }> = [];

  for (const control of controls ?? []) {
    const linked = evidenceByControl.get(control.id) ?? [];
    tested++;

    // Determine status:
    // - implemented: at least 1 valid evidence item, none expired
    // - failing: all evidence expired or rejected, or no evidence
    // - in_progress: mix of valid and expired, or only pending_review
    const hasValid = linked.some(e => e.status === 'valid');
    const hasExpired = linked.some(e => e.status === 'expired' || e.status === 'needs_recollection');
    const hasNone = linked.length === 0;

    let newStatus: string;
    let result: string;
    let notes: string;

    if (hasValid && !hasExpired && !hasNone) {
      newStatus = 'implemented';
      result = 'pass';
      notes = `Auto-monitoring: ${linked.length} evidence items, all valid`;
    } else if (hasValid && hasExpired) {
      newStatus = 'in_progress';
      result = 'partial';
      notes = `Auto-monitoring: ${linked.filter(e => e.status === 'valid').length} valid, ${linked.filter(e => e.status === 'expired' || e.status === 'needs_recollection').length} expired`;
    } else if (hasNone) {
      newStatus = 'not_started';
      result = 'fail';
      notes = 'Auto-monitoring: no evidence collected for this control';
    } else {
      // All expired or all pending_review
      newStatus = 'failing';
      result = 'fail';
      notes = `Auto-monitoring: ${linked.length} evidence items, none valid`;
    }

    // Update control status in the DB.
    await db.from('controls').update({ status: newStatus }).eq('id', control.id);

    testResults.push({
      control_id: control.id,
      result,
      notes,
    });

    if (result === 'pass') passed++;
    else if (result === 'fail') failed++;
    // "partial" counts as neither pass nor fail for aggregate stats
  }

  // Write test results into the tests table so the UI can surface them.
  const testRows = testResults.map(t => ({
    name: `Auto-Monitor ${new Date().toISOString().split('T')[0]}`,
    status: t.result === 'pass' ? 'passing' : t.result === 'fail' ? 'failing' : 'passing',
    result: t.result,
    control_id: t.control_id,
    description: t.notes,
    schedule: 'continuous',
    last_run: new Date().toISOString(),
  }));

  // Upsert: per control, keep the latest auto-monitor test row.
  for (const row of testRows) {
    await db.from('tests').upsert(row, {
      onConflict: 'control_id,schedule,name',
      ignoreDuplicates: false,
    });
  }

  // Create alerts for newly failing controls.
  const failingControls = controls?.filter(c => {
    const linked = evidenceByControl.get(c.id) ?? [];
    const hasValid = linked.some(e => e.status === 'valid');
    return !hasValid && linked.length > 0;
  }) ?? [];

  for (const ctrl of failingControls) {
    const linked = evidenceByControl.get(ctrl.id) ?? [];
    await db.from('alerts').insert({
      title: `Control failing: ${ctrl.code} — ${ctrl.title}`,
      severity: 'high',
      status: 'open',
      source: 'system',
      description: `Auto-monitoring detected that control ${ctrl.code} (${ctrl.title}) has ${linked.length} evidence item(s), none of which are valid. Review and re-collect evidence.`,
    });
  }

  return new Response(JSON.stringify({
    tested,
    passed,
    failed,
    partial: tested - passed - failed,
    alerts_created: failingControls.length,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('control-monitoring error:', message);
    return errorResponse(message, 500);
  }
});
