import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
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
  if (score >= 85) return 'text-status-passing';
  if (score >= 70) return 'text-status-warning';
  return 'text-status-failing';
}

export function FrameworkScoreCards({ data, isLoading, isError }: { data?: FrameworkData[]; isLoading?: boolean; isError?: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-[400px] rounded-xl" />;
  }

  if (isError) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-2">Framework Readiness</h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-destructive" />
          </div>
          <p className="font-medium text-destructive">Failed to load framework data</p>
          <p>Pull to retry or check your connection</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-2">Framework Readiness</h3>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
            <Shield className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p>No frameworks enabled. Add frameworks to track compliance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Framework Readiness</h3>
          <p className="text-xs text-muted-foreground">Click to drill down</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {data.map(fw => {
          const passPct = Math.round((fw.passing / (fw.total || 1)) * 100);
          const status = passPct >= 70 ? 'on_track' : 'at_risk';
          return (
            <Link key={fw.id} to="/frameworks" className="block border border-border/50 rounded-xl p-3.5 space-y-2.5 hover:border-primary/40 hover:shadow-card transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-semibold group-hover:text-primary transition-colors">{fw.name}</span>
                  <Badge variant={status === 'on_track' ? 'default' : 'secondary'} className="text-[10px] rounded-md">
                    {status === 'on_track' ? 'On Track' : 'At Risk'}
                  </Badge>
                </div>
                <span className={`text-lg font-display font-bold ${scoreColor(fw.score)}`}>{fw.score}%</span>
              </div>
              <Progress value={passPct} className="h-1.5" />
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-status-passing" />{fw.passing}</span>
                <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-status-failing" />{fw.failing}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-status-warning" />{fw.inProgress}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}