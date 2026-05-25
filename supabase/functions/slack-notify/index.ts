import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  try {
    const { webhook_url, channel, message } = await req.json();

    if (!webhook_url) return errorResponse('webhook_url is required', 400);
    if (!message) return errorResponse('message is required', 400);

    const payload: Record<string, unknown> = {
      text: message,
      mrkdwn: true,
    };
    if (channel) payload.channel = channel;

    const res = await fetch(webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return errorResponse(`Slack returned ${res.status}: ${body}`, 502);
    }

    return jsonResponse({ ok: true, status: res.status });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
