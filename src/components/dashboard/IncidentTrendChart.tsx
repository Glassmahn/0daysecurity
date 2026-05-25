import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';

interface TrendItem {
  month: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function IncidentTrendChart({ data, isLoading, isError }: { data?: TrendItem[]; isLoading?: boolean; isError?: boolean }) {
  const navigate = useNavigate();

  if (isLoading) {
    return <Skeleton className="h-[340px] rounded-xl" />;
  }

  if (isError) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Incident Trends</h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mb-3 opacity-60" />
          <p className="text-sm font-medium text-destructive">Failed to load incident trends</p>
          <p className="text-xs text-muted-foreground mt-1">Pull to retry or check your connection</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-severity-critical/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-severity-critical" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Incident Trends</h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No incident trend data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Incident data from the last 6 months will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-severity-critical/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-severity-critical" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Incident Trends</h3>
            <p className="text-xs text-muted-foreground">Click legend to filter by severity</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
            <button key={sev} onClick={() => navigate({ to: '/incidents', search: { severity: sev } })} className="flex items-center gap-1.5 hover:text-foreground text-muted-foreground transition-colors cursor-pointer">
              <span className={`h-2.5 w-2.5 rounded-full bg-severity-${sev}`} />
              <span className="capitalize">{sev}</span>
            </button>
          ))}
        </div>
      </div>
      <div role="button" tabIndex={0} aria-label="Incident trends chart" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate({ to: '/incidents' }); } }}>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} barCategoryGap="20%" onClick={() => navigate({ to: '/incidents' })}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
          <XAxis dataKey="month" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px', color: 'var(--color-popover-foreground)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} />
          <Bar dataKey="critical" name="Critical" fill="var(--color-severity-critical)" stackId="a" className="cursor-pointer" radius={[0, 0, 0, 0]} />
          <Bar dataKey="high" name="High" fill="var(--color-severity-high)" stackId="a" className="cursor-pointer" />
          <Bar dataKey="medium" name="Medium" fill="var(--color-severity-medium)" stackId="a" className="cursor-pointer" />
          <Bar dataKey="low" name="Low" fill="var(--color-severity-low)" radius={[4, 4, 0, 0]} stackId="a" className="cursor-pointer" />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}