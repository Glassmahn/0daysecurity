import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const frameworks = [
  { name: 'SOC 2 Type II', score: 87, change: 3, controls: { pass: 38, fail: 4, pending: 8 }, nextAudit: '2026-07-15', status: 'on_track' },
  { name: 'HIPAA', score: 82, change: 5, controls: { pass: 42, fail: 6, pending: 7 }, nextAudit: '2026-09-01', status: 'on_track' },
  { name: 'ISO 27001', score: 79, change: -2, controls: { pass: 85, fail: 12, pending: 17 }, nextAudit: '2026-11-20', status: 'at_risk' },
  { name: 'PCI DSS', score: 74, change: 1, controls: { pass: 190, fail: 28, pending: 32 }, nextAudit: '2026-06-30', status: 'at_risk' },
  { name: 'NIST CSF', score: 91, change: 4, controls: { pass: 95, fail: 3, pending: 10 }, nextAudit: '2027-01-15', status: 'on_track' },
];

function scoreColor(score: number) {
  if (score >= 85) return 'text-green-500';
  if (score >= 70) return 'text-yellow-500';
  return 'text-destructive';
}

export function FrameworkScoreCards() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Framework Readiness</h3>
          <p className="text-xs text-muted-foreground">Click a framework to drill down</p>
        </div>
      </div>
      <div className="space-y-3">
        {frameworks.map(fw => {
          const total = fw.controls.pass + fw.controls.fail + fw.controls.pending;
          const passPct = Math.round((fw.controls.pass / total) * 100);
          return (
            <Link
              key={fw.name}
              to="/frameworks"
              className="block border rounded-lg p-3 space-y-2 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{fw.name}</span>
                  <Badge variant={fw.status === 'on_track' ? 'default' : 'secondary'} className="text-[10px]">
                    {fw.status === 'on_track' ? 'On Track' : 'At Risk'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-bold ${scoreColor(fw.score)}`}>{fw.score}%</span>
                  <span className={`flex items-center text-xs ${fw.change >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {fw.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(fw.change)}%
                  </span>
                </div>
              </div>
              <Progress value={passPct} className="h-1.5" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />{fw.controls.pass}</span>
                  <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" />{fw.controls.fail}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-yellow-500" />{fw.controls.pending}</span>
                </div>
                <span>Audit: {fw.nextAudit}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
