import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createRateLimitGuard } from '../_shared/rate-limit.ts';

const rateLimit = createRateLimitGuard();

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const rlRes = rateLimit(req);
  if (rlRes) return rlRes;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return errorResponse('Server config missing', 500);

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const { email, password, full_name } = body;

    if (!email || !password) return errorResponse('Email and password are required', 400);
    if (password.length < 8) return errorResponse('Password must be at least 8 characters', 400);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? email },
    });

    if (error) return errorResponse(error.message, 400);

    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    return jsonResponse({
      user: { id: data.user.id, email: data.user.email },
      auto_confirmed: true,
    });
  } catch (err) {
    console.error('signup-handler error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
