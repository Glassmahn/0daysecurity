import {
  ShieldCheck, CheckCircle, XCircle, AlertTriangle,
  AlertCircle, Clock, FileWarning, UserX,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { KPIData } from '@/lib/mock-data';

const iconMap: Record<string, React.ElementType> = {
  'shield-check': ShieldCheck,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'clock': Clock,
  'file-warning': FileWarning,
  'user-x': UserX,
};

export function KPIStrip({ data, period }: { data: KPIData[]; period: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      {data.map((kpi) => {
        const Icon = iconMap[kpi.icon] || ShieldCheck;
        const isPositive = kpi.label.includes('Passing') || kpi.label === 'Compliance Score' || kpi.label === 'MTTA';
        const deltaPositive = isPositive ? kpi.delta > 0 : kpi.delta < 0;
        const deltaColor = deltaPositive ? 'text-status-passing' : 'text-status-failing';

        return (
          <Link
            key={kpi.label}
            to={kpi.href}
            className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              {kpi.delta !== 0 && (
                <div className={`flex items-center gap-0.5 text-xs ${deltaColor}`}>
                  {deltaPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(kpi.delta)}{kpi.deltaLabel.includes('%') ? '%' : ''}</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
          </Link>
        );
      })}
    </div>
  );
}
