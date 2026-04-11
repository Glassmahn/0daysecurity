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

export function IncidentTrendChart({ data, isLoading }: { data?: TrendItem[]; isLoading?: boolean }) {
  const navigate = useNavigate();

  if (isLoading || !data) {
    return <Skeleton className="h-[340px] rounded-xl" />;
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
  );
}