import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import type { SortDirection } from '@/hooks/use-table-sort';

interface SortableHeaderProps {
  label: string;
  column: string;
  currentColumn: string | null;
  direction: SortDirection;
  onSort: (column: string) => void;
  className?: string;
}

export function SortableHeader({ label, column, currentColumn, direction, onSort, className = '' }: SortableHeaderProps) {
  const active = currentColumn === column;

  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-muted-foreground select-none cursor-pointer hover:text-foreground transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {active && direction === 'asc' ? (
          <ArrowUp className="h-3 w-3 text-primary" />
        ) : active && direction === 'desc' ? (
          <ArrowDown className="h-3 w-3 text-primary" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </div>
    </th>
  );
}
