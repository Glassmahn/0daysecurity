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

export function CompliancePosture({ data, isLoading }: { data: PostureData[]; isLoading?: boolean }) {
  const navigate = useNavigate();

  if (isLoading || data.length === 0) {
    return <Skeleton className="h-[340px] rounded-xl" />;
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