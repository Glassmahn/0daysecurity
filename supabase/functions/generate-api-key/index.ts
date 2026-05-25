import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { createRateLimitGuard } from '../_shared/rate-limit.ts';

const rateLimit = createRateLimitGuard();

function generateKey(): { raw: string; prefix: string } {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const buf = crypto.getRandomValues(new Uint8Array(40));
  const raw = 'zd_sk_' + Array.from(buf, b => chars[b % 36]).join('');
  return { raw, prefix: raw.slice(0, 12) };
}

async function sha256Hex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

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
    const db = createClient(supabaseUrl, serviceRoleKey);
    const userId = auth.isServiceRole ? null : auth.user?.id;

    // POST = create new key
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const name = (body.name ?? '').trim();
      if (!name) return errorResponse('Key name is required', 400);
      if (name.length > 255) return errorResponse('Key name too long', 400);

      const { raw, prefix } = generateKey();
      const keyHash = await sha256Hex(raw);

      const { error: insertErr } = await db.from('api_keys').insert({
        name,
        key_hash: keyHash,
        key_prefix: prefix,
        created_by: userId,
      });

      if (insertErr) return errorResponse('Failed to create API key: ' + insertErr.message, 500);

      return jsonResponse({ key: raw, prefix, name });
    }

    // PATCH = revoke a key
    if (req.method === 'PATCH') {
      const body = await req.json().catch(() => ({}));
      const prefix = (body.prefix ?? '').trim();
      if (!prefix) return errorResponse('Key prefix is required', 400);

      const { error: updateErr } = await db.from('api_keys')
        .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: userId })
        .eq('key_prefix', prefix);

      if (updateErr) return errorResponse('Failed to revoke key: ' + updateErr.message, 500);

      return jsonResponse({ revoked: true, prefix });
    }

    return errorResponse('Method not allowed', 405);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
