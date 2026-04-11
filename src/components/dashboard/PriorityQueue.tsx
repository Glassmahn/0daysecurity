import { AlertTriangle, ListChecks, FileWarning, Users, ChevronRight } from 'lucide-react';
import type { PriorityItem } from '@/lib/mock-data';

const typeIcons: Record<string, React.ElementType> = {
  alert: AlertTriangle,
  control: ListChecks,
  evidence: FileWarning,
  review: Users,
};

const severityStyles: Record<string, string> = {
  critical: 'bg-severity-critical/15 text-severity-critical border-severity-critical/30',
  high: 'bg-severity-high/15 text-severity-high border-severity-high/30',
  medium: 'bg-severity-medium/15 text-severity-medium border-severity-medium/30',
};

export function PriorityQueue({ items }: { items: PriorityItem[] }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Priority Queue</h3>
        <span className="text-xs text-muted-foreground">{items.length} items</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = typeIcons[item.type] || AlertTriangle;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md bg-surface hover:bg-surface-raised transition-colors group cursor-pointer"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${severityStyles[item.severity]}`}>
                {item.severity}
              </span>
              <span className="text-sm text-foreground truncate flex-1">{item.title}</span>
              <span className="text-xs text-muted-foreground shrink-0">{item.age}</span>
              <button className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-0.5">
                {item.action} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
