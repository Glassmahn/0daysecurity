import { createFileRoute } from '@tanstack/react-router';
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
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { Skeleton } from '@/components/ui/skeleton';
export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
  head: () => ({
    meta: [
      { title: 'Dashboard — ZeroDay Security' },
      { name: 'description', content: 'Compliance monitoring dashboard overview' },
    ],
  }),
});

function DashboardHome() {
  const { kpi, controlDonut, frameworkPosture, incidentTrend, riskHeatmap, priorityQueue, activityFeed } = useDashboardData();

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time compliance overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-passing/10 text-status-passing border border-status-passing/20">
            <div className="h-1.5 w-1.5 rounded-full bg-status-passing animate-pulse-glow" />
            <span className="font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      {kpi.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 stagger-children">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)}
        </div>
      ) : (
        <KPIStrip data={kpi.data ?? []} period="" />
      )}

      {/* Row 1: Compliance Trend + Control Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ComplianceTrendChart />
        </div>
        <ControlStatusDonut data={controlDonut.data} isLoading={controlDonut.isLoading} />
      </div>

      {/* Row 2: Risk Heatmap + Security Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RiskHeatmap data={riskHeatmap.data} isLoading={riskHeatmap.isLoading} />
        <VendorRiskRadar />
      </div>

      {/* Row 3: Incident Trends + Compliance Posture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <IncidentTrendChart data={incidentTrend.data} isLoading={incidentTrend.isLoading} />
        <CompliancePosture data={frameworkPosture.data ?? []} isLoading={frameworkPosture.isLoading} />
      </div>

      {/* Row 4: Framework Readiness + Priority Queue + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <FrameworkScoreCards data={frameworkPosture.data} isLoading={frameworkPosture.isLoading} />
        <div className="lg:col-span-1">
          <PriorityQueue items={priorityQueue.data ?? []} />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed items={activityFeed.data ?? []} />
        </div>
      </div>
    </div>
  );
}