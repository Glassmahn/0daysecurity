import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';

interface SnapshotPoint {
  date: string;
  score: number;
  controls: number;
  evidence: number;
}

async function fetchTrendData(): Promise<SnapshotPoint[]> {
  const { data, error } = await supabase
    .from('compliance_snapshots')
    .select('snapshot_date, overall_score, controls_passing_pct, evidence_valid_pct')
    .order('snapshot_date', { ascending: true })
    .limit(90);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return data.map(row => ({
    date: new Date(row.snapshot_date).toLocaleString('en', { month: 'short', day: 'numeric' }),
    score: Number(row.overall_score),
    controls: Number(row.controls_passing_pct),
    evidence: Number(row.evidence_valid_pct),
  }));
}

export function ComplianceTrendChart() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'complianceTrend'],
    queryFn: fetchTrendData,
    staleTime: 120_000,
  });

  const handleClick = (dataKey?: string) => {
    if (dataKey === 'controls') navigate({ to: '/controls' });
    else if (dataKey === 'evidence') navigate({ to: '/evidence' });
    else navigate({ to: '/frameworks' });
  };

  if (isLoading) {
    return <Skeleton className="h-[360px] rounded-xl" />;
  }

  const hasData = data && data.length > 0;

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Compliance Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasData ? `${data.length} daily snapshots` : 'No snapshots yet — first snapshot runs at midnight'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <button onClick={() => handleClick('score')} className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-status-passing" />Overall</button>
          <button onClick={() => handleClick('controls')} className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Controls</button>
          <button onClick={() => handleClick('evidence')} className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-status-warning" />Evidence</button>
        </div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} onClick={() => handleClick()}>
            <defs>
              <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-status-passing)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-status-passing)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradControls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradEvidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-status-warning)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-status-warning)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
            <XAxis dataKey="date" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ background: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px', color: 'var(--color-popover-foreground)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} formatter={(value: number) => [`${value}%`, '']} />
            <Area type="monotone" dataKey="score" name="Overall" stroke="var(--color-status-passing)" fill="url(#gradScore)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: 'var(--color-status-passing)', strokeWidth: 2, stroke: 'var(--color-card)' }} className="cursor-pointer" />
            <Area type="monotone" dataKey="controls" name="Controls" stroke="var(--color-primary)" fill="url(#gradControls)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--color-card)' }} className="cursor-pointer" />
            <Area type="monotone" dataKey="evidence" name="Evidence" stroke="var(--color-status-warning)" fill="url(#gradEvidence)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: 'var(--color-status-warning)', strokeWidth: 2, stroke: 'var(--color-card)' }} className="cursor-pointer" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground text-sm gap-2">
          <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p>Snapshots will appear here once the daily job runs.</p>
        </div>
      )}
    </div>
  );
}