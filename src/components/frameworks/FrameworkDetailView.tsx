import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { frameworkCatalog, enrichedControls, type EnrichedControl } from '@/lib/framework-catalog';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import {
  ArrowLeft, Shield, CheckCircle2, XCircle, Clock, AlertTriangle, Eye,
  Layers, Calendar, TrendingUp, Loader2, ExternalLink, User, ChevronRight
} from 'lucide-react';

const statusStyles: Record<string, { style: string; bg: string; icon: React.ElementType }> = {
  implemented: { style: 'text-status-passing', bg: 'bg-status-passing/15 text-status-passing', icon: CheckCircle2 },
  in_progress: { style: 'text-status-in-progress', bg: 'bg-status-in-progress/15 text-status-in-progress', icon: Clock },
  failing: { style: 'text-severity-critical', bg: 'bg-status-failing/15 text-status-failing', icon: XCircle },
  not_implemented: { style: 'text-muted-foreground', bg: 'bg-muted text-muted-foreground', icon: AlertTriangle },
  not_applicable: { style: 'text-muted-foreground', bg: 'bg-muted text-muted-foreground', icon: Eye },
};

interface FrameworkDetailViewProps {
  frameworkId: string;
}

export function FrameworkDetailView({ frameworkId }: FrameworkDetailViewProps) {
  const navigate = useNavigate();
  const [dbFramework, setDbFramework] = useState<Tables<'frameworks'> | null>(null);
  const [loading, setLoading] = useState(true);

  const catalogFw = frameworkCatalog.find(f => f.id === frameworkId);

  useEffect(() => {
    if (!catalogFw) { setLoading(false); return; }
    const fwName = catalogFw.name;
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('frameworks')
        .select('*')
        .eq('name', fwName)
        .maybeSingle();
      if (!cancelled) {
        setDbFramework(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [frameworkId, catalogFw?.name]);

  const mappedControls = useMemo(() => {
    if (!catalogFw) return [];
    return enrichedControls.filter(c =>
      c.frameworks.includes(catalogFw.standard)
    );
  }, [catalogFw]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, EnrichedControl[]>();
    for (const c of mappedControls) {
      const cat = c.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [mappedControls]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!catalogFw) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-up">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Framework not found</h2>
        <p className="text-sm text-muted-foreground">No framework matches ID "{frameworkId}"</p>
        <Link to="/frameworks" className="text-primary hover:underline text-sm">← Back to Frameworks</Link>
      </div>
    );
  }

  const stats = [
    { label: 'Controls', value: catalogFw.controlCount },
    { label: 'Compliance', value: `${catalogFw.compliancePct}%` },
    { label: 'Passing', value: catalogFw.controlCounts.passing, color: 'text-status-passing' },
    { label: 'Failing', value: catalogFw.controlCounts.failing, color: 'text-status-failing' },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate({ to: '/frameworks' })} className="mt-1 p-1 rounded hover:bg-secondary transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {catalogFw.category.replace(/_/g, ' ')}
            </span>
            <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {catalogFw.standard}
            </span>
            <span className={`text-xs font-semibold uppercase px-1.5 py-0.5 rounded ${
              catalogFw.status === 'certified' ? 'bg-status-passing/15 text-status-passing' :
              catalogFw.status === 'audit_ready' ? 'bg-chart-1/15 text-chart-1' :
              catalogFw.status === 'in_progress' ? 'bg-status-in-progress/15 text-status-in-progress' :
              'bg-muted text-muted-foreground'
            }`}>
              {catalogFw.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-lg font-bold text-foreground">{catalogFw.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{catalogFw.description}</p>
          {catalogFw.targetDate && (
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Target: <strong className="text-foreground">{catalogFw.targetDate}</strong></span>
              {dbFramework?.score != null && (
                <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> DB Score: <strong className="text-foreground">{dbFramework.score}%</strong></span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-card border border-border/60 rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color || 'text-foreground'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Compliance bar */}
      <div className="bg-card border border-border/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Compliance Progress</h3>
          <span className="text-sm font-bold text-foreground">{catalogFw.compliancePct}%</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden flex">
          <div className="h-full bg-status-passing rounded-l-full transition-all" style={{ width: `${(catalogFw.controlCounts.passing / catalogFw.controlCount) * 100}%` }} />
          <div className="h-full bg-status-in-progress transition-all" style={{ width: `${(catalogFw.controlCounts.inProgress / catalogFw.controlCount) * 100}%` }} />
          <div className="h-full bg-status-failing transition-all" style={{ width: `${(catalogFw.controlCounts.failing / catalogFw.controlCount) * 100}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-passing" /> Passing ({catalogFw.controlCounts.passing})</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-in-progress" /> In Progress ({catalogFw.controlCounts.inProgress})</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-status-failing" /> Failing ({catalogFw.controlCounts.failing})</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted" /> N/A ({catalogFw.controlCounts.na})</span>
        </div>
      </div>

      {/* Mapped Controls */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          Mapped Controls ({mappedControls.length})
        </h3>

        {mappedControls.length === 0 ? (
          <div className="bg-card border border-border/60 rounded-xl p-8 text-center text-muted-foreground text-sm">
            No controls mapped to this framework yet
          </div>
        ) : (
          <div className="space-y-3">
            {categoryBreakdown.map(([category, controls]) => (
              <div key={category} className="bg-card border border-border/60 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/30 border-b border-border/60 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground uppercase">{category}</h4>
                  <span className="text-xs text-muted-foreground">{controls.length} control{controls.length > 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-border/40">
                  {controls.map(c => {
                    const sc = statusStyles[c.status] || statusStyles.not_implemented;
                    const StatusIcon = sc.icon;
                    return (
                      <div
                        key={c.id}
                        onClick={() => navigate({ to: '/controls/$controlId', params: { controlId: c.id } })}
                        className="px-4 py-3 hover:bg-primary/[0.03] transition-colors cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`mt-0.5 ${sc.style}`}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-primary font-medium">{c.ref}</span>
                              <span className="text-sm font-medium text-foreground truncate">{c.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><User className="h-3 w-3" /> {c.owner}</span>
                              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${sc.bg}`}>
                                {c.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {c.automatable && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-chart-1/10 text-chart-1 rounded">Auto</span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cross-mappings summary */}
      {mappedControls.some(c => c.crossMappings.length > 1) && (
        <div className="bg-card border border-border/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            Cross-Framework Mappings
          </h3>
          <p className="text-xs text-muted-foreground">
            {mappedControls.filter(c => c.crossMappings.length > 1).length} controls in this framework are mapped to other frameworks
          </p>
        </div>
      )}
    </div>
  );
}
