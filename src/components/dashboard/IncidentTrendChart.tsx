import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from '@tanstack/react-router';

const data = [
  { month: 'Nov', critical: 2, high: 5, medium: 8, low: 12 },
  { month: 'Dec', critical: 1, high: 4, medium: 10, low: 9 },
  { month: 'Jan', critical: 3, high: 6, medium: 7, low: 11 },
  { month: 'Feb', critical: 1, high: 3, medium: 9, low: 14 },
  { month: 'Mar', critical: 2, high: 4, medium: 6, low: 10 },
  { month: 'Apr', critical: 1, high: 2, medium: 5, low: 8 },
];

export function IncidentTrendChart() {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-foreground">Incident Trends</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Click a bar to view incidents</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-severity-critical" />Critical</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-severity-high" />High</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-severity-medium" />Medium</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-severity-low" />Low</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="20%" onClick={() => navigate({ to: '/incidents' })}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="month" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--color-popover-foreground)',
            }}
          />
          <Bar dataKey="critical" name="Critical" fill="var(--color-severity-critical)" radius={[0, 0, 0, 0]} stackId="a" className="cursor-pointer" />
          <Bar dataKey="high" name="High" fill="var(--color-severity-high)" stackId="a" className="cursor-pointer" />
          <Bar dataKey="medium" name="Medium" fill="var(--color-severity-medium)" stackId="a" className="cursor-pointer" />
          <Bar dataKey="low" name="Low" fill="var(--color-severity-low)" radius={[3, 3, 0, 0]} stackId="a" className="cursor-pointer" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
