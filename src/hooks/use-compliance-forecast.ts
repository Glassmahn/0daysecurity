import { useMemo } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { frameworkCatalog } from '@/lib/framework-catalog';

interface ForecastResult {
  frameworkId: string;
  frameworkName: string;
  standard: string;
  currentPct: number;
  projectedDate: string | null;
  daysToTarget: number | null;
  scorePerDay: number | null;
  confidence: 'high' | 'medium' | 'low';
}

function linearRegression(values: { x: number; y: number }[]) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  const sumX = values.reduce((s, p) => s + p.x, 0);
  const sumY = values.reduce((s, p) => s + p.y, 0);
  const sumXY = values.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = values.reduce((s, p) => s + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssRes = values.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const ssTot = values.reduce((s, p) => s + (p.y - yMean) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

export function useComplianceForecast(): {
  forecasts: ForecastResult[];
  loading: boolean;
  error: string | null;
} {
  const { data: snapshots, loading, error } = useSupabaseCrud('compliance_snapshots');

  const forecasts = useMemo(() => {
    const enabled = frameworkCatalog.filter(f => f.enabled);

    return enabled.map(fw => {
      const fwSnapshots = (snapshots as Array<Record<string, unknown>>)
        .filter(s => s.framework_id === fw.id || s.framework === fw.standard)
        .map(s => ({
          date: new Date(s.snapshot_date as string).getTime(),
          score: Number(s.score_pct ?? 0),
        }))
        .sort((a, b) => a.date - b.date);

      const currentPct = fwSnapshots.length > 0
        ? fwSnapshots[fwSnapshots.length - 1].score
        : fw.compliancePct;

      if (fwSnapshots.length < 2) {
        return {
          frameworkId: fw.id,
          frameworkName: fw.name,
          standard: fw.standard,
          currentPct,
          projectedDate: null,
          daysToTarget: null,
          scorePerDay: null,
          confidence: 'low' as const,
        };
      }

      const now = Date.now();
      const points = fwSnapshots.map(s => ({
        x: (s.date - now) / (1000 * 60 * 60 * 24),
        y: s.score,
      }));

      const { slope, r2 } = linearRegression(points);

      if (slope <= 0) {
        return {
          frameworkId: fw.id,
          frameworkName: fw.name,
          standard: fw.standard,
          currentPct,
          projectedDate: null,
          daysToTarget: null,
          scorePerDay: slope,
          confidence: slope < 0 ? 'low' as const : 'low' as const,
        };
      }

      const pointsTo100 = 100 - currentPct;
      const daysToTarget = Math.ceil(pointsTo100 / slope);
      const projectedDate = new Date(Date.now() + daysToTarget * 24 * 60 * 60 * 1000);

      const confidence = r2 > 0.7 ? 'high' as const : r2 > 0.4 ? 'medium' as const : 'low' as const;

      return {
        frameworkId: fw.id,
        frameworkName: fw.name,
        standard: fw.standard,
        currentPct,
        projectedDate: projectedDate.toISOString().split('T')[0],
        daysToTarget,
        scorePerDay: Math.round(slope * 100) / 100,
        confidence,
      };
    });
  }, [snapshots]);

  return { forecasts, loading, error };
}
