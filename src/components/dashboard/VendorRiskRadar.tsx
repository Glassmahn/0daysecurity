import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

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

const tooltipStyle = {
  background: 'oklch(0.2 0.025 260)',
  border: '1px solid oklch(0.25 0.02 260)',
  borderRadius: '6px',
  fontSize: '12px',
  color: 'oklch(0.93 0.01 250)',
};

export function VendorRiskRadar() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Security Posture Radar</h3>
          <p className="text-xs text-muted-foreground">Your score vs. industry benchmark</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.65 0.19 155)' }} />You</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: 'oklch(0.5 0.12 250)' }} />Benchmark</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="oklch(0.25 0.02 260)" />
          <PolarAngleAxis dataKey="category" tick={{ fill: 'oklch(0.6 0.02 250)', fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, '']} />
          <Radar name="Your Score" dataKey="score" stroke="oklch(0.65 0.19 155)" fill="oklch(0.65 0.19 155)" fillOpacity={0.25} strokeWidth={2} />
          <Radar name="Benchmark" dataKey="benchmark" stroke="oklch(0.5 0.12 250)" fill="oklch(0.5 0.12 250)" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 4" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
