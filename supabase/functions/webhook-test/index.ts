import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  try {
    const { url, method = 'POST', headers: reqHeaders, body: reqBody } = await req.json();

    if (!url) return errorResponse('url is required', 400);

    // SSRF guard: block requests to private/internal networks
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      const blockedPatterns = [
        /^127\.\d+\.\d+\.\d+$/,
        /^10\.\d+\.\d+\.\d+$/,
        /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
        /^192\.168\.\d+\.\d+$/,
        /^169\.254\.\d+\.\d+$/,
        /^0\.0\.0\.0$/,
        /^\[::1\]$/,
        /^localhost$/i,
        /\.local$/i,
        /\.internal$/i,
      ];
      if (blockedPatterns.some(p => p.test(hostname))) {
        return errorResponse('Requests to private/internal network addresses are not allowed', 403);
      }
    } catch {
      return errorResponse('Invalid URL', 400);
    }

    const start = performance.now();
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZeroDay-WebhookTest/1.0',
        ...(reqHeaders ?? {}),
      },
      body: reqBody ? JSON.stringify(reqBody) : undefined,
    });
    const elapsed = Math.round(performance.now() - start);
    const responseBody = await res.text().catch(() => null);

    return jsonResponse({
      ok: res.ok || res.status < 500,
      status: res.status,
      statusText: res.statusText,
      elapsed_ms: elapsed,
      body_preview: responseBody ? responseBody.slice(0, 2000) : null,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Connection failed', 502);
  }
});
