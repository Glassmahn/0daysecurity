import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from '@tanstack/react-router';

const controlData = [
  { name: 'Implemented', value: 34, color: 'oklch(0.65 0.19 155)', filter: 'implemented' },
  { name: 'In Progress', value: 8, color: 'oklch(0.65 0.19 250)', filter: 'in_progress' },
  { name: 'Planned', value: 5, color: 'oklch(0.7 0.15 60)', filter: 'not_implemented' },
  { name: 'Not Started', value: 3, color: 'oklch(0.4 0.02 250)', filter: 'not_implemented' },
];

const total = controlData.reduce((s, d) => s + d.value, 0);
const implementedPct = Math.round((controlData[0].value / total) * 100);

const tooltipStyle = {
  background: 'oklch(0.2 0.025 260)',
  border: '1px solid oklch(0.25 0.02 260)',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'oklch(0.93 0.01 250)',
};

export function ControlStatusDonut() {
  const navigate = useNavigate();

  const handleClick = (_: unknown, index: number) => {
    const filter = controlData[index]?.filter || 'all';
    navigate({ to: '/controls', search: { status: filter } });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Control Status</h3>
          <p className="text-xs text-muted-foreground">{total} total controls</p>
        </div>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={controlData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              onClick={handleClick}
              className="cursor-pointer"
            >
              {controlData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`${value} controls`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{implementedPct}%</p>
            <p className="text-[10px] text-muted-foreground">Implemented</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {controlData.map(d => (
          <button
            key={d.name}
            onClick={() => navigate({ to: '/controls', search: { status: d.filter } })}
            className="flex items-center gap-2 text-xs hover:bg-accent/50 rounded px-1 py-0.5 transition-colors cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-medium text-foreground ml-auto">{d.value}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 text-center">Click to filter controls by status</p>
    </div>
  );
}
