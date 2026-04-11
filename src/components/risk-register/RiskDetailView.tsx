import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { risks } from '@/lib/mock-data-extended';
import { controls } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Shield,
  Target,
  AlertTriangle,
  TrendingDown,
  User,
  Calendar,
  FileText,
  CheckCircle2,
} from 'lucide-react';

const statusStyles: Record<string, string> = {
  identified: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  mitigating: 'bg-status-in-progress/15 text-status-in-progress border-status-in-progress/30',
  accepted: 'bg-muted text-muted-foreground border-border',
  resolved: 'bg-status-passing/15 text-status-passing border-status-passing/30',
};

function scoreColor(score: number) {
  if (score >= 15) return 'bg-severity-critical text-primary-foreground';
  if (score >= 10) return 'bg-severity-high text-primary-foreground';
  if (score >= 6) return 'bg-severity-medium text-primary-foreground';
  return 'bg-status-passing text-primary-foreground';
}

function scoreLabelColor(score: number) {
  if (score >= 15) return 'text-severity-critical';
  if (score >= 10) return 'text-severity-high';
  if (score >= 6) return 'text-severity-medium';
  return 'text-status-passing';
}

function cellBg(score: number) {
  if (score >= 15) return 'bg-severity-critical/20 border-severity-critical/30';
  if (score >= 10) return 'bg-severity-high/20 border-severity-high/30';
  if (score >= 6) return 'bg-severity-medium/20 border-severity-medium/30';
  return 'bg-status-passing/10 border-status-passing/20';
}

// Enrichment: treatment plan steps per risk
const treatmentPlans: Record<string, { id: string; step: string; done: boolean; dueDate: string }[]> = {
  'r-1': [
    { id: 'tp-1', step: 'Audit all S3 buckets for encryption status', done: true, dueDate: '2026-04-05' },
    { id: 'tp-2', step: 'Enable SSE-S3 on identified unencrypted buckets', done: true, dueDate: '2026-04-08' },
    { id: 'tp-3', step: 'Deploy AWS Config rule to enforce encryption', done: false, dueDate: '2026-04-15' },
    { id: 'tp-4', step: 'Verify no public access via Access Analyzer', done: false, dueDate: '2026-04-18' },
    { id: 'tp-5', step: 'Update data classification inventory', done: false, dueDate: '2026-04-22' },
  ],
  'r-2': [
    { id: 'tp-6', step: 'Enumerate all admin accounts across systems', done: true, dueDate: '2026-04-02' },
    { id: 'tp-7', step: 'Enforce MFA on all admin accounts', done: true, dueDate: '2026-04-06' },
    { id: 'tp-8', step: 'Implement 90-day password rotation policy', done: false, dueDate: '2026-04-20' },
    { id: 'tp-9', step: 'Deactivate stale admin accounts (>90 days inactive)', done: false, dueDate: '2026-04-25' },
  ],
  'r-3': [
    { id: 'tp-10', step: 'Identify top 10 critical vendors', done: true, dueDate: '2026-03-30' },
    { id: 'tp-11', step: 'Send security assessment questionnaires', done: true, dueDate: '2026-04-05' },
    { id: 'tp-12', step: 'Review returned assessments and score vendors', done: false, dueDate: '2026-04-20' },
    { id: 'tp-13', step: 'Establish contractual security requirements', done: false, dueDate: '2026-05-01' },
  ],
};

// Map risk to control IDs for enrichment
const riskControlMap: Record<string, string[]> = {
  'r-1': ['c4', 'c5'],
  'r-2': ['c1', 'c2', 'c3'],
  'r-3': ['c8'],
  'r-4': ['c1', 'c3'],
  'r-5': ['c6', 'c7', 'c4'],
  'r-6': ['c9', 'c10', 'c11', 'c12', 'c5'],
  'r-7': ['c1', 'c2'],
  'r-8': ['c11'],
  'r-9': ['c6'],
  'r-10': ['c8'],
  'r-11': ['c7'],
  'r-12': [],
  'r-13': ['c4'],
  'r-14': ['c1'],
  'r-15': ['c11'],
};

const impactLabels = ['', 'Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
const likelihoodLabels = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

export function RiskDetailView({ riskId }: { riskId: string }) {
  const risk = risks.find((r) => r.id === riskId);
  const defaultPlan = [
    { id: 'tp-default', step: 'Define treatment actions', done: false, dueDate: '2026-05-01' },
  ];
  const plan = treatmentPlans[riskId] || defaultPlan;
  const [checkState, setCheckState] = useState<Record<string, boolean>>(
    Object.fromEntries(plan.map((s) => [s.id, s.done]))
  );

  if (!risk) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Risk not found</p>
        <Link to="/risk-register" className="text-primary hover:underline text-sm">← Back to risk register</Link>
      </div>
    );
  }

  const linkedControlData = (riskControlMap[riskId] || [])
    .map((cid) => controls.find((c) => c.id === cid))
    .filter(Boolean);

  const completedSteps = Object.values(checkState).filter(Boolean).length;
  const totalSteps = plan.length;

  // Residual score: reduce by treatment progress
  const residualFactor = Math.max(0.3, 1 - (completedSteps / totalSteps) * 0.6);
  const residualScore = Math.round(risk.riskScore * residualFactor);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/risk-register">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-muted-foreground">{risk.id.toUpperCase()}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${statusStyles[risk.status]}`}>
              {risk.status}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreColor(risk.riskScore)}`}>
              Score: {risk.riskScore}
            </span>
          </div>
          <h1 className="text-lg font-bold text-foreground mt-1">{risk.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
        </div>
      </div>

      {/* Meta strip */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-medium text-foreground">{risk.owner}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Category:</span>
          <span className="font-medium text-foreground">{risk.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Controls:</span>
          <span className="font-medium text-foreground">{linkedControlData.length}</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Risk Matrix + Scores */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Matrix Visualization */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Risk Position — Likelihood × Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {/* Y-axis labels */}
                <div className="flex flex-col-reverse justify-between py-0.5 pr-1 text-[10px] text-muted-foreground">
                  {[1, 2, 3, 4, 5].map((l) => (
                    <div key={l} className="h-12 flex items-center justify-end w-16 truncate">
                      {likelihoodLabels[l]}
                    </div>
                  ))}
                  <div className="h-4" />
                </div>

                <div className="flex-1">
                  <div className="grid grid-cols-5 gap-1">
                    {[5, 4, 3, 2, 1].map((likelihood) =>
                      [1, 2, 3, 4, 5].map((impact) => {
                        const score = likelihood * impact;
                        const isCurrentRisk = risk.likelihood === likelihood && risk.impact === impact;
                        const cellRisks = risks.filter(
                          (r) => r.likelihood === likelihood && r.impact === impact
                        );
                        return (
                          <div
                            key={`${likelihood}-${impact}`}
                            className={`h-12 rounded border ${cellBg(score)} flex items-center justify-center relative transition-all ${
                              isCurrentRisk ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-105' : ''
                            }`}
                          >
                            {isCurrentRisk ? (
                              <div className={`w-6 h-6 rounded-full ${scoreColor(score)} flex items-center justify-center`}>
                                <span className="text-[9px] font-bold">{score}</span>
                              </div>
                            ) : cellRisks.length > 0 ? (
                              <span className="text-[10px] text-muted-foreground font-medium">{cellRisks.length}</span>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* X-axis labels */}
                  <div className="grid grid-cols-5 gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="text-center text-[10px] text-muted-foreground truncate">
                        {impactLabels[i]}
                      </div>
                    ))}
                  </div>
                  <div className="text-center text-[10px] text-muted-foreground mt-1">Impact →</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inherent vs Residual Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Risk Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Inherent Risk</p>
                  <p className={`text-2xl font-bold ${scoreLabelColor(risk.riskScore)}`}>{risk.riskScore}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">L{risk.likelihood} × I{risk.impact}</p>
                </div>
                <div className="flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Residual Risk</p>
                  <p className={`text-2xl font-bold ${scoreLabelColor(residualScore)}`}>{residualScore}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{completedSteps}/{totalSteps} mitigated</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Likelihood: {likelihoodLabels[risk.likelihood]} ({risk.likelihood}/5)</p>
                  <Progress value={risk.likelihood * 20} className="h-1.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Impact: {impactLabels[risk.impact]} ({risk.impact}/5)</p>
                  <Progress value={risk.impact * 20} className="h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linked Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Linked Controls ({linkedControlData.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {linkedControlData.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No controls linked to this risk</p>
              ) : (
                <div className="space-y-2">
                  {linkedControlData.map((ctrl) => {
                    if (!ctrl) return null;
                    const ctrlStatusStyle: Record<string, string> = {
                      implemented: 'bg-status-passing/15 text-status-passing',
                      in_progress: 'bg-status-in-progress/15 text-status-in-progress',
                      failing: 'bg-status-failing/15 text-status-failing',
                      not_implemented: 'bg-muted text-muted-foreground',
                    };
                    return (
                      <div key={ctrl.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:bg-surface transition-colors">
                        <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">{ctrl.ref}</span>
                            <span className="text-sm font-medium text-foreground truncate">{ctrl.title}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{ctrl.framework}</span>
                            <span>·</span>
                            <span>{ctrl.category}</span>
                            <span>·</span>
                            <span>Last tested: {ctrl.lastTested || 'Never'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Progress value={ctrl.implementationPct} className="w-16 h-1.5" />
                          <span className="text-[10px] font-medium text-muted-foreground w-8">{ctrl.implementationPct}%</span>
                          <Badge variant="outline" className={`text-[9px] h-5 ${ctrlStatusStyle[ctrl.status] || ''}`}>
                            {ctrl.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Treatment Plan */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Treatment Plan</CardTitle>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{completedSteps} of {totalSteps} steps complete</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.map((item) => (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={checkState[item.id]}
                      onCheckedChange={(checked) =>
                        setCheckState((prev) => ({ ...prev, [item.id]: !!checked }))
                      }
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm transition-colors ${checkState[item.id] ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {item.step}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{item.dueDate}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mitigation Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Mitigation Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">{risk.mitigationPlan}</p>
              </div>
            </CardContent>
          </Card>

          {/* Risk Context */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Risk Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Risk appetite</span>
                <span className="font-medium text-foreground">{risk.riskScore <= 8 ? 'Within' : 'Exceeds'} tolerance</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Treatment type</span>
                <span className="font-medium text-foreground capitalize">{risk.status === 'accepted' ? 'Accept' : risk.status === 'resolved' ? 'Avoid' : 'Mitigate'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Inherent score</span>
                <span className={`font-bold ${scoreLabelColor(risk.riskScore)}`}>{risk.riskScore}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Residual score</span>
                <span className={`font-bold ${scoreLabelColor(residualScore)}`}>{residualScore}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Risk reduction</span>
                <span className="font-medium text-status-passing">
                  {risk.riskScore > 0 ? Math.round((1 - residualScore / risk.riskScore) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
