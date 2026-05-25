import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  try {
    const { url, email, api_token, project_key, summary, description, priority } = await req.json();

    if (!url || !email || !api_token || !project_key || !summary) {
      return errorResponse('url, email, api_token, project_key, and summary are required', 400);
    }

    const auth = btoa(`${email}:${api_token}`);
    const body: Record<string, unknown> = {
      fields: {
        project: { key: project_key },
        summary,
        issuetype: { name: 'Task' },
      },
    };
    if (description) (body.fields as Record<string, unknown>).description = {
      type: 'doc',
      version: 1,
      content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }],
    };
    if (priority) (body.fields as Record<string, unknown>).priority = { name: priority };

    const res = await fetch(`${url.replace(/\/$/, '')}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return errorResponse(`Jira returned ${res.status}: ${data?.errors ? JSON.stringify(data.errors) : data?.errorMessages?.join(', ') ?? 'Unknown error'}`, 502);
    }

    return jsonResponse({ ok: true, key: data.key, self: data.self, status: res.status });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
