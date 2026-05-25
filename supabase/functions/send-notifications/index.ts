import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, handleCors, errorResponse } from '../_shared/cors.ts';
import { buildCriticalAlertEmail, buildEvidenceExpiryEmail, buildWeeklyDigestEmail } from './email-templates.ts';

const RESEND_API_URL = Deno.env.get('RESEND_API_URL') ?? 'https://api.resend.com/emails';
const FROM_ADDRESS = Deno.env.get('FROM_ADDRESS') ?? 'ZeroDay Security <notifications@zeroday.security>';

interface NotificationPrefs {
  user_id: string;
  email: string;
  critical_alerts_email: boolean;
  high_alerts_email: boolean;
  evidence_expiring_email: boolean;
  weekly_digest_email: boolean;
}

Deno.serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (req.headers.get('Authorization') !== `Bearer ${serviceKey}`) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }
  const resendKey   = Deno.env.get('RESEND_API_KEY');

  if (!resendKey) {
    console.warn('RESEND_API_KEY not set — skipping email delivery');
    return new Response(JSON.stringify({ skipped: true, reason: 'no RESEND_API_KEY' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Fetch all users who have email notifications enabled, along with their email address.
  const { data: prefs, error: prefsError } = await supabase
    .from('notification_preferences')
    .select(`
      user_id,
      critical_alerts_email,
      high_alerts_email,
      evidence_expiring_email,
      weekly_digest_email
    `);

  if (prefsError) {
    console.error('Failed to fetch notification_preferences:', prefsError);
    return errorResponse(prefsError.message, 500);
  }

  // Resolve email addresses from auth.users for each user_id.
  const userIds = (prefs ?? []).map(p => p.user_id);
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Failed to list auth users:', authError);
    return errorResponse(authError.message, 500);
  }

  const emailMap = new Map<string, string>(
    (authUsers.users ?? [])
      .filter(u => u.email && userIds.includes(u.id))
      .map(u => [u.id, u.email!])
  );

  const recipients: NotificationPrefs[] = (prefs ?? [])
    .filter(p => emailMap.has(p.user_id))
    .map(p => ({ ...p, email: emailMap.get(p.user_id)! }));

  if (recipients.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // Fetch data needed for notifications.
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: expiringEvidence }, { data: criticalAlerts }, { data: highAlerts }] = await Promise.all([
    supabase
      .from('evidence')
      .select('id, title, expires_at, control_id')
      .not('expires_at', 'is', null)
      .lte('expires_at', in30Days)
      .gte('expires_at', now.toISOString())
      .order('expires_at', { ascending: true }),
    supabase
      .from('alerts')
      .select('id, title, severity, message, created_at')
      .eq('severity', 'critical')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('alerts')
      .select('id, title, severity, message, created_at')
      .eq('severity', 'high')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const isWeeklyDigestDay = now.getDay() === 1; // Monday
  let sent = 0;

  for (const recipient of recipients) {
    const emails: Array<{ subject: string; html: string }> = [];

    // Critical alerts
    if (recipient.critical_alerts_email && criticalAlerts?.length) {
      emails.push(buildCriticalAlertEmail(criticalAlerts, 'critical'));
    }
    // High severity alerts
    if (recipient.high_alerts_email && highAlerts?.length) {
      emails.push(buildCriticalAlertEmail(highAlerts, 'high'));
    }
    // Evidence expiring
    if (recipient.evidence_expiring_email && expiringEvidence?.length) {
      emails.push(buildEvidenceExpiryEmail(expiringEvidence));
    }
    // Weekly digest (Mondays only)
    if (recipient.weekly_digest_email && isWeeklyDigestDay) {
      emails.push(buildWeeklyDigestEmail({
        criticalCount: criticalAlerts?.length ?? 0,
        highCount: highAlerts?.length ?? 0,
        expiringCount: expiringEvidence?.length ?? 0,
      }));
    }

    for (const mail of emails) {
      const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [recipient.email],
          subject: mail.subject,
          html: mail.html,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`Resend error for ${recipient.email}: ${res.status} ${body}`);
      } else {
        sent++;
      }
    }
  }

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('send-notifications error:', message);
    return errorResponse(message, 500);
  }
});
