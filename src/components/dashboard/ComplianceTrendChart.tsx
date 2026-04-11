import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { month: 'Oct', score: 72, controls: 68, evidence: 75 },
  { month: 'Nov', score: 74, controls: 71, evidence: 76 },
  { month: 'Dec', score: 76, controls: 74, evidence: 78 },
  { month: 'Jan', score: 79, controls: 78, evidence: 80 },
  { month: 'Feb', score: 82, controls: 81, evidence: 83 },
  { month: 'Mar', score: 85, controls: 84, evidence: 86 },
  { month: 'Apr', score: 87, controls: 86, evidence: 88 },
];

export function ComplianceTrendChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-foreground">Compliance Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">6-month compliance score progression</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-passing" />Overall</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Controls</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-warning" />Evidence</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-status-passing)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-status-passing)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradControls" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEvidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-status-warning)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-status-warning)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[60, 100]} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--color-popover-foreground)',
            }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Area type="monotone" dataKey="score" name="Overall" stroke="var(--color-status-passing)" fill="url(#gradScore)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-status-passing)' }} />
          <Area type="monotone" dataKey="controls" name="Controls" stroke="var(--color-primary)" fill="url(#gradControls)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-primary)' }} />
          <Area type="monotone" dataKey="evidence" name="Evidence" stroke="var(--color-status-warning)" fill="url(#gradEvidence)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-status-warning)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
