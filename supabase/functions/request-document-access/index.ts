import { corsHeaders, handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = Deno.env.get('FROM_ADDRESS') ?? 'ZeroDay Security <portal@zeroday.security>';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });

  try {
    const { name, email, company, document_request, accepted_nda } = await req.json();

    if (!name || !email || !document_request) {
      return errorResponse('name, email, and document_request are required', 400);
    }

    if (!accepted_nda) {
      return errorResponse('NDA must be accepted before requesting documents', 400);
    }

    const notifyEmail = Deno.env.get('NOTIFY_EMAIL') ?? 'security@zeroday.security';
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return errorResponse('Email service not configured', 500);
    }

    const emailBody = `
New Document Access Request
━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${name}
Email: ${email}
Company: ${company || 'Not provided'}
NDA Accepted: Yes

Requested Documents:
${document_request}

Submitted at: ${new Date().toISOString()}
    `.trim();

    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [notifyEmail],
        subject: `Document Access Request from ${name} at ${company || email}`,
        text: emailBody,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return errorResponse(`Email send failed: ${errText}`, 502);
    }

    return jsonResponse({ ok: true, message: 'Request submitted successfully' });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});
