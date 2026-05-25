import { Link } from '@tanstack/react-router';
import type { ActivityItem } from '@/lib/mock-data';
import { Activity, Siren } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const entityTypeRoutes: Record<string, string> = {
  alert: '/alerts',
  control: '/controls',
  incident: '/incidents',
  policy: '/policies',
  review: '/personnel',
  integration: '/integrations',
};

export function ActivityFeed({ items, isLoading }: { items: ActivityItem[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-lg bg-chart-2/10 flex items-center justify-center">
          <Activity className="h-4 w-4 text-chart-2" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground">Recent Activity</h3>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Siren className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
          <p className="text-xs text-muted-foreground mt-1">Activity from the last 24 hours will appear here</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const route = entityTypeRoutes[item.entityType] || '/';
            return (
              <Link
                key={item.id}
                to={route}
                className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-accent/40 transition-colors group"
              >
                <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 shadow-sm" role="img" aria-label={`${item.actor} avatar`}>
                  {item.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground leading-snug">
                    <span className="font-semibold">{item.actor}</span>{' '}
                    <span className="text-muted-foreground">{item.action}</span>{' '}
                    <span className="font-medium text-primary group-hover:underline">{item.entity}</span>
                  </p>
                  <span className="text-[11px] text-muted-foreground">{item.timestamp}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}