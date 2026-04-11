import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart as PieIcon } from 'lucide-react';

interface DonutItem {
  name: string;
  value: number;
  color: string;
  filter: string;
}

export function ControlStatusDonut({ data, isLoading }: { data?: DonutItem[]; isLoading?: boolean }) {
  const navigate = useNavigate();

  if (isLoading || !data) {
    return <Skeleton className="h-[360px] rounded-xl" />;
  }

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const implementedPct = Math.round((data[0]?.value ?? 0) / total * 100);

  const handleClick = (_: unknown, index: number) => {
    const filter = data[index]?.filter || 'all';
    navigate({ to: '/controls', search: { status: filter } });
  };

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-chart-5/10 flex items-center justify-center">
          <PieIcon className="h-4 w-4 text-chart-5" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Control Status</h3>
          <p className="text-xs text-muted-foreground">{total} total controls</p>
        </div>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value" strokeWidth={0} onClick={handleClick} className="cursor-pointer" cornerRadius={4}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--color-popover)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px', color: 'var(--color-popover-foreground)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
              formatter={(value: number, name: string) => [`${value} controls`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-display font-bold text-foreground">{implementedPct}%</p>
            <p className="text-[10px] text-muted-foreground font-medium">Implemented</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {data.map(d => (
          <button key={d.name} onClick={() => navigate({ to: '/controls', search: { status: d.filter } })} className="flex items-center gap-2 text-xs hover:bg-accent/50 rounded-lg px-2 py-1.5 transition-colors cursor-pointer group">
            <span className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-card" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}40` }} />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">{d.name}</span>
            <span className="font-semibold text-foreground ml-auto">{d.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}