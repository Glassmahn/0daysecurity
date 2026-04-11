import { AlertTriangle, ListChecks, FileWarning, Users, ChevronRight, Zap } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { PriorityItem } from '@/lib/mock-data';

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

export function PriorityQueue({ items }: { items: PriorityItem[] }) {
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
      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = typeIcons[item.type] || AlertTriangle;
          const config = typeRouteConfig[item.type] || { to: '/alerts' };
          return (
            <Link
              key={item.id}
              to={config.to as '/'}
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
    </div>
  );
}