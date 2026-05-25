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
    const frameworkIds: string[] = Array.isArray(body.framework_ids) ? body.framework_ids : [];

    // Get the user's org_id from user_roles
    let orgId: string | null | undefined;
    if (auth.user?.id) {
      const { data: userRole } = await db.from('user_roles').select('org_id').eq('user_id', auth.user.id).limit(1).maybeSingle();
      orgId = userRole?.org_id;
    } else if (auth.isServiceRole) {
      orgId = body.org_id ?? null;
    }
    if (!orgId) return errorResponse('Could not determine organization', 400);

    const [{ data: orgRows }, { data: frameworks }, { data: controls }, { data: evidence }] = await Promise.all([
      db.from('organization_settings').select('name').eq('org_id', orgId).limit(1).maybeSingle(),
      frameworkIds.length
        ? db.from('frameworks').select('*').in('id', frameworkIds).order('name')
        : db.from('frameworks').select('*').order('name'),
      db.from('controls').select('*').eq('org_id', orgId).order('code'),
      db.from('evidence').select('*, control:control_id (code, title)').eq('org_id', orgId).order('collected_at', { ascending: false }),
    ]);

    const orgName = orgRows?.name ?? 'Your Organization';

    const controlsByFramework: Record<string, any[]> = {};
    const evidenceByControl: Record<string, any[]> = {};
    for (const c of controls ?? []) {
      const fId = c.framework_id ?? 'unknown';
      if (!controlsByFramework[fId]) controlsByFramework[fId] = [];
      controlsByFramework[fId].push(c);
    }
    for (const e of evidence ?? []) {
      const cId = e.control_id ?? 'none';
      if (!evidenceByControl[cId]) evidenceByControl[cId] = [];
      evidenceByControl[cId].push(e);
    }

    const pdfBytes = await generatePdf(orgName, frameworks ?? [], controlsByFramework, evidenceByControl, evidence ?? []);

    const timestamp = Date.now();
    const filePath = `evidence-packages/${timestamp}_evidence_package.pdf`;

    const { error: uploadError } = await db.storage.from('evidence-files').upload(filePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: false,
    });

    if (uploadError) return errorResponse(uploadError.message, 500);

    const { data: { publicUrl } } = db.storage.from('evidence-files').getPublicUrl(filePath);

    return jsonResponse({
      url: publicUrl,
      path: filePath,
      frameworks_included: (frameworks ?? []).length,
      controls_included: (controls ?? []).length,
      evidence_included: (evidence ?? []).length,
    });
  } catch (err) {
    console.error('generate-evidence-package error:', err);
    return errorResponse(err instanceof Error ? err.message : 'Internal error', 500);
  }
});

async function generatePdf(
  orgName: string,
  frameworks: any[],
  controlsByFramework: Record<string, any[]>,
  evidenceByControl: Record<string, any[]>,
  allEvidence: any[],
): Promise<Uint8Array> {
  const { PDFDocument, rgb, StandardFonts } = await import('npm:pdf-lib@1.17.1');
  const statusRgb = (s: string | null) => {
    switch (s) {
      case 'implemented': return rgb(0.2, 0.6, 0.2);
      case 'partially_implemented': return rgb(0.8, 0.6, 0.1);
      case 'failing': return rgb(0.8, 0.2, 0.2);
      case 'not_implemented':
      case 'not_started': return rgb(0.6, 0.3, 0.3);
      default: return rgb(0.4, 0.4, 0.4);
    }
  };

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 100;

  page.drawText('Evidence Package', { x: margin, y, size: 28, font: bold, color: rgb(0.1, 0.1, 0.4) });
  y -= 40;
  page.drawText(orgName, { x: margin, y, size: 16, font, color: rgb(0.3, 0.3, 0.3) });
  y -= 30;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(`Generated: ${dateStr}`, { x: margin, y, size: 11, font, color: rgb(0.5, 0.5, 0.5) });
  y -= 25;
  const totalControls = Object.values(controlsByFramework).flat().length;
  page.drawText(`Frameworks: ${frameworks.length}  |  Controls: ${totalControls}  |  Evidence Items: ${allEvidence.length}`, { x: margin, y, size: 11, font, color: rgb(0.5, 0.5, 0.5) });

  y = 120;
  page.drawText('Prepared for audit and compliance review.', { x: margin, y, size: 10, font, color: rgb(0.6, 0.6, 0.6) });

  for (const fw of frameworks) {
    const ctrls = controlsByFramework[fw.id] ?? [];
    if (ctrls.length === 0) continue;

    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    page.drawText(fw.name, { x: margin, y, size: 18, font: bold, color: rgb(0.1, 0.1, 0.4) });
    y -= 22;
    if (fw.version) {
      page.drawText(`Version: ${fw.version}`, { x: margin, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) });
      y -= 16;
    }
    if (fw.description) {
      page.drawText(fw.description, { x: margin, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 20;
    }

    y -= 8;
    const colX = [margin, margin + 70, margin + 350];

    drawRow(page, ['Code', 'Control Title', 'Status'], colX, y, bold, rgb(1, 1, 1), rgb(0.15, 0.15, 0.45));
    y -= 18;

    for (const ctrl of ctrls) {
      if (y < 80) { page = doc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }

      drawRow(page, [
        ctrl.code,
        ctrl.title.length > 40 ? ctrl.title.slice(0, 39) + '...' : ctrl.title,
        ctrl.status?.replace(/_/g, ' ') ?? 'unknown',
      ], colX, y, font, statusRgb(ctrl.status), rgb(0.95, 0.95, 0.98));
      y -= 18;

      const evs = evidenceByControl[ctrl.id] ?? [];
      if (evs.length > 0) {
        if (y < 80) { page = doc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }

        page.drawText(`Evidence (${evs.length} items):`, { x: colX[0] + 8, y, size: 8, font: bold, color: rgb(0.3, 0.3, 0.3) });
        y -= 13;

        for (const ev of evs.slice(0, 10)) {
          if (y < 40) break;
          const evText = `  \u2022 ${ev.title}  [${ev.type}]  ${ev.status}  ${ev.collected_at ? new Date(ev.collected_at).toLocaleDateString() : ''}`;
          const truncated = evText.length > 90 ? evText.slice(0, 87) + '...' : evText;
          page.drawText(truncated, { x: colX[0] + 8, y: y - 9, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
          y -= 10;
        }
        if (evs.length > 10) {
          page.drawText(`... and ${evs.length - 10} more`, { x: colX[0] + 12, y: y - 9, size: 7, font, color: rgb(0.6, 0.6, 0.6) });
          y -= 11;
        }
        y -= 4;
      }
    }
  }

  page = doc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;
  page.drawText('Framework Summary', { x: margin, y, size: 18, font: bold, color: rgb(0.1, 0.1, 0.4) });
  y -= 28;

  const sumColX = [margin, margin + 200, margin + 310, margin + 370];
  drawRow(page, ['Framework', 'Controls', 'Passing', 'Score'], sumColX, y, bold, rgb(1, 1, 1), rgb(0.15, 0.15, 0.45));
  y -= 18;

  for (const fw of frameworks) {
    if (y < 60) { page = doc.addPage([pageWidth, pageHeight]); y = pageHeight - margin; }
    drawRow(page, [
      fw.name,
      String(fw.total_controls),
      String(fw.passing_controls),
      `${fw.score ?? 0}%`,
    ], sumColX, y, font, rgb(0.2, 0.2, 0.2), rgb(0.95, 0.95, 0.98));
    y -= 18;
  }

  page = doc.addPage([pageWidth, pageHeight]);
  y = pageHeight - margin;
  page.drawText('Auditor Sign-Off', { x: margin, y, size: 18, font: bold, color: rgb(0.1, 0.1, 0.4) });
  y -= 40;
  page.drawText('This evidence package contains all controls and evidence', { x: margin, y, size: 11, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 18;
  page.drawText(`as of ${dateStr}.`, { x: margin, y, size: 11, font, color: rgb(0.4, 0.4, 0.4) });

  y -= 60;
  page.drawText('Prepared by:', { x: margin, y, size: 11, font: bold, color: rgb(0.2, 0.2, 0.2) });
  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 200, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
  y -= 14;
  page.drawText('Name / Signature', { x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6) });

  y -= 40;
  page.drawText('Reviewed by:', { x: margin, y, size: 11, font: bold, color: rgb(0.2, 0.2, 0.2) });
  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 200, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });
  y -= 14;
  page.drawText('Name / Signature', { x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6) });

  y -= 40;
  page.drawText('Date:', { x: margin, y, size: 11, font: bold, color: rgb(0.2, 0.2, 0.2) });
  y -= 20;
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 200, y }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) });

  return doc.save();
}

function drawRow(page: any, texts: string[], colX: number[], y: number, font: any, textColor: any, bgColor: any) {
  const contentWidth = 512;
  const rowH = 18;
  page.drawRectangle({ x: colX[0], y: y - rowH + 3, width: contentWidth, height: rowH - 2, color: bgColor });
  for (let i = 0; i < texts.length; i++) {
    const x = colX[i] + 4;
    const nextX = colX[i + 1] ?? colX[colX.length - 1] + contentWidth;
    const maxW = nextX - colX[i] - 8;
    const size = i === 0 ? 8 : 9;
    page.drawText(texts[i], { x, y: y - 12, size, font, color: textColor, maxWidth: maxW });
  }
}
