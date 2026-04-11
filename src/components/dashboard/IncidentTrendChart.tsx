import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { month: 'Nov', critical: 2, high: 5, medium: 8, low: 12 },
  { month: 'Dec', critical: 1, high: 4, medium: 10, low: 9 },
  { month: 'Jan', critical: 3, high: 6, medium: 7, low: 11 },
  { month: 'Feb', critical: 1, high: 3, medium: 9, low: 14 },
  { month: 'Mar', critical: 2, high: 4, medium: 6, low: 10 },
  { month: 'Apr', critical: 1, high: 2, medium: 5, low: 8 },
];

const tooltipStyle = {
  background: 'oklch(0.2 0.025 260)',
  border: '1px solid oklch(0.25 0.02 260)',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'oklch(0.93 0.01 250)',
};

export function IncidentTrendChart() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Incident Trends</h3>
          <p className="text-xs text-muted-foreground">Monthly incidents by severity</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.55 0.22 25)' }} />Critical</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.7 0.18 50)' }} />High</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.75 0.15 80)' }} />Medium</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.45 0.02 250)' }} />Low</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 260)" />
          <XAxis dataKey="month" tick={{ fill: 'oklch(0.6 0.02 250)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'oklch(0.6 0.02 250)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="critical" name="Critical" fill="oklch(0.55 0.22 25)" radius={[0, 0, 0, 0]} stackId="a" />
          <Bar dataKey="high" name="High" fill="oklch(0.7 0.18 50)" stackId="a" />
          <Bar dataKey="medium" name="Medium" fill="oklch(0.75 0.15 80)" stackId="a" />
          <Bar dataKey="low" name="Low" fill="oklch(0.45 0.02 250)" radius={[3, 3, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
