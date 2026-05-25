import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { createRateLimitGuard } from '../_shared/rate-limit.ts';

const rateLimit = createRateLimitGuard();

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const rlRes = rateLimit(req);
  if (rlRes) return rlRes;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceRoleKey || !supabaseAnonKey) return errorResponse('Server config missing', 500);

  const auth = await authenticateRequest(req, supabaseUrl, supabaseAnonKey, serviceRoleKey);
  if (auth instanceof Response) return auth;

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    const db = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const { vendor_id } = body;
    const created_by = auth.user?.id ?? null;

    if (!vendor_id) return errorResponse('vendor_id is required', 400);

    const { data: vendor } = await db.from('vendors').select('id, name').eq('id', vendor_id).single();
    if (!vendor) return errorResponse('Vendor not found', 404);

    const { data, error } = await db.from('vendor_portal_tokens').insert({
      vendor_id,
      created_by,
      expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
    }).select('token').single();

    if (error) return errorResponse(error.message, 500);

    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:8080';
    const portalUrl = `${siteUrl}/vendor-portal/${data.token}`;

    return jsonResponse({ token: data.token, portal_url: portalUrl, vendor: vendor.name });
  } catch (err) {
    console.error('generate-vendor-token error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
