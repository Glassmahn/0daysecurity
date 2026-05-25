import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Shield, CheckCircle2, XCircle, Clock, AlertTriangle,
  User, Calendar, Activity,
  History, Layers, Eye, Loader2, FileText
} from 'lucide-react';
import { toast } from 'sonner';

const statusStyles: Record<string, { style: string; bg: string; icon: React.ElementType }> = {
  implemented: { style: 'text-status-passing', bg: 'bg-status-passing/15 text-status-passing', icon: CheckCircle2 },
  in_progress: { style: 'text-status-in-progress', bg: 'bg-status-in-progress/15 text-status-in-progress', icon: Clock },
  failing: { style: 'text-severity-critical', bg: 'bg-status-failing/15 text-status-failing', icon: XCircle },
  not_implemented: { style: 'text-muted-foreground', bg: 'bg-muted text-muted-foreground', icon: AlertTriangle },
  not_applicable: { style: 'text-muted-foreground', bg: 'bg-muted text-muted-foreground', icon: Eye },
};

interface ControlDetailViewProps {
  controlId: string;
}

export function ControlDetailView({ controlId }: ControlDetailViewProps) {
  const [control, setControl] = useState<Tables<'controls'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'evidence' | 'tests' | 'timeline' | 'frameworks' | 'policies'>('evidence');
  const [evidenceItems, setEvidenceItems] = useState<Tables<'evidence'>[]>([]);
  const [policies, setPolicies] = useState<Tables<'policies'>[]>([]);
  const [personnel, setPersonnel] = useState<string[]>([]);
  const [editingOwner, setEditingOwner] = useState(false);
  const [ownerValue, setOwnerValue] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setEditingOwner(false);
      try {
        const { data, error: err } = await supabase
          .from('controls')
          .select('*')
          .eq('id', controlId)
          .maybeSingle();

        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }

        let ctrl = data;
        if (!data) {
          const { data: byCode } = await supabase
            .from('controls')
            .select('*')
            .eq('code', controlId)
            .maybeSingle();
          if (!cancelled) ctrl = byCode;
        }

        if (!cancelled) {
          setControl(ctrl);

          if (ctrl) {
            const [evData, polData, perData] = await Promise.all([
              supabase.from('evidence').select('*').contains('control_ids', [ctrl.id]).limit(20),
              ctrl.framework_id
                ? supabase.from('policies').select('*').eq('framework_id', ctrl.framework_id).limit(20)
                : Promise.resolve({ data: [] }),
              supabase.from('personnel').select('name'),
            ]);
            if (!cancelled) {
              setEvidenceItems(evData.data ?? []);
              setPolicies(polData.data ?? []);
              if (perData.data) setPersonnel(perData.data.map(p => p.name).filter(Boolean) as string[]);
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load control');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [controlId]);

  async function handleOwnerSave() {
    if (!control) return;
    const { error: err } = await supabase.from('controls').update({ owner_id: ownerValue }).eq('id', control.id);
    if (err) { toast.error('Failed to update owner'); return; }
    setControl({ ...control, owner_id: ownerValue });
    setEditingOwner(false);
    toast.success('Owner updated');
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-severity-critical" />
        <p className="text-sm text-severity-critical">{error}</p>
        <Link to="/controls" className="text-primary hover:underline text-sm">← Back to Controls</Link>
      </div>
    );
  }

  if (!control) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Control not found</h2>
        <Link to="/controls" className="text-primary hover:underline text-sm">← Back to Controls</Link>
      </div>
    );
  }

  const sc = statusStyles[control.status] || statusStyles.not_implemented;
  const StatusIcon = sc.icon;

  const tests: { date: string; result: 'pass' | 'fail' | 'partial'; tester: string; method: 'automated' | 'manual'; notes: string; duration: string }[] = control.last_reviewed ? [
    { date: control.last_reviewed, result: control.status === 'implemented' ? 'pass' as const : 'fail' as const, tester: control.owner_id ?? 'System', method: 'manual' as const, notes: `Status: ${control.status.replace('_', ' ')}`, duration: '—' },
  ] : [];

  const timeline: { date: string; event: string; actor: string; pctChange: string }[] = control.last_reviewed ? [
    { date: control.last_reviewed, event: `Current status: ${control.status.replace('_', ' ')}`, actor: control.owner_id ?? 'System', pctChange: `${control.implementation_details ? 'In progress' : 'N/A'}` },
  ] : [];

  const passRate = tests.length > 0 ? Math.round((tests.filter(t => t.result === 'pass').length / tests.length) * 100) : 0;

  const tabs = [
    { key: 'evidence' as const, label: 'Evidence', count: evidenceItems.length },
    { key: 'tests' as const, label: 'Test History', count: tests.length },
    { key: 'policies' as const, label: 'Policies', count: policies.length },
    { key: 'timeline' as const, label: 'Timeline', count: null },
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/controls">
          <button className="mt-1 p-1 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-primary font-bold">{control.code}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${sc.bg}`}>
              <StatusIcon className="h-3 w-3" /> {control.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-lg font-bold text-foreground">{control.title}</h1>
          {control.description && (
            <p className="text-sm text-muted-foreground mt-1">{control.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Owner:{' '}
              {editingOwner ? (
                <span className="flex items-center gap-1">
                  <select
                    value={ownerValue}
                    onChange={e => setOwnerValue(e.target.value)}
                    className="bg-card border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    <option value="">Unassigned</option>
                    {personnel.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button onClick={handleOwnerSave} className="p-0.5 rounded hover:bg-status-passing/15 text-status-passing"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setEditingOwner(false)} className="p-0.5 rounded hover:bg-destructive/15 text-destructive"><XCircle className="h-3.5 w-3.5" /></button>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <strong className="text-foreground">{control.owner_id ?? 'Unassigned'}</strong>
                  <button onClick={() => { setOwnerValue(control.owner_id ?? ''); setEditingOwner(true); }} className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </span>
              )}
            </span>
            <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {control.category ?? 'Uncategorized'}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Last reviewed: <strong className="text-foreground">{control.last_reviewed ? new Date(control.last_reviewed).toLocaleDateString('en-CA') : 'Never'}</strong></span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</div>
          <div className="text-2xl font-bold text-foreground capitalize">{control.status.replace('_', ' ')}</div>
          <Progress value={control.status === 'implemented' ? 100 : control.status === 'in_progress' ? 50 : control.status === 'failing' ? 25 : 0} className="mt-2 h-1.5" />
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Test Pass Rate</div>
          <div className={`text-2xl font-bold ${passRate >= 80 ? 'text-status-passing' : passRate >= 50 ? 'text-status-warning' : 'text-severity-critical'}`}>{passRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">{tests.filter(t => t.result === 'pass').length}/{tests.length} passed</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Evidence</div>
          <div className="text-2xl font-bold text-foreground">{evidenceItems.length}</div>
          <div className="text-xs text-muted-foreground mt-1">items collected</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Policies</div>
          <div className="text-2xl font-bold text-foreground">{policies.length}</div>
          <div className="text-xs text-muted-foreground mt-1">linked</div>
        </div>
      </div>

      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 bg-secondary rounded-md p-0.5 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}{t.count !== null ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* Evidence */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Collected Evidence ({evidenceItems.length})</h3>
            </div>
            {evidenceItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No evidence collected for this control</div>
            ) : (
              <div className="divide-y divide-border">
                {evidenceItems.map(ev => (
                  <div key={ev.id} className="px-5 py-3 hover:bg-surface transition-colors flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-foreground">{ev.title ?? 'Untitled'}</span>
                      <p className="text-xs text-muted-foreground">{ev.description ?? ''}</p>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{ev.status ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test History */}
      {activeTab === 'tests' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" /> Test History ({tests.length})
            </h3>
          </div>
          {tests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No tests recorded</div>
          ) : (
            <div className="divide-y divide-border">
              {tests.map((t, i) => {
                const resultStyle = t.result === 'pass' ? 'bg-status-passing/15 text-status-passing' : t.result === 'fail' ? 'bg-status-failing/15 text-status-failing' : 'bg-status-in-progress/15 text-status-in-progress';
                const ResultIcon = t.result === 'pass' ? CheckCircle2 : t.result === 'fail' ? XCircle : AlertTriangle;
                return (
                  <div key={`${t.date}-${t.result}-${i}`} className="px-5 py-3 hover:bg-surface transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <ResultIcon className={`h-4 w-4 mt-0.5 shrink-0 ${t.result === 'pass' ? 'text-status-passing' : t.result === 'fail' ? 'text-severity-critical' : 'text-status-in-progress'}`} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{t.date}</span>
                            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${resultStyle}`}>{t.result}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{t.notes}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>By: {t.tester}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Policies */}
      {activeTab === 'policies' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> Linked Policies ({policies.length})
            </h3>
          </div>
          {policies.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No policies linked to this control's framework</div>
          ) : (
            <div className="divide-y divide-border">
              {policies.map(p => (
                <Link key={p.id} to="/policies/$policyId" params={{ policyId: p.id }} className="px-5 py-3 hover:bg-primary/[0.03] transition-colors flex items-center justify-between cursor-pointer">
                  <div className="font-medium text-sm text-foreground">{p.title}</div>
                  <div className="flex items-center gap-2">
                    {p.version && <span className="text-[10px] text-muted-foreground">v{p.version}</span>}
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      p.status === 'active' ? 'bg-status-passing/15 text-status-passing' :
                      p.status === 'draft' ? 'bg-muted text-muted-foreground' :
                      p.status === 'review' ? 'bg-status-in-progress/15 text-status-in-progress' :
                      'bg-muted text-muted-foreground'
                    }`}>{p.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Implementation Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" /> Implementation Timeline
          </h3>
          {timeline.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">No implementation history available</div>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-0">
                {timeline.map((t, i) => (
                  <div key={`${t.date}-${t.event}`} className="relative pl-8 pb-5 last:pb-0">
                    <div className={`absolute left-1.5 top-1 h-3 w-3 rounded-full border-2 ${i === 0 ? 'bg-primary border-primary' : 'bg-card border-border'}`} />
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{t.date}</span>
                    </div>
                    <p className="text-sm text-foreground">{t.event}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <User className="h-3 w-3" /> {t.actor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Frameworks tab removed — uses framework_id column instead */}
    </div>
  );
}
