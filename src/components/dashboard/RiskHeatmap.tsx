import { useNavigate } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame } from 'lucide-react';

interface RiskRow {
  category: string;
  current: number;
}

function cellColor(value: number): string {
  if (value <= 1) return 'bg-status-passing/15 text-status-passing';
  if (value === 2) return 'bg-status-passing/25 text-status-passing';
  if (value === 3) return 'bg-status-warning/20 text-status-warning';
  if (value === 4) return 'bg-severity-high/20 text-severity-high';
  return 'bg-severity-critical/20 text-severity-critical';
}

function cellLabel(value: number): string {
  if (value <= 1) return 'Low';
  if (value === 2) return 'Med-Low';
  if (value === 3) return 'Medium';
  if (value === 4) return 'High';
  return 'Critical';
}

function barWidth(value: number): string {
  return `${Math.min(value * 20, 100)}%`;
}

export function RiskHeatmap({ data, isLoading }: { data?: RiskRow[]; isLoading?: boolean }) {
  const navigate = useNavigate();

  if (isLoading || !data) {
    return <Skeleton className="h-[340px] rounded-xl" />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-2">Risk Heatmap</h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
            <Flame className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p>No risk data available. Add risks to see the heatmap.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-severity-high/10 flex items-center justify-center">
            <Flame className="h-4 w-4 text-severity-high" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Risk Heatmap</h3>
            <p className="text-xs text-muted-foreground">Average risk score by category</p>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {data.map(row => (
          <button key={row.category} onClick={() => navigate({ to: '/risk-register' })} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors cursor-pointer group text-left">
            <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors w-28 shrink-0 truncate">{row.category}</span>
            <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${row.current <= 2 ? 'bg-status-passing' : row.current <= 3 ? 'bg-status-warning' : 'bg-severity-critical'}`} style={{ width: barWidth(row.current) }} />
            </div>
            <span className={`text-[10px] font-semibold rounded-md py-1 px-2 min-w-[56px] text-center ${cellColor(row.current)}`}>
              {cellLabel(row.current)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}