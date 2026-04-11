import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { KPIStrip } from '@/components/dashboard/KPIStrip';
import { CompliancePosture } from '@/components/dashboard/CompliancePosture';
import { PriorityQueue } from '@/components/dashboard/PriorityQueue';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { ComplianceTrendChart } from '@/components/dashboard/ComplianceTrendChart';
import { RiskHeatmap } from '@/components/dashboard/RiskHeatmap';
import { ControlStatusDonut } from '@/components/dashboard/ControlStatusDonut';
import { IncidentTrendChart } from '@/components/dashboard/IncidentTrendChart';
import { VendorRiskRadar } from '@/components/dashboard/VendorRiskRadar';
import { FrameworkScoreCards } from '@/components/dashboard/FrameworkScoreCards';
import { kpiData, frameworkPostureData, priorityQueue, recentActivity } from '@/lib/mock-data';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
  head: () => ({
    meta: [
      { title: 'Dashboard — WatchDog Security' },
      { name: 'description', content: 'Compliance monitoring dashboard overview' },
    ],
  }),
});

const periods = ['24h', '7d', '30d', '90d'] as const;

function DashboardHome() {
  const [period, setPeriod] = useState<string>('7d');

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Meridian Health Tech — Compliance Overview</p>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Strip */}
      <KPIStrip data={kpiData} period={period} />

      {/* Row 1: Compliance Trend + Control Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ComplianceTrendChart />
        </div>
        <ControlStatusDonut />
      </div>

      {/* Row 2: Risk Heatmap + Security Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskHeatmap />
        <VendorRiskRadar />
      </div>

      {/* Row 3: Incident Trends + Compliance Posture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentTrendChart />
        <CompliancePosture data={frameworkPostureData} />
      </div>

      {/* Row 4: Framework Readiness + Priority Queue + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FrameworkScoreCards />
        <div className="lg:col-span-1">
          <PriorityQueue items={priorityQueue} />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed items={recentActivity} />
        </div>
      </div>

      {/* Freshness */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-1.5 w-1.5 rounded-full bg-status-passing animate-pulse-glow" />
        Last synced: 3 minutes ago
      </div>
    </div>
  );
}
