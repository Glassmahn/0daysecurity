import { useMemo, useState, useCallback } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { frameworkCatalog } from '@/lib/framework-catalog';
import { Link } from '@tanstack/react-router';
import {
  Loader2, AlertCircle, Shield, CheckCircle2, XCircle,
  Clock, Search, Eye, ArrowRight, Filter, Download,
  Calendar, FileText, ChevronDown, ChevronRight, CheckSquare,
  Square, StickyNote, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

const statusStyles: Record<string, string> = {
  implemented: 'bg-status-passing/15 text-status-passing',
  partially_implemented: 'bg-status-in-progress/15 text-status-in-progress',
  failing: 'bg-status-failing/15 text-status-failing',
  not_started: 'bg-muted text-muted-foreground',
  not_applicable: 'bg-muted text-muted-foreground',
  not_implemented: 'bg-status-failing/15 text-status-failing',
};

export function AuditPrepPage() {
  const { data: controls, loading, error, refetch } = useSupabaseCrud('controls');
  const [search, setSearch] = useState('');
  const [filterFramework, setFilterFramework] = useState('all');
  const [targetDate, setTargetDate] = useState('');
  const [checklistMode, setChecklistMode] = useState<Record<string, boolean>>({});
  const [reviewedControls, setReviewedControls] = useState<Record<string, boolean>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [expandedFrameworks, setExpandedFrameworks] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);

  const enabledFrameworks = useMemo(
    () => frameworkCatalog.filter(f => f.enabled),
    []
  );

  const byFramework = useMemo(() => {
    const result: Array<{
      framework: typeof frameworkCatalog[0];
      controls: typeof controls;
      passing: number;
      failing: number;
      inProgress: number;
      notStarted: number;
      total: number;
    }> = [];

    for (const fw of enabledFrameworks) {
      const matched = controls.filter(c =>
        Array.isArray(c.frameworks) && c.frameworks.includes(fw.standard)
      );
      if (matched.length === 0) continue;

      const passing = matched.filter(c => c.status === 'implemented').length;
      const failing = matched.filter(c => c.status === 'failing' || c.status === 'not_implemented').length;
      const inProgress = matched.filter(c => c.status === 'partially_implemented').length;
      const notStarted = matched.filter(c => c.status === 'not_started').length;

      result.push({
        framework: fw,
        controls: matched,
        passing,
        failing,
        inProgress,
        notStarted,
        total: matched.length,
      });
    }

    result.sort((a, b) => (b.passing / b.total) - (a.passing / a.total));
    return result;
  }, [controls, enabledFrameworks]);

  const filteredByFramework = useMemo(() => {
    let list = byFramework;
    if (filterFramework !== 'all') {
      list = list.filter(f => f.framework.standard === filterFramework);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.map(f => ({
        ...f,
        controls: f.controls.filter(c =>
          c.title.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q)
        ),
      })).filter(f => f.controls.length > 0);
    }
    return list;
  }, [byFramework, filterFramework, search]);

  const totalFrameworks = byFramework.length;
  const totalPassing = byFramework.reduce((s, f) => s + f.passing, 0);
  const totalControls = byFramework.reduce((s, f) => s + f.total, 0);
  const overallReadiness = totalControls > 0 ? Math.round((totalPassing / totalControls) * 100) : 0;

  const totalReviewed = Object.values(reviewedControls).filter(Boolean).length;
  const totalChecklistItems = byFramework.reduce((s, f) => {
    return s + (checklistMode[f.framework.id] ? f.controls.length : 0);
  }, 0);
  const checklistProgress = totalChecklistItems > 0 ? Math.round((totalReviewed / totalChecklistItems) * 100) : 0;

  function toggleChecklist(frameworkId: string) {
    setChecklistMode(prev => ({ ...prev, [frameworkId]: !prev[frameworkId] }));
  }

  function toggleReviewed(controlId: string) {
    setReviewedControls(prev => ({ ...prev, [controlId]: !prev[controlId] }));
  }

  function setNote(controlId: string, note: string) {
    setReviewNotes(prev => ({ ...prev, [controlId]: note }));
  }

  function toggleExpanded(frameworkId: string) {
    setExpandedFrameworks(prev => ({ ...prev, [frameworkId]: !prev[frameworkId] }));
  }

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageW = doc.internal.pageSize.getWidth();

      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageW, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Audit Readiness Report', pageW / 2, 20, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 30, { align: 'center' });

      let y = 50;
      doc.setTextColor(50, 50, 50);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Overall Readiness: ${overallReadiness}%`, 14, y); y += 5;
      doc.text(`Frameworks: ${totalFrameworks}`, 14, y); y += 5;
      doc.text(`Total Controls: ${totalControls}`, 14, y); y += 5;
      doc.text(`Passing: ${totalPassing}`, 14, y); y += 8;

      if (targetDate) {
        doc.text(`Target Audit Date: ${targetDate}`, 14, y); y += 8;
      }

      if (totalChecklistItems > 0) {
        doc.text(`Checklist Progress: ${totalReviewed}/${totalChecklistItems} (${checklistProgress}%)`, 14, y); y += 8;
      }

      for (const fw of byFramework) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        const readiness = Math.round((fw.passing / fw.total) * 100);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${fw.framework.standard} — ${readiness}% ready (${fw.passing}/${fw.total} passing)`, 14, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        for (const c of fw.controls) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          const reviewed = reviewedControls[c.id] ? '[x]' : '[ ]';
          const note = reviewNotes[c.id] ? ` — ${reviewNotes[c.id]}` : '';
          doc.text(`${reviewed} ${c.code}: ${c.title} (${c.status})${note}`, 18, y);
          y += 4;
        }
        y += 4;
      }

      doc.save(`audit-readiness-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Readiness report exported');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }, [byFramework, overallReadiness, totalFrameworks, totalControls, totalPassing, targetDate, totalChecklistItems, checklistProgress, reviewedControls, reviewNotes]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-destructive">Failed to load audit data</p>
        <p className="text-xs text-muted-foreground max-w-md text-center">{error}</p>
        <button onClick={refetch} className="text-xs text-primary hover:underline cursor-pointer">Try again</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading audit preparation data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Audit Preparation</h1>
            <p className="text-sm text-muted-foreground">
              Controls organized by framework — ready for auditor review
            </p>
          </div>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground border border-border rounded-md text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="text-2xl font-display font-bold text-foreground">{totalFrameworks}</div>
          <div className="text-[11px] text-muted-foreground font-medium mt-1">Active Frameworks</div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className={`text-2xl font-display font-bold ${overallReadiness >= 80 ? 'text-status-passing' : overallReadiness >= 50 ? 'text-status-in-progress' : 'text-severity-critical'}`}>
            {overallReadiness}%
          </div>
          <div className="text-[11px] text-muted-foreground font-medium mt-1">Overall Readiness</div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="text-2xl font-display font-bold text-status-passing">{totalPassing}</div>
          <div className="text-[11px] text-muted-foreground font-medium mt-1">Passing Controls</div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="text-2xl font-display font-bold text-severity-critical">
            {byFramework.reduce((s, f) => s + f.failing, 0)}
          </div>
          <div className="text-[11px] text-muted-foreground font-medium mt-1">Failing / Not Implemented</div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="text-2xl font-display font-bold text-foreground">{totalControls}</div>
          <div className="text-[11px] text-muted-foreground font-medium mt-1">Total Controls</div>
        </div>
      </div>

      {totalChecklistItems > 0 && (
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Checklist Progress</span>
            </div>
            <span className="text-xs text-muted-foreground">{totalReviewed}/{totalChecklistItems} reviewed ({checklistProgress}%)</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${checklistProgress}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search controls across frameworks..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />
        </div>
        <select value={filterFramework} onChange={e => setFilterFramework(e.target.value)}
          className="bg-card border border-border/60 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all">
          <option value="all">All Frameworks</option>
          {enabledFrameworks.map(fw => (
            <option key={fw.standard} value={fw.standard}>{fw.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 bg-card border border-border/60 rounded-xl px-3.5 py-2.5">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
            className="bg-transparent text-sm text-foreground focus:outline-none"
            aria-label="Target audit date" />
          {targetDate && (
            <button onClick={() => setTargetDate('')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {totalControls} controls across {totalFrameworks} frameworks
        {filterFramework !== 'all' && ` (filtered)`}
        {targetDate && ` · target audit: ${targetDate}`}
      </p>

      <div className="space-y-6">
        {filteredByFramework.map(({ framework: fw, controls: fwControls, passing, failing, inProgress, total }) => {
          const inChecklistMode = checklistMode[fw.id] ?? false;
          const reviewedCount = fwControls.filter(c => reviewedControls[c.id]).length;
          const fwReady = Math.round((passing / total) * 100);

          return (
            <div key={fw.id} className="bg-card border border-border/60 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60 bg-surface/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">{fw.name}</h2>
                      <p className="text-xs text-muted-foreground">{fw.standard} — {total} controls</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {inChecklistMode && (
                      <span className="text-[10px] text-muted-foreground">{reviewedCount}/{total} reviewed</span>
                    )}
                    <button onClick={() => toggleChecklist(fw.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-colors ${
                        inChecklistMode ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border/60 text-muted-foreground hover:border-primary/30'
                      }`}>
                      <CheckSquare className="h-3 w-3" />
                      Checklist
                    </button>
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px]"><CheckCircle2 className="h-3 w-3 text-status-passing" />{passing}</span>
                      <span className="flex items-center gap-1 text-[11px]"><Clock className="h-3 w-3 text-status-in-progress" />{inProgress}</span>
                      <span className="flex items-center gap-1 text-[11px]"><XCircle className="h-3 w-3 text-severity-critical" />{failing}</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded ${
                      passing === total ? 'bg-status-passing/15 text-status-passing' :
                      failing > 0 ? 'bg-status-failing/15 text-severity-critical' :
                      'bg-status-in-progress/15 text-status-in-progress'
                    }`}>
                      {fwReady}% Ready
                    </span>
                    <button onClick={() => toggleExpanded(fw.id)} className="p-1 rounded hover:bg-muted transition-colors">
                      {expandedFrameworks[fw.id] ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
                {inChecklistMode && (
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${total > 0 ? Math.round((reviewedCount / total) * 100) : 0}%` }} />
                  </div>
                )}
              </div>

              {expandedFrameworks[fw.id] !== false && (
                <div className="divide-y divide-border/40">
                  {fwControls.map(c => (
                    inChecklistMode ? (
                      <div key={c.id} className="px-5 py-3 hover:bg-primary/[0.02] transition-colors">
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleReviewed(c.id)} className="mt-0.5 shrink-0">
                            {reviewedControls[c.id]
                              ? <CheckSquare className="h-4 w-4 text-primary" />
                              : <Square className="h-4 w-4 text-muted-foreground" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Link to="/controls/$controlId" params={{ controlId: c.id }}
                                className="font-mono text-xs text-primary font-medium shrink-0 hover:underline">{c.code}</Link>
                              <span className="text-sm text-foreground truncate">{c.title}</span>
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md shrink-0 ${statusStyles[c.status] ?? 'bg-muted text-muted-foreground'}`}>
                                {c.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="flex items-start gap-2 mt-1.5">
                              <StickyNote className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                              <input type="text" value={reviewNotes[c.id] ?? ''}
                                onChange={e => setNote(c.id, e.target.value)}
                                placeholder="Add review notes..."
                                className="flex-1 bg-transparent text-xs text-muted-foreground border-b border-dotted border-border focus:border-primary focus:outline-none pb-0.5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Link key={c.id} to="/controls/$controlId" params={{ controlId: c.id }}
                        className="flex items-center justify-between px-5 py-3 hover:bg-primary/[0.02] transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs text-primary font-medium shrink-0">{c.code}</span>
                          <span className="text-sm text-foreground truncate">{c.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusStyles[c.status] ?? 'bg-muted text-muted-foreground'}`}>
                            {c.status.replace(/_/g, ' ')}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </Link>
                    )
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredByFramework.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
            <Filter className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p>No controls found for the current filter.</p>
        </div>
      )}
    </div>
  );
}
