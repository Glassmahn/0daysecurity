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
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 stagger-children">
      {data.map((kpi) => {
        const Icon = iconMap[kpi.icon] || ShieldCheck;
        const isPositive = kpi.label.includes('Passing') || kpi.label === 'Compliance Score' || kpi.label === 'MTTA';
        const deltaPositive = isPositive ? kpi.delta > 0 : kpi.delta < 0;
        const deltaColor = deltaPositive ? 'text-status-passing' : 'text-status-failing';

        return (
          <Link
            key={kpi.label}
            to={kpi.href}
            className="group relative bg-card border border-border/60 rounded-xl p-4 hover:border-primary/40 hover:shadow-glow transition-all duration-300 overflow-hidden"
          >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-transparent" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {kpi.delta !== 0 && (
                  <div className={`flex items-center gap-0.5 text-[11px] font-medium ${deltaColor}`}>
                    {deltaPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{Math.abs(kpi.delta)}{kpi.deltaLabel.includes('%') ? '%' : ''}</span>
                  </div>
                )}
              </div>
              <div className="text-2xl font-display font-bold text-foreground tracking-tight">{kpi.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">{kpi.label}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}