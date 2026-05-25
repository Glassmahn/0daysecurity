import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

interface PostureData {
  name: string;
  passing: number;
  failing: number;
  inProgress: number;
  na: number;
}

export function CompliancePosture({ data, isLoading, isError }: { data: PostureData[]; isLoading?: boolean; isError?: boolean }) {
  const navigate = useNavigate();

  if (isLoading) {
    return <Skeleton className="h-[340px] rounded-xl" />;
  }

  if (isError) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Compliance Posture</h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-8 w-8 text-destructive mb-3 opacity-60" />
          <p className="text-sm font-medium text-destructive">Failed to load compliance data</p>
          <p className="text-xs text-muted-foreground mt-1">Pull to retry or check your connection</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-chart-1/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-chart-1" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Compliance Posture</h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No compliance data yet</p>
          <p className="text-xs text-muted-foreground mt-1">Enable frameworks and assess controls to populate this chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-chart-1/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-chart-1" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Compliance Posture</h3>
            <p className="text-xs text-muted-foreground">Click a bar to view framework</p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} layout="vertical" barGap={2} onClick={() => navigate({ to: '/frameworks' })}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={110} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12, cursor: 'pointer' }} />
          <Tooltip contentStyle={{ background: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px', color: 'var(--color-popover-foreground)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: 'var(--color-muted-foreground)' }} />
          <Bar dataKey="passing" name="Passing" fill="var(--color-status-passing)" stackId="a" className="cursor-pointer" />
          <Bar dataKey="inProgress" name="In Progress" fill="var(--color-primary)" stackId="a" className="cursor-pointer" />
          <Bar dataKey="failing" name="Failing" fill="var(--color-severity-critical)" stackId="a" className="cursor-pointer" />
          <Bar dataKey="na" name="N/A" fill="var(--color-status-na)" radius={[0, 4, 4, 0]} stackId="a" className="cursor-pointer" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}