import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { KPIData, PriorityItem, ActivityItem } from '@/lib/mock-data';
import { ALERT_STATUS, CONTROL_STATUS, SEVERITY } from '@/lib/constants';

// ---------- helpers ----------

async function fetchControlCounts() {
  const { data, error } = await supabase.from('controls').select('status');
  if (error) throw error;
  const counts: Record<string, number> = {};
  (data ?? []).forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
  return counts;
}

async function fetchAlertCounts() {
  const { data, error } = await supabase.from('alerts').select('severity, status');
  if (error) throw error;
  let openCritical = 0, openHigh = 0;
  (data ?? []).forEach(r => {
    if (r.status !== ALERT_STATUS.RESOLVED && r.status !== ALERT_STATUS.DISMISSED) {
      if (r.severity === SEVERITY.CRITICAL) openCritical++;
      if (r.severity === SEVERITY.HIGH) openHigh++;
    }
  });
  return { openCritical, openHigh, total: data?.length ?? 0 };
}

async function fetchEvidenceExpiring() {
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const { count, error } = await supabase
    .from('evidence')
    .select('id', { count: 'exact', head: true })
    .gte('expires_at', now.toISOString())
    .lte('expires_at', in30.toISOString());
  if (error) throw error;
  return count ?? 0;
}

async function fetchFrameworkPosture() {
  const { data: frameworks, error: fErr } = await supabase.from('frameworks').select('id, name, score, total_controls, passing_controls, enabled');
  if (fErr) throw fErr;
  const enabled = (frameworks ?? []).filter(f => f.enabled);

  const { data: controls, error: cErr } = await supabase.from('controls').select('framework_id, status');
  if (cErr) throw cErr;

  return enabled.map(fw => {
    const fwControls = (controls ?? []).filter(c => c.framework_id === fw.id);
    let passing = 0, failing = 0, inProgress = 0, na = 0;
    fwControls.forEach(c => {
      if (c.status === CONTROL_STATUS.IMPLEMENTED) passing++;
      else if (c.status === CONTROL_STATUS.FAILING) failing++;
      else if (c.status === CONTROL_STATUS.IN_PROGRESS) inProgress++;
      else if (c.status === CONTROL_STATUS.NOT_APPLICABLE) na++;
    });
    // Use DB counts if no controls mapped yet
    if (fwControls.length === 0) {
      passing = fw.passing_controls;
      failing = 0;
      inProgress = 0;
      na = fw.total_controls - fw.passing_controls;
    }
    const total = passing + failing + inProgress + na || 1;
    return { name: fw.name, passing, failing, inProgress, na, total, score: fw.score ?? 0, id: fw.id };
  });
}

async function fetchIncidentTrend() {
  const { data, error } = await supabase.from('incidents').select('severity, created_at');
  if (error) throw error;
  // Group last 6 months
  const months: Record<string, { critical: number; high: number; medium: number; low: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('en', { month: 'short' });
    months[key] = { critical: 0, high: 0, medium: 0, low: 0 };
  }
  (data ?? []).forEach(inc => {
    const d = new Date(inc.created_at);
    const key = d.toLocaleString('en', { month: 'short' });
    if (months[key] && (inc.severity as string) in months[key]) {
      (months[key] as Record<string, number>)[inc.severity]++;
    }
  });
  return Object.entries(months).map(([month, counts]) => ({ month, ...counts }));
}

async function fetchRiskHeatmap() {
  const { data, error } = await supabase.from('risks').select('category, likelihood, impact, status');
  if (error) throw error;
  const cats: Record<string, number[]> = {};
  (data ?? []).forEach(r => {
    const cat = r.category || 'Uncategorized';
    if (!cats[cat]) cats[cat] = [];
    const score = Math.round(((r.likelihood ?? 1) + (r.impact ?? 1)) / 2);
    cats[cat].push(Math.min(score, 5));
  });
  return Object.entries(cats).map(([category, scores]) => ({
    category,
    current: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));
}

async function fetchPriorityQueue(): Promise<PriorityItem[]> {
  const items: PriorityItem[] = [];

  // Critical/high open alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, title, severity, created_at')
    .in('severity', [SEVERITY.CRITICAL, SEVERITY.HIGH])
    .not('status', 'in', `("${ALERT_STATUS.RESOLVED}","${ALERT_STATUS.DISMISSED}")`)
    .order('created_at', { ascending: false })
    .limit(5);
  (alerts ?? []).forEach(a => {
    items.push({
      id: a.id,
      type: 'alert',
      severity: a.severity as 'critical' | 'high',
      title: a.title,
      age: timeSince(a.created_at),
      action: 'Investigate',
    });
  });

  // Failing controls
  const { data: controls } = await supabase
    .from('controls')
    .select('id, title, created_at')
    .eq('status', CONTROL_STATUS.FAILING)
    .limit(3);
  (controls ?? []).forEach(c => {
    items.push({
      id: c.id,
      type: 'control',
      severity: 'high',
      title: c.title,
      age: timeSince(c.created_at),
      action: 'Remediate',
    });
  });

  // Sort: critical first, then high
  items.sort((a, b) => (a.severity === SEVERITY.CRITICAL ? 0 : 1) - (b.severity === SEVERITY.CRITICAL ? 0 : 1));
  return items.slice(0, 8);
}

async function fetchActivityFeed(): Promise<ActivityItem[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Fetch profile names for user_ids
  const userIds = [...new Set((data ?? []).map(d => d.user_id).filter(Boolean))] as string[];
  const profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds);
    (profiles ?? []).forEach(p => { profileMap[p.user_id] = p.display_name || 'User'; });
  }

  return data.map(log => {
    const actor = log.user_id ? (profileMap[log.user_id] || 'User') : 'System';
    const initials = actor.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return {
      id: log.id,
      actor,
      action: log.action,
      entity: log.entity_id?.slice(0, 8) ?? '',
      entityType: log.entity_type,
      timestamp: timeSince(log.created_at),
      avatarInitials: initials,
    };
  });
}

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// ---------- Combined fetch — single round-trip ----------

interface DashboardData {
  kpiData: KPIData[];
  controlDonutData: { name: string; value: number; color: string; filter: string }[];
  frameworkPosture: Awaited<ReturnType<typeof fetchFrameworkPosture>>;
  incidentTrend: Awaited<ReturnType<typeof fetchIncidentTrend>>;
  riskHeatmap: Awaited<ReturnType<typeof fetchRiskHeatmap>>;
  priorityQueue: PriorityItem[];
  activityFeed: ActivityItem[];
}

async function fetchAllDashboardData(): Promise<DashboardData> {
  const controlCountsPromise = fetchControlCounts();

  const [controlCounts, alertCounts, evidenceExpiring, frameworkPosture, incidentTrend, riskHeatmap, priorityQueue, activityFeed] = await Promise.all([
    controlCountsPromise,
    fetchAlertCounts(),
    fetchEvidenceExpiring(),
    fetchFrameworkPosture(),
    fetchIncidentTrend(),
    fetchRiskHeatmap(),
    fetchPriorityQueue(),
    fetchActivityFeed(),
  ]);

  const totalControls = Object.values(controlCounts).reduce((a, b) => a + b, 0) || 1;
  const passing = controlCounts[CONTROL_STATUS.IMPLEMENTED] || 0;
  const failing = controlCounts[CONTROL_STATUS.FAILING] || 0;
  const compliancePct = Math.round((passing / totalControls) * 100);

  return {
    kpiData: [
      { label: 'Compliance Score', value: `${compliancePct}%`, delta: 0, deltaLabel: '', href: '/frameworks', icon: 'shield-check', isPositive: true },
      { label: 'Controls Passing', value: passing, delta: 0, deltaLabel: '', href: '/controls', icon: 'check-circle', isPositive: true },
      { label: 'Controls Failing', value: failing, delta: 0, deltaLabel: '', href: '/controls', icon: 'x-circle', isPositive: false },
      { label: 'Open Critical', value: alertCounts.openCritical, delta: 0, deltaLabel: '', href: '/alerts', icon: 'alert-triangle', isPositive: false },
      { label: 'Open High', value: alertCounts.openHigh, delta: 0, deltaLabel: '', href: '/alerts', icon: 'alert-circle', isPositive: false },
      { label: 'Total Alerts', value: alertCounts.total, delta: 0, deltaLabel: '', href: '/alerts', icon: 'clock', isPositive: false },
      { label: 'Evidence Expiring', value: evidenceExpiring, delta: 0, deltaLabel: 'next 30 days', href: '/evidence', icon: 'file-warning', isPositive: false },
      { label: 'Frameworks', value: frameworkPosture.length, delta: 0, deltaLabel: '', href: '/frameworks', icon: 'shield-check', isPositive: true },
    ],
    controlDonutData: [
      { name: 'Implemented', value: controlCounts[CONTROL_STATUS.IMPLEMENTED] || 0, color: 'oklch(0.65 0.19 155)', filter: CONTROL_STATUS.IMPLEMENTED },
      { name: 'In Progress', value: controlCounts[CONTROL_STATUS.IN_PROGRESS] || 0, color: 'oklch(0.65 0.19 250)', filter: CONTROL_STATUS.IN_PROGRESS },
      { name: 'Failing', value: controlCounts[CONTROL_STATUS.FAILING] || 0, color: 'oklch(0.7 0.15 60)', filter: CONTROL_STATUS.FAILING },
      { name: 'Not Started', value: (controlCounts[CONTROL_STATUS.NOT_STARTED] || 0) + (controlCounts[CONTROL_STATUS.NOT_IMPLEMENTED] || 0), color: 'oklch(0.4 0.02 250)', filter: CONTROL_STATUS.NOT_IMPLEMENTED },
    ],
    frameworkPosture,
    incidentTrend,
    riskHeatmap,
    priorityQueue,
    activityFeed,
  };
}

// ---------- composite hook (single useQuery) ----------

export function useDashboardData() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'all'],
    queryFn: fetchAllDashboardData,
    staleTime: 60_000,
  });

  return {
    kpi: { data: data?.kpiData, isLoading, isError },
    controlDonut: { data: data?.controlDonutData, isLoading, isError },
    frameworkPosture: { data: data?.frameworkPosture, isLoading, isError },
    incidentTrend: { data: data?.incidentTrend, isLoading, isError },
    riskHeatmap: { data: data?.riskHeatmap, isLoading, isError },
    priorityQueue: { data: data?.priorityQueue, isLoading, isError },
    activityFeed: { data: data?.activityFeed, isLoading, isError },
  };
}
