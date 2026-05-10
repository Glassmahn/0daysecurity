import { Link } from '@tanstack/react-router';
import type { ActivityItem } from '@/lib/mock-data';
import { Activity } from 'lucide-react';

const entityTypeRoutes: Record<string, string> = {
  alert: '/alerts',
  control: '/controls',
  incident: '/incidents',
  policy: '/policies',
  review: '/personnel',
  integration: '/integrations',
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
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
      <div className="space-y-1">
        {items.map((item) => {
          const route = entityTypeRoutes[item.entityType] || '/';
          return (
            <Link
              key={item.id}
              to={route as '/'}
              className="flex items-start gap-3 rounded-xl p-2.5 hover:bg-accent/40 transition-colors group"
            >
              <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 shadow-sm">
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
    </div>
  );
}