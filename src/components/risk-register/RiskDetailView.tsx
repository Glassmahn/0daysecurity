import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { RiskTreatmentDialog } from '@/components/risks/RiskTreatmentDialog';
import {
  ArrowLeft,
  Shield,
  Target,
  AlertTriangle,
  TrendingDown,
  User,
  Calendar,
  FileText,
  ClipboardCheck,
  Loader2,
  Download,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

const impactLabels = ['', 'Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
const likelihoodLabels = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

export function RiskDetailView({ riskId }: { riskId: string }) {
  const [risk, setRisk] = useState<Tables<'risks'> | null>(null);
  const [allRisks, setAllRisks] = useState<Tables<'risks'>[]>([]);
  const [linkedControls, setLinkedControls] = useState<Tables<'controls'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treatmentOpen, setTreatmentOpen] = useState(false);
  const [checkState, setCheckState] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`risk-checklist-${riskId}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`risk-checklist-${riskId}`, JSON.stringify(checkState));
    } catch { /* localStorage may be full */ }
  }, [checkState, riskId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [riskRes, allRisksRes] = await Promise.all([
          supabase.from('risks').select('id, title, description, category, likelihood, impact, risk_score, status, mitigation_plan, owner_id, residual_likelihood, residual_impact, created_at, updated_at').eq('id', riskId).maybeSingle(),
          supabase.from('risks').select('id, title, description, category, likelihood, impact, risk_score, status, mitigation_plan, owner_id, residual_likelihood, residual_impact, created_at, updated_at'),
        ]);
        if (cancelled) return;

        if (riskRes.error) {
          setError(riskRes.error.message);
          setLoading(false);
          return;
        }

        setRisk(riskRes.data);
        setAllRisks(allRisksRes.data ?? []);

        if (riskRes.data) {
          const controlsRes = await supabase.from('controls').select('id, code, title, description, category, framework_id, status, last_reviewed, owner_id, implementation_details, frameworks, created_at, updated_at');
          if (!cancelled) {
            setLinkedControls(controlsRes.data ?? []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load risk');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [riskId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-severity-critical" />
        <p className="text-sm text-severity-critical">{error}</p>
        <Link to="/risk-register" className="text-primary hover:underline text-sm">← Back to risk register</Link>
      </div>
    );
  }

  if (!risk) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Risk not found</p>
        <Link to="/risk-register" className="text-primary hover:underline text-sm">← Back to risk register</Link>
      </div>
    );
  }

  const riskScore = risk.risk_score ?? 0;
  const likelihood = risk.likelihood ?? 3;
  const impact = risk.impact ?? 3;
  const mitigationPlan = risk.mitigation_plan ?? 'No mitigation plan defined';
  const ownerLabel = risk.owner_id ?? 'Unassigned';

  const linkedControlData = linkedControls.filter(c => {
    return c.framework_id === risk.category;
  });

  const plan = [
    { id: 'tp-default', step: 'Define treatment actions', done: false, dueDate: 'Set target date' },
  ];
  const completedSteps = Object.values(checkState).filter(Boolean).length;
  const totalSteps = plan.length;

  const residualScore = risk.residual_likelihood != null && risk.residual_impact != null
    ? risk.residual_likelihood * risk.residual_impact
    : Math.round(riskScore * Math.max(0.3, 1 - (completedSteps / totalSteps) * 0.6));

  function exportPdf() {
    if (!risk) return;
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setProperties({ title: risk.title, creator: 'ZeroDay Security' });

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(248, 250, 252);
      doc.text('ZeroDay Security', 14, 11);
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.text('Risk Assessment Report', 14, 19);
      doc.setFontSize(8);
      doc.setTextColor(180, 196, 220);
      doc.text(format(new Date(), 'MMMM d, yyyy'), doc.internal.pageSize.getWidth() - 14, 11, { align: 'right' });

      let y = 40;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text(risk.title, 14, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Status: ${risk.status}  |  Score: ${riskScore}  |  Residual: ${residualScore}  |  Category: ${risk.category ?? 'Uncategorized'}`, 14, y);
      y += 8;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, y, doc.internal.pageSize.getWidth() - 14, y);
      y += 8;

      if (risk.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        const lines = doc.splitTextToSize(risk.description, doc.internal.pageSize.getWidth() - 28);
        for (const line of lines) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, 14, y);
          y += 5;
        }
        y += 4;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Risk Assessment', 14, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Likelihood: ${risk.likelihood ?? '—'}/5`, 14, y); y += 5;
      doc.text(`Impact: ${risk.impact ?? '—'}/5`, 14, y); y += 5;
      doc.text(`Inherent Risk Score: ${riskScore}`, 14, y); y += 5;
      doc.text(`Residual Risk Score: ${residualScore}`, 14, y); y += 5;
      doc.text(`Owner: ${ownerLabel}`, 14, y); y += 5;

      if (risk.mitigation_plan) {
        y += 4;
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y, doc.internal.pageSize.getWidth() - 14, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('Mitigation Plan', 14, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        const planLines = doc.splitTextToSize(risk.mitigation_plan, doc.internal.pageSize.getWidth() - 28);
        for (const line of planLines) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, 14, y);
          y += 5;
        }
      }

      const filename = `${risk.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_risk_report.pdf`;
      doc.save(filename);
      toast.success('Risk report exported as PDF');
    } catch {
      toast.error('Failed to generate PDF');
    }
  }

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
            <span className="font-mono text-sm text-muted-foreground">{risk.id.slice(0, 8)}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${statusStyles[risk.status] || ''}`}>
              {risk.status}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreColor(riskScore)}`}>
              Score: {riskScore}
            </span>
            <button onClick={exportPdf} className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-auto">
              <Download className="h-3 w-3" /> PDF
            </button>
          </div>
          <h1 className="text-lg font-bold text-foreground mt-1">{risk.title}</h1>
          {risk.description && (
            <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
          )}
        </div>
      </div>

      {/* Meta strip */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Owner:</span>
          <span className="font-medium text-foreground">{ownerLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Category:</span>
          <span className="font-medium text-foreground">{risk.category ?? 'Uncategorized'}</span>
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
                    {[5, 4, 3, 2, 1].map((lVal) =>
                      [1, 2, 3, 4, 5].map((iVal) => {
                        const score = lVal * iVal;
                        const isCurrentRisk = likelihood === lVal && impact === iVal;
                        const risksInCell = allRisks.filter(
                          (r) => r.likelihood === lVal && r.impact === iVal
                        );
                        return (
                          <div
                            key={`${lVal}-${iVal}`}
                            className={`h-12 rounded border ${cellBg(score)} flex items-center justify-center relative transition-all ${
                              isCurrentRisk ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-105' : ''
                            }`}
                          >
                            {isCurrentRisk ? (
                              <div className={`w-6 h-6 rounded-full ${scoreColor(score)} flex items-center justify-center`}>
                                <span className="text-[9px] font-bold">{score}</span>
                              </div>
                            ) : risksInCell.length > 0 ? (
                              <span className="text-[10px] text-muted-foreground font-medium">{risksInCell.length}</span>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
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
                  <p className={`text-2xl font-bold ${scoreLabelColor(riskScore)}`}>{riskScore}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">L{likelihood} × I{impact}</p>
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
                  <p className="text-xs text-muted-foreground mb-1">Likelihood: {likelihoodLabels[likelihood]} ({likelihood}/5)</p>
                  <Progress value={likelihood * 20} className="h-1.5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Impact: {impactLabels[impact]} ({impact}/5)</p>
                  <Progress value={impact * 20} className="h-1.5" />
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
                            <span className="text-xs font-mono text-muted-foreground">{ctrl.code}</span>
                            <span className="text-sm font-medium text-foreground truncate">{ctrl.title}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{ctrl.framework_id ?? 'N/A'}</span>
                            <span>·</span>
                            <span>{ctrl.category ?? 'Uncategorized'}</span>
                            <span>·</span>
                            <span>Last tested: {ctrl.last_reviewed ?? 'Never'}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[9px] h-5 ${ctrlStatusStyle[ctrl.status] || ''}`}>
                          {ctrl.status.replace('_', ' ')}
                        </Badge>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Treatment Plan</CardTitle>
                <button onClick={() => setTreatmentOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                  <ClipboardCheck className="h-3.5 w-3.5" /> Record Treatment
                </button>
              </div>
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
                <p className="text-sm text-foreground leading-relaxed">{mitigationPlan}</p>
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
                <span className="font-medium text-foreground">{riskScore <= 8 ? 'Within' : 'Exceeds'} tolerance</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Treatment type</span>
                <span className="font-medium text-foreground capitalize">{risk.status === 'accepted' ? 'Accept' : risk.status === 'resolved' ? 'Avoid' : 'Mitigate'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Inherent score</span>
                <span className={`font-bold ${scoreLabelColor(riskScore)}`}>{riskScore}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Residual score</span>
                <span className={`font-bold ${scoreLabelColor(residualScore)}`}>{residualScore}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Risk reduction</span>
                <span className="font-medium text-status-passing">
                  {riskScore > 0 ? Math.round((1 - residualScore / riskScore) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {treatmentOpen && (
        <RiskTreatmentDialog
          riskId={riskId}
          riskTitle={risk.title}
          onClose={() => setTreatmentOpen(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
