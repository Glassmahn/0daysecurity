import { useNavigate } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';

interface RiskRow {
  category: string;
  current: number;
}

function cellColor(value: number): string {
  if (value <= 1) return 'bg-green-500/20 text-green-400';
  if (value === 2) return 'bg-green-500/30 text-green-300';
  if (value === 3) return 'bg-yellow-500/30 text-yellow-300';
  if (value === 4) return 'bg-orange-500/30 text-orange-300';
  return 'bg-red-500/40 text-red-300';
}

function cellLabel(value: number): string {
  if (value <= 1) return 'Low';
  if (value === 2) return 'Med-Low';
  if (value === 3) return 'Medium';
  if (value === 4) return 'High';
  return 'Critical';
}

export function RiskHeatmap({ data, isLoading }: { data?: RiskRow[]; isLoading?: boolean }) {
  const navigate = useNavigate();

  if (isLoading || !data) {
    return <Skeleton className="h-[320px] rounded-xl" />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">Risk Heatmap</h3>
        <p className="text-sm text-muted-foreground">No risk data available. Add risks to see the heatmap.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Risk Heatmap</h3>
          <p className="text-xs text-muted-foreground">Average risk score by category</p>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-green-500/30" />Low</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-yellow-500/30" />Med</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-orange-500/30" />High</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-red-500/40" />Crit</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-3">Category</th>
              <th className="text-center text-xs font-medium text-muted-foreground pb-2 px-1 w-[80px]">Score</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.category} onClick={() => navigate({ to: '/risk-register' })} className="cursor-pointer hover:bg-accent/30 transition-colors">
                <td className="text-xs font-medium text-foreground py-1 pr-3 hover:text-primary transition-colors">{row.category}</td>
                <td className="py-1 px-1">
                  <div className={`text-center text-[10px] font-semibold rounded-md py-1.5 ${cellColor(row.current)}`} title={cellLabel(row.current)}>
                    {cellLabel(row.current)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
