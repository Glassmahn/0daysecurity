import { useComplianceForecast } from '@/hooks/use-compliance-forecast';
import { TrendingUp, Calendar, Loader2, AlertCircle } from 'lucide-react';

export function ComplianceForecastCard() {
  const { forecasts, loading, error } = useComplianceForecast();

  const validForecasts = forecasts.filter(f => f.projectedDate !== null);

  if (error) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5">
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          Failed to load forecast data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-chart-5/15 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-chart-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Compliance Forecast</h3>
            <p className="text-[11px] text-muted-foreground">Projected readiness dates</p>
          </div>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {validForecasts.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground text-center py-6">
          Not enough data to project. Enable frameworks and add compliance snapshots.
        </p>
      )}

      <div className="space-y-2">
        {validForecasts.map(fc => {
          const daysLeft = Math.ceil((new Date(fc.projectedDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <div key={fc.frameworkId} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-medium text-foreground truncate">{fc.frameworkName}</span>
                <span className="text-[11px] text-muted-foreground shrink-0">{fc.currentPct}%</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded ${
                  daysLeft < 90 ? 'bg-status-passing/15 text-status-passing' :
                  daysLeft < 180 ? 'bg-status-in-progress/15 text-status-in-progress' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <Calendar className="h-3 w-3" />
                  {fc.projectedDate}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
