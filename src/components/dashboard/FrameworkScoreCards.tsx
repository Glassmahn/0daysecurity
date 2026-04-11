import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';

interface FrameworkData {
  id: string;
  name: string;
  score: number;
  passing: number;
  failing: number;
  inProgress: number;
  na: number;
  total: number;
}

function scoreColor(score: number) {
  if (score >= 85) return 'text-green-500';
  if (score >= 70) return 'text-yellow-500';
  return 'text-destructive';
}

export function FrameworkScoreCards({ data, isLoading }: { data?: FrameworkData[]; isLoading?: boolean }) {
  if (isLoading || !data) {
    return <Skeleton className="h-[400px] rounded-lg" />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">Framework Readiness</h3>
        <p className="text-sm text-muted-foreground">No frameworks enabled. Add frameworks to track compliance.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Framework Readiness</h3>
          <p className="text-xs text-muted-foreground">Click a framework to drill down</p>
        </div>
      </div>
      <div className="space-y-3">
        {data.map(fw => {
          const passPct = Math.round((fw.passing / (fw.total || 1)) * 100);
          const status = passPct >= 70 ? 'on_track' : 'at_risk';
          return (
            <Link key={fw.id} to="/frameworks" className="block border rounded-lg p-3 space-y-2 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{fw.name}</span>
                  <Badge variant={status === 'on_track' ? 'default' : 'secondary'} className="text-[10px]">
                    {status === 'on_track' ? 'On Track' : 'At Risk'}
                  </Badge>
                </div>
                <span className={`text-lg font-bold ${scoreColor(fw.score)}`}>{fw.score}%</span>
              </div>
              <Progress value={passPct} className="h-1.5" />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />{fw.passing}</span>
                <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" />{fw.failing}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-yellow-500" />{fw.inProgress}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
