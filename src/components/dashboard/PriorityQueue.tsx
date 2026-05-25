import { AlertTriangle, ListChecks, FileWarning, Users, ChevronRight, Zap, Siren } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { PriorityItem } from '@/lib/mock-data';
import { Skeleton } from '@/components/ui/skeleton';

const typeIcons: Record<string, React.ElementType> = {
  alert: AlertTriangle,
  control: ListChecks,
  evidence: FileWarning,
  review: Users,
};

const typeRouteConfig: Record<string, { to: string; search?: Record<string, string> }> = {
  alert: { to: '/alerts' },
  control: { to: '/controls', search: { status: 'failing' } },
  evidence: { to: '/evidence' },
  review: { to: '/personnel' },
};

const severityStyles: Record<string, string> = {
  critical: 'bg-severity-critical/12 text-severity-critical',
  high: 'bg-severity-high/12 text-severity-high',
  medium: 'bg-severity-medium/12 text-severity-medium',
};

export function PriorityQueue({ items, isLoading, isError }: { items: PriorityItem[]; isLoading?: boolean; isError?: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-severity-critical/10 flex items-center justify-center">
          <Zap className="h-4 w-4 text-severity-critical" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground">Priority Queue</h3>
          <p className="text-xs text-muted-foreground">{items.length} items need attention</p>
        </div>
      </div>
      {items.length === 0 && isError ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Unable to load priority items</p>
          <p className="text-xs text-muted-foreground mt-1">There was an error fetching the priority queue data</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Siren className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">All clear — no items need attention</p>
          <p className="text-xs text-muted-foreground mt-1">New alerts and tasks will appear here automatically</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => {
            const Icon = typeIcons[item.type] || AlertTriangle;
            const config = typeRouteConfig[item.type] || { to: '/alerts' };
            return (
              <Link
                key={item.id}
                to={config.to}
                search={config.search}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface/50 hover:bg-surface-raised hover:shadow-card border border-transparent hover:border-border/60 transition-all group"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${severityStyles[item.severity]}`}>
                  {item.severity}
                </span>
                <span className="text-[13px] text-foreground truncate flex-1">{item.title}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{item.age}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}