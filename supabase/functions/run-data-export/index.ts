import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const EXPORT_TABLES = [
  'controls', 'evidence', 'frameworks', 'policies', 'risks',
  'incidents', 'assets', 'vendors', 'vendor_assessments',
  'alerts', 'audits', 'audit_findings', 'audit_evidence_requests',
  'knowledge_base', 'training_courses', 'training_assignments',
  'access_review_campaigns', 'access_review_assignments',
  'policy_acknowledgments', 'kb_article_versions',
  'compliance_snapshots', 'custom_field_definitions', 'custom_field_values',
  'personnel', 'webhook_endpoints', 'webhook_deliveries',
  'api_keys', 'sso_configurations', 'notification_preferences',
];

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) return errorResponse('Server config missing', 500);

    const db = createClient(supabaseUrl, serviceRoleKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await db.auth.getUser(token);
    if (userError || !user) return errorResponse('Unauthorized', 401);

    const { data: userRole } = await db.from('user_roles').select('org_id, role').eq('user_id', user.id).maybeSingle();
    if (!userRole || userRole.role !== 'admin') return errorResponse('Admin access required', 403);

    const orgId = userRole.org_id;
    const exportData: Record<string, unknown[]> = {};

    for (const table of EXPORT_TABLES) {
      const { data } = await db.from(table as never).select('*').eq('org_id', orgId);
      exportData[table] = data ?? [];
    }

    const body = await req.json().catch(() => ({}));
    const format = (body as Record<string, unknown>).format as string
      ?? new URL(req.url).searchParams.get('format')
      ?? 'json';
    if (format === 'csv') {
      const csvRows: string[] = [];
      for (const [table, rows] of Object.entries(exportData)) {
        if (rows.length === 0) continue;
        csvRows.push(`\n=== ${table} (${rows.length} rows) ===\n`);
        const headers = Object.keys(rows[0] as Record<string, unknown>).join(',');
        csvRows.push(headers);
        for (const row of rows) {
          csvRows.push(Object.values(row as Record<string, unknown>).map(v => {
            const s = v == null ? '' : String(v);
            return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(','));
        }
      }
      return new Response(csvRows.join('\n'), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="zeroday-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return jsonResponse({
      exported_at: new Date().toISOString(),
      org_id: orgId,
      record_counts: Object.fromEntries(Object.entries(exportData).map(([t, rows]) => [t, rows.length])),
      data: exportData,
    });
  } catch (err) {
    console.error('run-data-export error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
