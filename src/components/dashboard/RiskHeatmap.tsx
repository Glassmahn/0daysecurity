import { useNavigate } from '@tanstack/react-router';

const heatmapData = [
  { category: 'Data Breach', q1: 4, q2: 3, q3: 2, q4: 3, current: 2 },
  { category: 'Access Violation', q1: 3, q2: 4, q3: 3, q4: 2, current: 3 },
  { category: 'Encryption Gap', q1: 2, q2: 2, q3: 3, q4: 3, current: 4 },
  { category: 'Vendor Risk', q1: 3, q2: 3, q3: 4, q4: 4, current: 5 },
  { category: 'Compliance Gap', q1: 2, q2: 1, q3: 2, q4: 2, current: 1 },
  { category: 'Phishing', q1: 4, q2: 5, q3: 3, q4: 2, current: 2 },
  { category: 'Insider Threat', q1: 1, q2: 2, q3: 2, q4: 3, current: 3 },
  { category: 'Config Drift', q1: 3, q2: 2, q3: 2, q4: 1, current: 2 },
];

const categoryRoutes: Record<string, string> = {
  'Data Breach': '/incidents',
  'Access Violation': '/controls',
  'Encryption Gap': '/controls',
  'Vendor Risk': '/vendors',
  'Compliance Gap': '/frameworks',
  'Phishing': '/incidents',
  'Insider Threat': '/incidents',
  'Config Drift': '/assets',
};

const periods = ['Q1', 'Q2', 'Q3', 'Q4', 'Now'];
const periodKeys = ['q1', 'q2', 'q3', 'q4', 'current'] as const;

function cellColor(value: number): string {
  if (value <= 1) return 'bg-green-500/20 text-green-400';
  if (value === 2) return 'bg-green-500/30 text-green-300';
  if (value === 3) return 'bg-yellow-500/30 text-yellow-300';
  if (value === 4) return 'bg-orange-500/30 text-orange-300';
  return 'bg-red-500/40 text-red-300';
}

function cellLabel(value: number): string {
  if (value <= 1) return 'Low';
  if (value === 2) return 'Med-Low';
  if (value === 3) return 'Medium';
  if (value === 4) return 'High';
  return 'Critical';
}

export function RiskHeatmap() {
  const navigate = useNavigate();

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Risk Heatmap</h3>
          <p className="text-xs text-muted-foreground">Click a category to drill down</p>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-green-500/30" />Low</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-yellow-500/30" />Med</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-orange-500/30" />High</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-red-500/40" />Crit</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-3 w-[140px]">Category</th>
              {periods.map(p => (
                <th key={p} className="text-center text-xs font-medium text-muted-foreground pb-2 px-1 w-[60px]">{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map(row => (
              <tr
                key={row.category}
                onClick={() => navigate({ to: categoryRoutes[row.category] as '/' })}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
              >
                <td className="text-xs font-medium text-foreground py-1 pr-3 hover:text-primary transition-colors">{row.category}</td>
                {periodKeys.map(key => (
                  <td key={key} className="py-1 px-1">
                    <div className={`text-center text-[10px] font-semibold rounded-md py-1.5 ${cellColor(row[key])}`} title={cellLabel(row[key])}>
                      {row[key]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
