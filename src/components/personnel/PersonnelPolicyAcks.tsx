import { useState, useEffect } from 'react';
import { X, Loader2, FileText, CheckCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PersonnelPolicyAcksProps {
  personId: string;
  personName: string;
  onClose: () => void;
}

export function PersonnelPolicyAcks({ personId, personName, onClose }: PersonnelPolicyAcksProps) {
  const [acknowledgments, setAcknowledgments] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('policy_acknowledgments')
        .select('id, acknowledged_at, version_acknowledged, created_at, policy:policy_id(title, version, status)')
        .eq('user_id', personId)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      setAcknowledgments(data ?? []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [personId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Policy Acknowledgments</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{personName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : acknowledgments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No policy acknowledgments found</p>
              <p className="text-xs text-muted-foreground/60">This person has not acknowledged any policies yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">{acknowledgments.length} acknowledgment{acknowledgments.length !== 1 ? 's' : ''}</p>
              {acknowledgments.map(a => {
                const policy = a.policy as Record<string, any> | null;
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60">
                    <CheckCircle className="h-4 w-4 text-status-passing mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{policy?.title ?? 'Unknown Policy'}</p>
                      <p className="text-xs text-muted-foreground">
                        Acknowledged {new Date(a.acknowledged_at ?? a.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {a.version_acknowledged ? ` · v${a.version_acknowledged}` : ''}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      policy?.status === 'published' ? 'bg-status-passing/15 text-status-passing' : 'bg-muted text-muted-foreground'
                    }`}>{policy?.status ?? 'unknown'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
