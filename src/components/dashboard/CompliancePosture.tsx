import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PostureData {
  name: string;
  passing: number;
  failing: number;
  inProgress: number;
  na: number;
}

export function CompliancePosture({ data }: { data: PostureData[] }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Compliance Posture</h3>
        <span className="text-xs text-muted-foreground">By framework</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" barGap={2}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: 'oklch(0.75 0.015 250)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: 'oklch(0.2 0.025 260)',
              border: '1px solid oklch(0.25 0.02 260)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'oklch(0.93 0.01 250)',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', color: 'oklch(0.6 0.02 250)' }}
          />
          <Bar dataKey="passing" name="Passing" fill="oklch(0.65 0.19 155)" radius={[0, 0, 0, 0]} stackId="a" />
          <Bar dataKey="inProgress" name="In Progress" fill="oklch(0.65 0.19 250)" stackId="a" />
          <Bar dataKey="failing" name="Failing" fill="oklch(0.55 0.22 25)" stackId="a" />
          <Bar dataKey="na" name="N/A" fill="oklch(0.35 0.02 250)" radius={[0, 4, 4, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
