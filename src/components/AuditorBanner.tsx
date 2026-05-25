import { useRole } from '@/hooks/use-role-context';
import { Eye, Shield } from 'lucide-react';

export function AuditorBanner() {
  const { isAuditor, role } = useRole();

  if (!isAuditor) return null;

  return (
    <div className="bg-chart-5/10 border-b border-chart-5/20 px-6 py-2.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-chart-5/20 flex items-center justify-center">
            <Eye className="h-4 w-4 text-chart-5" />
          </div>
          <div>
            <span className="text-sm font-semibold text-chart-5">
              Auditor Read-Only View
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              You are logged in as <strong className="text-foreground capitalize">{role}</strong> — all data is view-only
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-chart-5/15 text-chart-5 border border-chart-5/20">
            <Shield className="h-3 w-3" />
            Audit Preparation
          </span>
        </div>
      </div>
    </div>
  );
}
