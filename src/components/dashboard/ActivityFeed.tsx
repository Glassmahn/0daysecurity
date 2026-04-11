import { Link } from '@tanstack/react-router';
import type { ActivityItem } from '@/lib/mock-data';

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
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        <span className="text-xs text-muted-foreground">Last 24h</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const route = entityTypeRoutes[item.entityType] || '/';
          return (
            <Link
              key={item.id}
              to={route as '/'}
              className="flex items-start gap-3 rounded-md p-1.5 -mx-1.5 hover:bg-accent/40 transition-colors group"
            >
              <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground shrink-0 mt-0.5">
                {item.avatarInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{item.actor}</span>{' '}
                  <span className="text-muted-foreground">{item.action}</span>{' '}
                  <span className="font-medium text-primary group-hover:underline">{item.entity}</span>
                </p>
                <span className="text-xs text-muted-foreground">{item.timestamp}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
