import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

interface SnapshotPoint {
  date: string;
  score: number;
  controls: number;
}

async function fetchTrendData(): Promise<SnapshotPoint[]> {
  const { data, error } = await supabase
    .from('compliance_snapshots')
    .select('snapshot_date, score_pct, implemented, total_controls')
    .order('snapshot_date', { ascending: true })
    .limit(90);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  return data.map(row => ({
    date: new Date(row.snapshot_date).toLocaleString('en', { month: 'short', day: 'numeric' }),
    score: Number(row.score_pct),
    controls: Number(row.total_controls) > 0 ? Math.round((Number(row.implemented) / Number(row.total_controls)) * 100) : 0,
  }));
}

export function ComplianceTrendChart() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', 'complianceTrend'],
    queryFn: fetchTrendData,
    staleTime: 120_000,
    retry: 3,
    retryDelay: 2000,
  });

  const handleClick = (dataKey?: string) => {
    if (dataKey === 'controls') navigate({ to: '/controls' });
    else if (dataKey === 'evidence') navigate({ to: '/evidence' });
    else navigate({ to: '/frameworks' });
  };

  if (isLoading) {
    return <Skeleton className="h-[360px] rounded-xl" />;
  }

  if (error) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <div className="flex flex-col items-center justify-center h-[360px] gap-3">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <p className="text-sm font-medium text-destructive">Failed to load compliance data</p>
          <p className="text-xs text-muted-foreground max-w-sm text-center">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          <button onClick={() => refetch()} className="flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer">
            <RefreshCw className="h-3 w-3" /> Try again
          </button>
        </div>
      </div>
    );
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
        </div>
      </div>
      {hasData ? (
        <div role="button" tabIndex={0} aria-label="Compliance trend chart" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}>
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
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
            <XAxis dataKey="date" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={{ background: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px', color: 'var(--color-popover-foreground)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} formatter={(value: number) => [`${value}%`, '']} />
            <Area type="monotone" dataKey="score" name="Overall" stroke="var(--color-status-passing)" fill="url(#gradScore)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: 'var(--color-status-passing)', strokeWidth: 2, stroke: 'var(--color-card)' }} className="cursor-pointer" />
            <Area type="monotone" dataKey="controls" name="Controls" stroke="var(--color-primary)" fill="url(#gradControls)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'var(--color-card)' }} className="cursor-pointer" />
          </AreaChart>
        </ResponsiveContainer>
        </div>
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