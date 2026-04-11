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

const tooltipStyle = {
  background: 'oklch(0.2 0.025 260)',
  border: '1px solid oklch(0.25 0.02 260)',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'oklch(0.93 0.01 250)',
};

export function ComplianceTrendChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Compliance Trend</h3>
          <p className="text-xs text-muted-foreground">6-month compliance score progression</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.65 0.19 155)' }} />Overall</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.65 0.19 250)' }} />Controls</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.7 0.15 60)' }} />Evidence</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.65 0.19 155)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.65 0.19 155)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradControls" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.65 0.19 250)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.65 0.19 250)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradEvidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.7 0.15 60)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.7 0.15 60)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 260)" />
          <XAxis dataKey="month" tick={{ fill: 'oklch(0.6 0.02 250)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[60, 100]} tick={{ fill: 'oklch(0.6 0.02 250)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, '']} />
          <Area type="monotone" dataKey="score" name="Overall" stroke="oklch(0.65 0.19 155)" fill="url(#gradScore)" strokeWidth={2} dot={{ r: 3, fill: 'oklch(0.65 0.19 155)' }} />
          <Area type="monotone" dataKey="controls" name="Controls" stroke="oklch(0.65 0.19 250)" fill="url(#gradControls)" strokeWidth={2} dot={{ r: 3, fill: 'oklch(0.65 0.19 250)' }} />
          <Area type="monotone" dataKey="evidence" name="Evidence" stroke="oklch(0.7 0.15 60)" fill="url(#gradEvidence)" strokeWidth={2} dot={{ r: 3, fill: 'oklch(0.7 0.15 60)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
