const BASE_URL = 'https://zeroday.security';

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
  body { margin: 0; padding: 0; background: #0f1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
  .logo { font-size: 18px; font-weight: 700; color: #7c3aed; margin-bottom: 32px; }
  .card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 12px; padding: 24px; margin-bottom: 16px; }
  h1 { font-size: 20px; font-weight: 700; color: #f9fafb; margin: 0 0 8px; }
  p { font-size: 14px; color: #9ca3af; margin: 0 0 16px; line-height: 1.6; }
  .badge-critical { display: inline-block; padding: 2px 8px; border-radius: 9999px; background: rgba(239,68,68,0.15); color: #ef4444; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .badge-high { display: inline-block; padding: 2px 8px; border-radius: 9999px; background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .badge-warning { display: inline-block; padding: 2px 8px; border-radius: 9999px; background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  .item { padding: 12px 0; border-bottom: 1px solid #2a2d3a; }
  .item:last-child { border-bottom: none; padding-bottom: 0; }
  .item-title { font-size: 13px; font-weight: 500; color: #e5e7eb; margin-bottom: 4px; }
  .item-meta { font-size: 12px; color: #6b7280; }
  .btn { display: inline-block; padding: 10px 20px; background: #7c3aed; color: #fff !important; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 16px; }
  .stat { display: inline-block; text-align: center; padding: 12px 20px; background: #0f1117; border-radius: 8px; margin-right: 8px; margin-bottom: 8px; }
  .stat-value { font-size: 24px; font-weight: 700; color: #f9fafb; }
  .stat-label { font-size: 11px; color: #6b7280; }
  .footer { text-align: center; font-size: 11px; color: #4b5563; margin-top: 32px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="logo">⬡ ZeroDay Security</div>
  ${body}
  <div class="footer">
    You're receiving this because you enabled notifications in Settings.<br />
    <a href="${BASE_URL}/settings" style="color: #7c3aed;">Manage preferences</a>
  </div>
</div>
</body>
</html>`;
}

type AlertRow = { id: string; title: string; severity: string; message: string | null; created_at: string };
type EvidenceRow = { id: string; title: string; expires_at: string | null; control_id: string | null };

export function buildCriticalAlertEmail(alerts: AlertRow[], severity: 'critical' | 'high') {
  const label = severity === 'critical' ? 'Critical' : 'High Severity';
  const badgeClass = severity === 'critical' ? 'badge-critical' : 'badge-high';
  const count = alerts.length;

  const items = alerts.slice(0, 5).map(a => `
    <div class="item">
      <div class="item-title"><span class="${badgeClass}">${a.severity}</span> &nbsp;${a.title}</div>
      ${a.message ? `<div class="item-meta">${a.message.slice(0, 120)}</div>` : ''}
    </div>`).join('');

  const more = count > 5 ? `<p style="margin-top:12px;">…and ${count - 5} more open alerts.</p>` : '';

  const body = `
<div class="card">
  <h1>${count} ${label} Alert${count !== 1 ? 's' : ''} Require Attention</h1>
  <p>The following ${label.toLowerCase()} alerts are currently open and need review.</p>
  ${items}
  ${more}
  <a href="${BASE_URL}/alerts" class="btn">View All Alerts →</a>
</div>`;

  return {
    subject: `[ZeroDay] ${count} ${label} Alert${count !== 1 ? 's' : ''} Open`,
    html: layout(`${label} Alerts`, body),
  };
}

export function buildEvidenceExpiryEmail(evidence: EvidenceRow[]) {
  const count = evidence.length;

  const items = evidence.slice(0, 8).map(e => {
    const daysLeft = e.expires_at
      ? Math.ceil((new Date(e.expires_at).getTime() - Date.now()) / (86400 * 1000))
      : null;
    const urgency = daysLeft !== null && daysLeft <= 7
      ? `<span class="badge-critical">${daysLeft}d left</span>`
      : `<span class="badge-warning">${daysLeft}d left</span>`;
    return `
    <div class="item">
      <div class="item-title">${urgency} &nbsp;${e.title}</div>
      <div class="item-meta">Expires: ${e.expires_at ? new Date(e.expires_at).toLocaleDateString() : 'unknown'}</div>
    </div>`;
  }).join('');

  const more = count > 8 ? `<p style="margin-top:12px;">…and ${count - 8} more items expiring within 30 days.</p>` : '';

  const body = `
<div class="card">
  <h1>${count} Evidence Item${count !== 1 ? 's' : ''} Expiring Soon</h1>
  <p>The following evidence items expire within the next 30 days and may need to be renewed or replaced.</p>
  ${items}
  ${more}
  <a href="${BASE_URL}/evidence" class="btn">Review Evidence →</a>
</div>`;

  return {
    subject: `[ZeroDay] ${count} Evidence Item${count !== 1 ? 's' : ''} Expiring Soon`,
    html: layout('Evidence Expiring Soon', body),
  };
}

export function buildWeeklyDigestEmail(stats: { criticalCount: number; highCount: number; expiringCount: number }) {
  const body = `
<div class="card">
  <h1>Weekly Security Digest</h1>
  <p>Here's your weekly summary of open items requiring attention.</p>
  <div>
    <div class="stat">
      <div class="stat-value" style="color: #ef4444;">${stats.criticalCount}</div>
      <div class="stat-label">Critical Alerts</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #f59e0b;">${stats.highCount}</div>
      <div class="stat-label">High Alerts</div>
    </div>
    <div class="stat">
      <div class="stat-value" style="color: #f59e0b;">${stats.expiringCount}</div>
      <div class="stat-label">Expiring Evidence</div>
    </div>
  </div>
  <a href="${BASE_URL}/dashboard" class="btn">Open Dashboard →</a>
</div>`;

  return {
    subject: '[ZeroDay] Weekly Security Digest',
    html: layout('Weekly Digest', body),
  };
}
