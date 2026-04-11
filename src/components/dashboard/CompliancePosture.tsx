import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from '@tanstack/react-router';

interface PostureData {
  name: string;
  passing: number;
  failing: number;
  inProgress: number;
  na: number;
}

export function CompliancePosture({ data }: { data: PostureData[] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground">Compliance Posture</h3>
        <span className="text-xs text-muted-foreground">Click a bar to view framework</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" barGap={2} onClick={() => navigate({ to: '/frameworks' })}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12, cursor: 'pointer' }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--color-popover-foreground)',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: 'var(--color-muted-foreground)' }}
          />
          <Bar dataKey="passing" name="Passing" fill="var(--color-status-passing)" radius={[0, 0, 0, 0]} stackId="a" className="cursor-pointer" />
          <Bar dataKey="inProgress" name="In Progress" fill="var(--color-primary)" stackId="a" className="cursor-pointer" />
          <Bar dataKey="failing" name="Failing" fill="var(--color-severity-critical)" stackId="a" className="cursor-pointer" />
          <Bar dataKey="na" name="N/A" fill="var(--color-status-na)" radius={[0, 4, 4, 0]} stackId="a" className="cursor-pointer" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
