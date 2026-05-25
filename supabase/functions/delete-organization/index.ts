import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

// Only include tables that have an org_id column.
// Tables like training_courses, webhook_endpoints, webhook_deliveries do not have org_id
// and are cleaned up separately or left as global data.
const TABLES_TO_CLEAR = [
  'audit_evidence_requests', 'audit_findings', 'audits',
  'access_review_assignments', 'access_review_campaigns',
  'training_assignments',
  'kb_article_versions', 'knowledge_base',
  'policy_acknowledgments', 'policies',
  'custom_field_values', 'custom_field_definitions',
  'compliance_snapshots', 'vendor_assessments',
  'incidents', 'incident_comments',
  'alerts', 'evidence', 'controls',
  'api_keys', 'sso_configurations',
  'notification_preferences', 'personnel',
  'assets', 'vendors', 'risks', 'frameworks',
  'user_roles', 'organization_settings',
  'training_quiz_attempts',
  'subprocessors',
  'report_schedules',
  'vendor_portal_tokens',
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

    const { confirmation } = await req.json();
    if (confirmation !== `DELETE ${userRole.org_id}`) {
      return errorResponse('Type DELETE <org_id> to confirm', 400);
    }

    const orgId = userRole.org_id;

    // Delete org-scoped data in reverse dependency order
    for (const table of TABLES_TO_CLEAR) {
      try {
        await db.from(table as never).delete().eq('org_id', orgId);
      } catch (err) {
        console.warn(`Warning clearing ${table}:`, err);
      }
    }

    // Delete the org itself
    await db.from('orgs').delete().eq('id', orgId);

    return jsonResponse({
      ok: true,
      message: `Organization ${orgId} and all associated data have been deleted.`,
      tables_cleared: TABLES_TO_CLEAR.length,
    });
  } catch (err) {
    console.error('delete-organization error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
