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
    const event = body.event;
    const payload = body.payload ?? {};

    if (!event) return errorResponse('event is required', 400);

    const { data: endpoints } = await db
      .from('webhook_endpoints')
      .select('*')
      .eq('status', 'active')
      .contains('events', [event]);

    if (!endpoints || endpoints.length === 0) {
      return jsonResponse({ delivered: 0, message: 'No matching webhook endpoints' });
    }

    const results: Array<{ endpoint_id: string; name: string; status: string; response_code: number | null; attempts: number }> = [];

    for (const ep of endpoints) {
      let status = 'delivered';
      let responseCode: number | null = null;
      let responseBody: string | null = null;
      let attempts = 0;
      const maxAttempts = 3;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        attempts = attempt;
        try {
          const res = await fetch(ep.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Secret': ep.secret,
              'X-Event-Type': event,
              'X-Delivery-Attempt': String(attempt),
              'User-Agent': 'ZeroDay-Webhook/1.0',
            },
            body: JSON.stringify({
              event,
              payload,
              delivered_at: new Date().toISOString(),
              attempt,
            }),
          });
          responseCode = res.status;
          responseBody = await res.text().catch(() => null);
          if (responseCode >= 200 && responseCode < 300) {
            status = 'delivered';
            break;
          }
          status = 'failed';
          if (attempt < maxAttempts) {
            const backoff = Math.pow(2, attempt) * 1000;
            await new Promise(r => setTimeout(r, backoff));
          }
        } catch (err) {
          status = 'failed';
          responseBody = err instanceof Error ? err.message : String(err);
          if (attempt < maxAttempts) {
            const backoff = Math.pow(2, attempt) * 1000;
            await new Promise(r => setTimeout(r, backoff));
          }
        }
      }

      await db.from('webhook_deliveries').insert({
        endpoint_id: ep.id,
        event,
        payload,
        status,
        response_code: responseCode,
        response_body: responseBody,
        attempts,
      });

      if (status === 'delivered') {
        await db.from('webhook_endpoints').update({ last_sent_at: new Date().toISOString() }).eq('id', ep.id);
      }

      results.push({ endpoint_id: ep.id, name: ep.name, status, response_code: responseCode, attempts });
    }

    return jsonResponse({
      delivered: results.filter(r => r.status === 'delivered').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    });
  } catch (err) {
    console.error('deliver-webhooks error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
