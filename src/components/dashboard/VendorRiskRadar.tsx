import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from '@tanstack/react-router';

const data = [
  { category: 'Data Security', score: 82, benchmark: 75 },
  { category: 'Access Control', score: 88, benchmark: 80 },
  { category: 'Incident Response', score: 71, benchmark: 70 },
  { category: 'Business Continuity', score: 65, benchmark: 72 },
  { category: 'Vendor Mgmt', score: 58, benchmark: 65 },
  { category: 'Personnel', score: 90, benchmark: 78 },
  { category: 'Physical Security', score: 76, benchmark: 70 },
  { category: 'Change Mgmt', score: 84, benchmark: 75 },
];

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

export function VendorRiskRadar() {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-foreground">Security Posture Radar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Click a category to drill down</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-passing" />You</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Benchmark</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%" onClick={(e) => {
          if (e?.activeLabel) {
            const route = categoryRoutes[e.activeLabel];
            if (route) navigate({ to: route as '/' });
          }
        }}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis dataKey="category" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10, cursor: 'pointer' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'var(--color-popover-foreground)',
            }}
            formatter={(value: number) => [`${value}%`, '']}
          />
          <Radar name="Your Score" dataKey="score" stroke="var(--color-status-passing)" fill="var(--color-status-passing)" fillOpacity={0.25} strokeWidth={2} />
          <Radar name="Benchmark" dataKey="benchmark" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
