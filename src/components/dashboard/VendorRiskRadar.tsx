import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from '@tanstack/react-router';
import { Crosshair, Siren } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const categoryRoutes: Record<string, string> = {
  'Data Security': '/controls',
  'Access Control': '/controls',
  'Incident Response': '/incidents',
  'Business Continuity': '/risk-register',
  'Vendor Mgmt': '/vendors',
  'Personnel': '/personnel',
  'Physical Security': '/controls',
  'Change Mgmt': '/controls',
};

export function VendorRiskRadar({ data, isLoading, isError }: { data?: { category: string; score: number; benchmark: number }[]; isLoading?: boolean; isError?: boolean }) {
  const navigate = useNavigate();
  const chartData = data ?? [];

  if (isLoading) {
    return <Skeleton className="h-[400px] rounded-xl" />;
  }

  if (isError) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Crosshair className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Security Posture Radar</h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Siren className="h-8 w-8 text-destructive mb-3 opacity-60" />
          <p className="text-sm font-medium text-destructive">Failed to load posture data</p>
          <p className="text-xs text-muted-foreground mt-1">Pull to retry or check your connection</p>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-chart-2/10 flex items-center justify-center">
            <Crosshair className="h-4 w-4 text-chart-2" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Security Posture Radar</h3>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Siren className="h-8 w-8 text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No posture data available yet</p>
          <p className="text-xs text-muted-foreground mt-1">Complete control assessments to generate radar data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-chart-2/10 flex items-center justify-center">
            <Crosshair className="h-4 w-4 text-chart-2" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Security Posture Radar</h3>
            <p className="text-xs text-muted-foreground">Click a category to drill down</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-status-passing" />You</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Benchmark</span>
        </div>
      </div>
      <div role="button" tabIndex={0} aria-label="Security posture radar chart" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate({ to: '/controls' }); } }}>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%" onClick={(e) => {
          if (e?.activeLabel) {
            const route = categoryRoutes[e.activeLabel];
            if (route) navigate({ to: route as '/' });
          }
        }}>
          <PolarGrid stroke="var(--color-border)" strokeOpacity={0.6} />
          <PolarAngleAxis dataKey="category" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10, cursor: 'pointer' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontSize: '12px',
              color: 'var(--color-popover-foreground)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Radar name="Your Score" dataKey="score" stroke="var(--color-status-passing)" fill="var(--color-status-passing)" fillOpacity={0.2} strokeWidth={2} />
          <Radar name="Benchmark" dataKey="benchmark" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" />
        </RadarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}