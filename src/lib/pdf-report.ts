import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { exportToCsv } from './export-csv';
import { format } from 'date-fns';

// ─── Colour palette (RGB tuples for jsPDF) ────────────────────────────────────
const C = {
  headerBg:   [15,  23,  42] as [number, number, number],   // slate-900
  headerFg:   [248, 250, 252] as [number, number, number],  // slate-50
  stripeBg:   [241, 245, 249] as [number, number, number],  // slate-100
  borderLine: [226, 232, 240] as [number, number, number],  // slate-200
  accent:     [59,  130, 246] as [number, number, number],  // blue-500
  success:    [34,  197, 94]  as [number, number, number],  // green-500
  warning:    [245, 158, 11]  as [number, number, number],  // amber-500
  danger:     [239, 68,  68]  as [number, number, number],  // red-500
  bodyText:   [30,  41,  59]  as [number, number, number],  // slate-800
  mutedText:  [100, 116, 139] as [number, number, number],  // slate-500
};

// ─── Shared document scaffold ─────────────────────────────────────────────────

function newDoc(title: string): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setProperties({ title, creator: 'ZeroDay Security', author: 'ZeroDay Security' });
  return doc;
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  const pageW = doc.internal.pageSize.getWidth();

  // Dark header band
  doc.setFillColor(...C.headerBg);
  doc.rect(0, 0, pageW, 28, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...C.headerFg);
  doc.text('ZeroDay Security', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...C.accent);
  doc.text(title, 14, 19);

  // Subtitle + date on right
  doc.setFontSize(8);
  doc.setTextColor(...C.mutedText.map(n => n + 80) as [number, number, number]);
  const dateStr = format(new Date(), 'MMMM d, yyyy');
  doc.text(dateStr, pageW - 14, 11, { align: 'right' });
  doc.setTextColor(...C.headerFg);
  doc.text(subtitle, pageW - 14, 19, { align: 'right' });

  // Thin accent line below header
  doc.setDrawColor(...C.accent);
  doc.setLineWidth(0.5);
  doc.line(0, 28, pageW, 28);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...C.mutedText);
    doc.text('ZeroDay Security — Confidential', 14, pageH - 6);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 6, { align: 'right' });
    doc.setDrawColor(...C.borderLine);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 10, pageW - 14, pageH - 10);
  }
}

function tableStyles() {
  return {
    headStyles: {
      fillColor: C.headerBg,
      textColor: C.headerFg,
      fontStyle: 'bold' as const,
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: C.bodyText },
    alternateRowStyles: { fillColor: C.stripeBg },
    tableLineColor: C.borderLine,
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14 },
    startY: 36,
  };
}

function statusBadgeColor(status: string): [number, number, number] {
  switch (status?.toLowerCase()) {
    case 'implemented': case 'connected': case 'resolved': case 'success': return C.success;
    case 'in_progress': case 'mitigating': case 'open': return C.warning;
    case 'failing': case 'failed': case 'critical': return C.danger;
    default: return C.mutedText;
  }
}

function pct(num: number, total: number) {
  return total > 0 ? `${Math.round((num / total) * 100)}%` : '0%';
}

// ─── Report: Compliance Summary ───────────────────────────────────────────────

export async function generateComplianceSummary() {
  const [{ data: frameworks }, { data: controls }] = await Promise.all([
    supabase.from('frameworks').select('name, total_controls, passing_controls, score').eq('enabled', true).order('name'),
    supabase.from('controls').select('status'),
  ]);

  const doc = newDoc('Compliance Summary Report');
  addHeader(doc, 'Compliance Summary Report', format(new Date(), 'yyyy-MM-dd'));

  // KPI strip (inline mini-table)
  const total = controls?.length ?? 0;
  const implemented = controls?.filter(c => c.status === 'implemented').length ?? 0;
  const inProgress  = controls?.filter(c => c.status === 'in_progress').length ?? 0;
  const failing     = controls?.filter(c => c.status === 'failing').length ?? 0;

  autoTable(doc, {
    ...tableStyles(),
    head: [['Total Controls', 'Implemented', 'In Progress', 'Failing', 'Overall Score']],
    body: [[
      String(total),
      `${implemented} (${pct(implemented, total)})`,
      `${inProgress} (${pct(inProgress, total)})`,
      `${failing} (${pct(failing, total)})`,
      pct(implemented, total),
    ]],
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const score = implemented / (total || 1);
        data.cell.styles.textColor = score >= 0.8 ? C.success : score >= 0.5 ? C.warning : C.danger;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // Framework breakdown
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.bodyText);
  const afterKpi = (doc as any).lastAutoTable.finalY + 8;
  doc.text('Framework Breakdown', 14, afterKpi);

  autoTable(doc, {
    ...tableStyles(),
    startY: afterKpi + 4,
    head: [['Framework', 'Total Controls', 'Passing', 'Score']],
    body: (frameworks ?? []).map(fw => [
      fw.name,
      String(fw.total_controls),
      String(fw.passing_controls),
      fw.score != null ? `${fw.score}%` : pct(fw.passing_controls, fw.total_controls),
    ]),
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const score = parseFloat(data.cell.raw as string);
        data.cell.styles.textColor = score >= 80 ? C.success : score >= 50 ? C.warning : C.danger;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  addFooter(doc);
  doc.save(`compliance-summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ─── Report: Control Status ───────────────────────────────────────────────────

export async function generateControlStatus() {
  const { data: controls } = await supabase
    .from('controls')
    .select('code, title, status, category, last_reviewed, frameworks(name)')
    .order('code');

  const doc = newDoc('Control Status Report');
  addHeader(doc, 'Control Status Report', format(new Date(), 'yyyy-MM-dd'));

  autoTable(doc, {
    ...tableStyles(),
    head: [['Code', 'Title', 'Category', 'Framework', 'Status', 'Last Reviewed']],
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 55 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 22 },
      5: { cellWidth: 26 },
    },
    body: (controls ?? []).map(c => {
      const fw = Array.isArray(c.frameworks) ? c.frameworks : (c.frameworks ? [c.frameworks] : []);
      return [
        c.code,
        c.title,
        c.category ?? '—',
        (fw as Array<{ name: string }>)[0]?.name ?? '—',
        c.status,
        c.last_reviewed ? format(new Date(c.last_reviewed), 'MMM d, yyyy') : '—',
      ];
    }),
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        data.cell.styles.textColor = statusBadgeColor(data.cell.raw as string);
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  addFooter(doc);
  doc.save(`control-status_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ─── Report: Risk Assessment ──────────────────────────────────────────────────

export async function generateRiskAssessment() {
  const { data: risks } = await supabase
    .from('risks')
    .select('title, category, likelihood, impact, risk_score, status, mitigation_plan')
    .order('risk_score', { ascending: false });

  const doc = newDoc('Risk Assessment Report');
  addHeader(doc, 'Risk Assessment Report', format(new Date(), 'yyyy-MM-dd'));

  // Summary line
  const total = risks?.length ?? 0;
  const critical = risks?.filter(r => (r.risk_score ?? 0) >= 15).length ?? 0;
  const high     = risks?.filter(r => (r.risk_score ?? 0) >= 10 && (r.risk_score ?? 0) < 15).length ?? 0;

  autoTable(doc, {
    ...tableStyles(),
    head: [['Total Risks', 'Critical (≥15)', 'High (10–14)', 'Open / Mitigating']],
    body: [[
      String(total),
      String(critical),
      String(high),
      String(risks?.filter(r => r.status !== 'resolved' && r.status !== 'accepted').length ?? 0),
    ]],
  });

  const afterSummary = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.bodyText);
  doc.text('Risk Register', 14, afterSummary);

  autoTable(doc, {
    ...tableStyles(),
    startY: afterSummary + 4,
    head: [['Title', 'Category', 'Likelihood', 'Impact', 'Score', 'Status']],
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 28 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18 },
      4: { cellWidth: 16 },
      5: { cellWidth: 22 },
    },
    body: (risks ?? []).map(r => [
      r.title,
      r.category ?? '—',
      String(r.likelihood ?? '—'),
      String(r.impact ?? '—'),
      String(r.risk_score ?? '—'),
      r.status,
    ]),
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const score = Number(data.cell.raw);
        data.cell.styles.textColor = score >= 15 ? C.danger : score >= 10 ? C.warning : C.mutedText;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.section === 'body' && data.column.index === 5) {
        data.cell.styles.textColor = statusBadgeColor(data.cell.raw as string);
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  addFooter(doc);
  doc.save(`risk-assessment_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ─── Report: Alert Trends ─────────────────────────────────────────────────────

export async function generateAlertTrends() {
  const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
  const { data: alerts } = await supabase
    .from('alerts')
    .select('title, severity, status, source, created_at')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false });

  const doc = newDoc('Alert Trends Report');
  addHeader(doc, 'Alert Trends Report (Last 30 Days)', format(new Date(), 'yyyy-MM-dd'));

  const total    = alerts?.length ?? 0;
  const critical = alerts?.filter(a => a.severity === 'critical').length ?? 0;
  const high     = alerts?.filter(a => a.severity === 'high').length ?? 0;
  const open     = alerts?.filter(a => a.status === 'open').length ?? 0;
  const resolved = alerts?.filter(a => a.status === 'resolved').length ?? 0;

  autoTable(doc, {
    ...tableStyles(),
    head: [['Total (30d)', 'Critical', 'High', 'Open', 'Resolved']],
    body: [[String(total), String(critical), String(high), String(open), String(resolved)]],
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 1) data.cell.styles.textColor = C.danger;
        if (data.column.index === 2) data.cell.styles.textColor = C.warning;
      }
    },
  });

  const afterSummary = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.bodyText);
  doc.text('Alert Log', 14, afterSummary);

  autoTable(doc, {
    ...tableStyles(),
    startY: afterSummary + 4,
    head: [['Title', 'Severity', 'Status', 'Source', 'Date']],
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 30 },
      4: { cellWidth: 32 },
    },
    body: (alerts ?? []).map(a => [
      a.title,
      a.severity,
      a.status,
      a.source ?? '—',
      format(new Date(a.created_at), 'MMM d, yyyy HH:mm'),
    ]),
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const sev = data.cell.raw as string;
        data.cell.styles.textColor = sev === 'critical' ? C.danger : sev === 'high' ? C.warning : C.mutedText;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.section === 'body' && data.column.index === 2) {
        data.cell.styles.textColor = statusBadgeColor(data.cell.raw as string);
      }
    },
  });

  addFooter(doc);
  doc.save(`alert-trends_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ─── Report: Evidence Coverage (CSV) ─────────────────────────────────────────

export async function generateEvidenceCoverage() {
  const { data: evidence } = await supabase
    .from('evidence')
    .select('title, type, status, source, expires_at, collected_at, controls(code, title)')
    .order('expires_at', { ascending: true });

  const rows = (evidence ?? []).map(e => ({
    Title: e.title,
    Type: e.type,
    Status: e.status,
    Source: e.source ?? '',
    Control: (e.controls as { code: string; title: string } | null)?.code ?? '',
    'Control Title': (e.controls as { code: string; title: string } | null)?.title ?? '',
    'Expires At': e.expires_at ? format(new Date(e.expires_at), 'yyyy-MM-dd') : '',
    'Collected At': e.collected_at ? format(new Date(e.collected_at), 'yyyy-MM-dd') : '',
  }));

  exportToCsv(`evidence-coverage_${format(new Date(), 'yyyy-MM-dd')}`, rows);
}

// ─── Report: Executive Dashboard ─────────────────────────────────────────────

export async function generateExecutiveDashboard() {
  const [
    { data: frameworks },
    { data: controls },
    { data: alerts },
    { data: risks },
    { data: evidence },
  ] = await Promise.all([
    supabase.from('frameworks').select('name, total_controls, passing_controls, score').eq('enabled', true).order('name'),
    supabase.from('controls').select('status'),
    supabase.from('alerts').select('severity, status'),
    supabase.from('risks').select('risk_score, status'),
    supabase.from('evidence').select('status, expires_at'),
  ]);

  const doc = newDoc('Executive Dashboard Export');
  addHeader(doc, 'Executive Dashboard Export', format(new Date(), 'yyyy-MM-dd'));

  const total       = controls?.length ?? 0;
  const implemented = controls?.filter(c => c.status === 'implemented').length ?? 0;
  const overallScore = total > 0 ? Math.round((implemented / total) * 100) : 0;

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400_000);

  // KPIs
  autoTable(doc, {
    ...tableStyles(),
    head: [['Metric', 'Value']],
    body: [
      ['Overall Compliance Score', `${overallScore}%`],
      ['Frameworks Active', String(frameworks?.length ?? 0)],
      ['Total Controls', String(total)],
      ['Controls Implemented', `${implemented} (${pct(implemented, total)})`],
      ['Open Alerts (critical/high)', String(alerts?.filter(a => a.status === 'open' && ['critical', 'high'].includes(a.severity)).length ?? 0)],
      ['Open Risks', String(risks?.filter(r => r.status !== 'resolved' && r.status !== 'accepted').length ?? 0)],
      ['Evidence Expiring (30d)', String(evidence?.filter(e => e.expires_at && new Date(e.expires_at) <= in30 && new Date(e.expires_at) >= now).length ?? 0)],
    ],
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
    columnStyles: { 0: { cellWidth: 80 } },
  });

  // Framework scores
  const afterKpi = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.bodyText);
  doc.text('Framework Scores', 14, afterKpi);

  autoTable(doc, {
    ...tableStyles(),
    startY: afterKpi + 4,
    head: [['Framework', 'Controls', 'Passing', 'Score']],
    body: (frameworks ?? []).map(fw => [
      fw.name,
      String(fw.total_controls),
      String(fw.passing_controls),
      fw.score != null ? `${fw.score}%` : pct(fw.passing_controls, fw.total_controls),
    ]),
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const score = parseFloat(data.cell.raw as string);
        data.cell.styles.textColor = score >= 80 ? C.success : score >= 50 ? C.warning : C.danger;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  addFooter(doc);
  doc.save(`executive-dashboard_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ─── Report: Incident Summary (uses alerts as incident feed) ─────────────────

export async function generateIncidentSummary() {
  const { data: alerts } = await supabase
    .from('alerts')
    .select('title, severity, status, source, created_at, updated_at')
    .in('severity', ['critical', 'high'])
    .order('created_at', { ascending: false });

  const doc = newDoc('Incident Summary Report');
  addHeader(doc, 'Incident Summary Report', format(new Date(), 'yyyy-MM-dd'));

  const open       = alerts?.filter(a => a.status === 'open').length ?? 0;
  const escalated  = alerts?.filter(a => a.status === 'escalated').length ?? 0;
  const resolved   = alerts?.filter(a => a.status === 'resolved').length ?? 0;

  autoTable(doc, {
    ...tableStyles(),
    head: [['Total Critical/High', 'Open', 'Escalated', 'Resolved']],
    body: [[String(alerts?.length ?? 0), String(open), String(escalated), String(resolved)]],
  });

  const afterSummary = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.bodyText);
  doc.text('Critical & High Severity Incidents', 14, afterSummary);

  autoTable(doc, {
    ...tableStyles(),
    startY: afterSummary + 4,
    head: [['Title', 'Severity', 'Status', 'Source', 'Opened', 'Updated']],
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 27 },
      5: { cellWidth: 27 },
    },
    body: (alerts ?? []).map(a => [
      a.title,
      a.severity,
      a.status,
      a.source ?? '—',
      format(new Date(a.created_at), 'MMM d, yyyy'),
      format(new Date(a.updated_at), 'MMM d, yyyy'),
    ]),
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        data.cell.styles.textColor = (data.cell.raw as string) === 'critical' ? C.danger : C.warning;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.section === 'body' && data.column.index === 2) {
        data.cell.styles.textColor = statusBadgeColor(data.cell.raw as string);
      }
    },
  });

  addFooter(doc);
  doc.save(`incident-summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ─── Dispatch by report type ──────────────────────────────────────────────────

const GENERATORS: Record<string, () => Promise<void>> = {
  'rpt-1': generateComplianceSummary,
  'rpt-2': generateControlStatus,
  'rpt-3': generateEvidenceCoverage,
  'rpt-4': generateAlertTrends,
  'rpt-5': generateIncidentSummary,
  'rpt-7': generateRiskAssessment,
  'rpt-8': generateExecutiveDashboard,
};

export async function generateReport(reportId: string): Promise<void> {
  const fn = GENERATORS[reportId];
  if (!fn) throw new Error(`No generator for report ${reportId}`);
  await fn();
}
