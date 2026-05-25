import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { createRateLimitGuard } from '../_shared/rate-limit.ts';

const rateLimit = createRateLimitGuard();

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const rlRes = rateLimit(req);
  if (rlRes) return rlRes;

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }

  const auth = await authenticateRequest(req, supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', serviceRoleKey);
  if (auth instanceof Response) return auth;

  try {
    const db = createClient(supabaseUrl, serviceRoleKey);

  // Find the Jira integration config.
  const { data: jiraInt, error: fetchError } = await db
    .from('integrations')
    .select('*')
    .eq('provider', 'jira')
    .eq('status', 'connected')
    .single();

  if (fetchError || !jiraInt) {
    return new Response(JSON.stringify({ skipped: true, reason: 'Jira integration not connected' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const jiraConfig = jiraInt.config as Record<string, string> | null;
  const jiraUrl = jiraConfig?.url ?? '';
  const jiraEmail = jiraConfig?.email ?? '';
  const jiraToken = jiraConfig?.api_token ?? '';
  const jiraProject = jiraConfig?.project_key ?? 'SEC';

  if (!jiraUrl || !jiraEmail || !jiraToken) {
    return new Response(JSON.stringify({ skipped: true, reason: 'Jira config incomplete' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch failing controls that need Jira tickets.
  const { data: failingControls } = await db
    .from('controls')
    .select('id, code, title, description, status')
    .in('status', ['failing', 'not_started']);

  if (!failingControls?.length) {
    return new Response(JSON.stringify({ skipped: true, reason: 'No failing controls' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch existing tickets (stored in a jira_tickets table or we track via alerts).
  // For simplicity, we store ticket metadata in alerts with source='jira'.
  const { data: existingTickets } = await db
    .from('alerts')
    .select('description')
    .eq('source', 'jira')
    .eq('status', 'open');

  const existingControlIds = new Set(
    (existingTickets ?? [])
      .map(a => a.description ?? '')
      .filter(d => d.startsWith('ctrl:'))
      .map(d => d.replace('ctrl:', '')),
  );

  let created = 0;
  let errored = 0;

  for (const control of failingControls ?? []) {
    // Skip if we already have an open ticket for this control.
    if (existingControlIds.has(control.id)) continue;

    const summary = `[${control.code}] ${control.title} — remediation required`;
    const description = `
{panel:title=ZeroDay Auto-Remediation Ticket}
*Control:* ${control.code}
*Status:* ${control.status}
*Description:* ${control.description ?? 'No description provided'}
{panel}

This ticket was automatically created by ZeroDay's compliance monitoring system.
Please investigate the control failure and remediate.

*Suggested actions:*
. Review the control requirements
. Identify the root cause of the failure
. Implement the necessary changes
. Update the evidence collection
. Mark the control status as implemented
`;

    const auth = btoa(`${jiraEmail}:${jiraToken}`);

    try {
      const res = await fetch(`${jiraUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            project: { key: jiraProject },
            summary,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: description }],
                },
              ],
            },
            issuetype: { name: 'Task' },
            priority: control.status === 'failing' ? { name: 'High' } : { name: 'Medium' },
          },
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`Jira API error for ${control.code}: ${res.status} ${body}`);
        errored++;
        continue;
      }

      const issue = await res.json();

      // Store ticket reference as an alert so we can track it.
      await db.from('alerts').insert({
        title: `Jira ticket created: ${summary}`,
        severity: control.status === 'failing' ? 'high' : 'medium',
        status: 'open',
        source: 'jira',
        description: `ctrl:${control.id}\n${jiraUrl}/browse/${issue.key}`,
      });

      created++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Jira sync error for ${control.code}:`, message);
      errored++;
    }
  }

  return new Response(JSON.stringify({
    failing_count: failingControls.length,
    tickets_created: created,
    errors: errored,
    skipped_existing: failingControls.length - created - errored,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('jira-sync error:', message);
    return errorResponse(message, 500);
  }
});
