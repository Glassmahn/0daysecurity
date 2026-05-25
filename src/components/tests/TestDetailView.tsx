import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw,
  Terminal, Calendar, Loader2, FileText, History
} from 'lucide-react';
import { format } from 'date-fns';

const statusStyles: Record<string, string> = {
  passing: 'bg-status-passing/12 text-status-passing',
  failing: 'bg-status-failing/12 text-status-failing',
  pending: 'bg-status-in-progress/12 text-status-in-progress',
  error: 'bg-severity-high/12 text-severity-high',
  disabled: 'bg-muted text-muted-foreground',
};

const resultBadge = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'pass' || s === 'passed') return <span className="flex items-center gap-1 text-xs text-status-passing"><CheckCircle className="h-3 w-3" />Passed</span>;
  if (s === 'fail' || s === 'failed') return <span className="flex items-center gap-1 text-xs text-status-failing"><XCircle className="h-3 w-3" />Failed</span>;
  return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{status ?? 'N/A'}</span>;
};

interface TestDetailViewProps {
  testId: string;
}

export function TestDetailView({ testId }: TestDetailViewProps) {
  const [test, setTest] = useState<Tables<'tests'> | null>(null);
  const [control, setControl] = useState<{ code: string; title: string } | null>(null);
  const [evidence, setEvidence] = useState<Tables<'evidence'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'evidence' | 'details'>('history');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .maybeSingle();
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        if (!data) { setError('Test not found'); setLoading(false); return; }
        setTest(data);

        if (data.control_id) {
          supabase.from('controls').select('code, title').eq('id', data.control_id).maybeSingle().then(({ data: ctrl }) => {
            if (!cancelled) setControl(ctrl);
          });
        }

        if (data.control_id) {
          supabase.from('evidence').select('*').eq('control_id', data.control_id).then(({ data: ev }) => {
            if (!cancelled) setEvidence((ev ?? []) as Tables<'evidence'>[]);
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load test');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [testId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-12 w-12 text-severity-critical" />
        <p className="text-sm text-severity-critical">{error}</p>
        <Link to="/tests" className="text-primary hover:underline text-sm">← Back to Tests</Link>
      </div>
    );
  }

  if (!test) return null;

  const resultHistory = (test.result_history as Array<{ result: string; run_at: string; notes?: string }>) ?? [];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/tests">
          <button className="mt-1 p-1 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{test.id.slice(0, 8)}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[test.status] ?? ''}`}>{test.status}</span>
            {control && <span className="font-mono text-xs bg-secondary text-foreground px-2 py-0.5 rounded">{control.code}</span>}
          </div>
          <h1 className="text-lg font-bold text-foreground">{test.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            {test.frequency && <span className="flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" /> Frequency: <strong className="text-foreground">{test.frequency}</strong></span>}
            {test.last_run && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Last Run: <strong className="text-foreground">{format(new Date(test.last_run), 'MMM d, yyyy')}</strong></span>}
            {test.next_run && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Next Run: <strong className="text-foreground">{format(new Date(test.next_run), 'MMM d, yyyy')}</strong></span>}
            <span className="flex items-center gap-1">{resultBadge(test.result ?? '')}</span>
          </div>
          {test.description && (
            <div className="mt-3 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-foreground">{test.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</div>
          <div className="text-2xl font-bold text-foreground capitalize">{test.status}</div>
          <div className="text-xs text-muted-foreground mt-1">Last result: {test.result ?? '—'}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Linked Control</div>
          <div className="text-2xl font-bold text-foreground">{control?.code ?? '—'}</div>
          <div className="text-xs text-muted-foreground mt-1">{control?.title ?? 'No control linked'}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Schedule</div>
          <div className="text-2xl font-bold text-foreground">{test.schedule ?? '—'}</div>
          <div className="text-xs text-muted-foreground mt-1">Frequency: {test.frequency ?? '—'}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-secondary rounded-md p-0.5 overflow-x-auto" role="tablist">
        {[
          { key: 'history' as const, label: 'Result History', icon: History, count: resultHistory.length },
          { key: 'evidence' as const, label: 'Linked Evidence', icon: FileText, count: evidence.length },
          { key: 'details' as const, label: 'Details', icon: Terminal, count: null },
        ].map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}{t.count !== null ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* Result History tab */}
      {activeTab === 'history' && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" /> Test Result History
          </h3>
          {resultHistory.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No result history available. Results will appear here after test runs.
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-0">
                {resultHistory.map((entry, i) => (
                  <div key={`${entry.run_at}-${i}`} className="relative pl-8 pb-6 last:pb-0">
                    <div className={`absolute left-1.5 top-1 h-3 w-3 rounded-full border-2 ${entry.result === 'pass' || entry.result === 'passed' ? 'bg-status-passing border-status-passing' : entry.result === 'fail' || entry.result === 'failed' ? 'bg-status-failing border-status-failing' : 'bg-primary border-primary'}`} />
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold text-foreground capitalize">{entry.result}</span>
                      <span className="text-xs text-muted-foreground">{entry.run_at ? format(new Date(entry.run_at), 'MMM d, yyyy HH:mm') : '—'}</span>
                    </div>
                    {entry.notes && <p className="text-sm text-foreground">{entry.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Linked Evidence tab */}
      {activeTab === 'evidence' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> Linked Evidence ({evidence.length})
            </h3>
          </div>
          {evidence.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {test.control_id
                ? 'No evidence items linked to this test\'s control yet.'
                : 'No control linked — evidence appears once a control is assigned.'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {evidence.map(ev => (
                <Link key={ev.id} to="/evidence/$evidenceId" params={{ evidenceId: ev.id }}>
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-surface transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.type} · {ev.source ?? '—'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${ev.status === 'verified' ? 'bg-status-passing/15 text-status-passing' : ev.status === 'needs_review' ? 'bg-status-warning/15 text-status-warning' : 'bg-muted text-muted-foreground'}`}>{ev.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details tab */}
      {activeTab === 'details' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" /> Test Details
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Name</p>
                <p className="text-sm text-foreground">{test.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Status</p>
                <p className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md inline-block ${statusStyles[test.status] ?? ''}`}>{test.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Frequency</p>
                <p className="text-sm text-foreground">{test.frequency ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Schedule</p>
                <p className="text-sm text-foreground">{test.schedule ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Last Run</p>
                <p className="text-sm text-foreground">{test.last_run ? format(new Date(test.last_run), 'MMM d, yyyy HH:mm') : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Next Run</p>
                <p className="text-sm text-foreground">{test.next_run ? format(new Date(test.next_run), 'MMM d, yyyy') : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Result</p>
                <p className="text-sm text-foreground">{test.result ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Linked Control</p>
                <p className="text-sm text-foreground">{control ? `${control.code} — ${control.title}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Created</p>
                <p className="text-sm text-foreground">{format(new Date(test.created_at), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Updated</p>
                <p className="text-sm text-foreground">{format(new Date(test.updated_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
