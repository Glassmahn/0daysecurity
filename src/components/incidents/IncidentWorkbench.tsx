import { useState, useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate, Json } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft, Clock, AlertTriangle, Users, CheckCircle2,
  Paperclip, Loader2, Send, MessageSquare, FileText, X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

const severityStyles: Record<string, string> = {
  critical: 'bg-severity-critical/15 text-severity-critical border-severity-critical/30',
  high: 'bg-severity-high/15 text-severity-high border-severity-high/30',
  medium: 'bg-severity-medium/15 text-severity-medium border-severity-medium/30',
  low: 'bg-severity-low/15 text-severity-low border-severity-low/30',
};

const statusStyles: Record<string, string> = {
  open: 'bg-status-failing/15 text-status-failing',
  investigating: 'bg-status-in-progress/15 text-status-in-progress',
  contained: 'bg-status-warning/15 text-status-warning',
  resolved: 'bg-status-passing/15 text-status-passing',
  closed: 'bg-muted text-muted-foreground',
};

export function IncidentWorkbench({ incidentId }: { incidentId: string }) {
  const session = useAuth();
  const [incident, setIncident] = useState<Tables<'incidents'> | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pirOpen, setPirOpen] = useState(false);
  const [pirForm, setPirForm] = useState({ root_cause: '', lessons_learned: '', action_items: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setIncident(null);
      try {
        const { data, error: err } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', incidentId)
          .maybeSingle();
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setIncident(data);
        if (data) {
          const saved = (data.response_checklist as Record<string, boolean>) ?? {};
          setCheckState({ 'ch-1': false, 'ch-2': false, 'ch-3': false, 'ch-4': false, 'ch-5': false, ...saved });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load incident');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [incidentId]);

  useEffect(() => {
    if (loading || Object.keys(checkState).length === 0) return;
    const timer = setTimeout(async () => {
      try {
        await supabase.from('incidents').update({ response_checklist: checkState } as TablesUpdate<'incidents'>).eq('id', incidentId);
      } catch { /* silent */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [checkState, incidentId, loading]);

  useEffect(() => {
    let cancelled = false;
    supabase.from('incident_comments').select('*').eq('incident_id', incidentId).order('created_at', { ascending: true }).then(({ data }) => {
      if (!cancelled) setComments(data ?? []);
    });
    return () => { cancelled = true; };
  }, [incidentId]);

  async function addComment() {
    if (!newComment.trim() || !session?.user) return;
    setSubmitting(true);
    const { error: err } = await supabase.from('incident_comments').insert({
      incident_id: incidentId,
      user_id: session.user.id,
      content: newComment.trim(),
    });
    if (err) { toast.error('Failed to add comment'); } else {
      setNewComment('');
      const { data } = await supabase.from('incident_comments').select('*').eq('incident_id', incidentId).order('created_at', { ascending: true });
      if (data) setComments(data);
    }
    setSubmitting(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !incident) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return; }
    setUploading(true);
    try {
      const path = `incidents/${incidentId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('evidence-files').upload(path, file);
      if (uploadErr) { toast.error('Upload failed'); setUploading(false); return; }

      const existing = (incident.attachments as Array<{ name: string; path: string; uploaded_by: string; uploaded_at: string }>) ?? [];
      const updated = [...existing, { name: file.name, path, uploaded_by: session?.user?.id ?? 'unknown', uploaded_at: new Date().toISOString() }];
      const { error: updateErr } = await supabase.from('incidents').update({ attachments: updated as unknown as Json }).eq('id', incidentId);
      if (updateErr) { toast.error('Failed to save attachment'); } else {
        toast.success('File attached');
        setIncident(prev => prev ? { ...prev, attachments: updated as unknown as Json } : prev);
      }
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  }

  async function submitPir() {
    if (!pirForm.root_cause.trim()) { toast.error('Root cause is required'); return; }
    const timelineEntry = {
      type: 'post_incident_review',
      timestamp: new Date().toISOString(),
      data: { ...pirForm, completed_by: session?.user?.id ?? null },
    };
    const existing = (incident?.timeline as Array<any>) ?? [];
    const updated = [...existing, timelineEntry];
    const { error: err } = await supabase.from('incidents').update({
      root_cause: pirForm.root_cause,
      timeline: updated as unknown as Json,
      status: 'closed',
    }).eq('id', incidentId);
    if (err) { toast.error('Failed to save review'); } else {
      toast.success('Post-incident review submitted');
      setPirOpen(false);
      setIncident(prev => prev ? { ...prev, root_cause: pirForm.root_cause, timeline: updated as unknown as Json, status: 'closed' } : prev);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-severity-critical" />
        <p className="text-sm text-severity-critical">{error}</p>
        <Link to="/incidents" className="text-primary hover:underline text-sm">← Back to incidents</Link>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Incident not found</p>
        <Link to="/incidents" className="text-primary hover:underline text-sm">← Back to incidents</Link>
      </div>
    );
  }

  const attachments = (incident.attachments as Array<{ name: string; path: string; uploaded_by: string; uploaded_at: string }>) ?? [];
  const timelineItems = (incident.timeline as Array<{ type: string; timestamp: string; data?: any }>) ?? [];

  const checkItems = [
    { id: 'ch-1', label: 'Contain — isolate affected systems' },
    { id: 'ch-2', label: 'Preserve evidence — snapshot logs & configs' },
    { id: 'ch-3', label: 'Notify stakeholders' },
    { id: 'ch-4', label: 'Root cause analysis' },
    { id: 'ch-5', label: 'Remediation & post-incident review' },
  ];
  const completedChecks = Object.values(checkState).filter(Boolean).length;
  const totalChecks = checkItems.length;
  const description = incident.description ?? 'No description available.';

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/incidents" className="mt-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-muted-foreground">{incident.id.slice(0, 8)}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${severityStyles[incident.severity]}`}>
              {incident.severity}
            </span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[incident.status]}`}>
              {incident.status}
            </span>
          </div>
          <h1 className="text-lg font-bold text-foreground mt-1">{incident.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      {/* Info strip */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Assigned to:</span>
          <span className="font-medium text-foreground">{incident.assigned_to ?? 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Reported by:</span>
          <span className="font-medium text-foreground">{incident.reported_by ?? 'System'}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Response:</span>
          <span className="font-medium text-foreground">{completedChecks}/{totalChecks} steps</span>
        </div>
        {incident.status !== 'closed' && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPirOpen(true)}>
            <FileText className="h-3 w-3 mr-1" /> Post-Incident Review
          </Button>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Comments + Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comment thread */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Activity ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                )}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/60">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-foreground">{c.user_id?.slice(0, 8) ?? 'System'}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), 'MMM d, yyyy HH:mm')}</span>
                      </div>
                      <p className="text-sm text-foreground">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button size="sm" onClick={addComment} disabled={!newComment.trim() || submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Evidence */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Evidence ({attachments.length})</CardTitle>
                <div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Paperclip className="h-3 w-3 mr-1" />}
                    Attach
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No evidence attached yet</p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">{a.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{a.uploaded_at ? format(new Date(a.uploaded_at), 'MMM d') : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Timeline ({timelineItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No timeline entries yet</p>
              ) : (
                <div className="space-y-3">
                  {timelineItems.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg border border-border/60">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-foreground capitalize">{item.type.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-muted-foreground">{item.timestamp ? format(new Date(item.timestamp), 'MMM d, yyyy HH:mm') : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Response checklist */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Response Checklist</CardTitle>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${(completedChecks / totalChecks) * 100}%` }} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checkItems.map(item => (
                  <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox checked={checkState[item.id]} onCheckedChange={checked => setCheckState(prev => ({ ...prev, [item.id]: !!checked }))} className="mt-0.5" />
                    <span className={`text-sm transition-colors ${checkState[item.id] ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Post-Incident Review Modal */}
      {pirOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPirOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Post-Incident Review</h3>
              <button onClick={() => setPirOpen(false)} className="p-1 rounded hover:bg-secondary transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Root Cause *</label>
                <textarea value={pirForm.root_cause} onChange={e => setPirForm(p => ({ ...p, root_cause: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px]" placeholder="What was the root cause?" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Lessons Learned</label>
                <textarea value={pirForm.lessons_learned} onChange={e => setPirForm(p => ({ ...p, lessons_learned: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px]" placeholder="What did we learn?" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Action Items</label>
                <textarea value={pirForm.action_items} onChange={e => setPirForm(p => ({ ...p, action_items: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px]" placeholder="Follow-up actions..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPirOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={submitPir} disabled={!pirForm.root_cause.trim()}>Submit & Close Incident</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
