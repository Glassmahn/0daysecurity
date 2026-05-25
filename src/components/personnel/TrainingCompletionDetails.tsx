import { useState, useEffect } from 'react';
import { X, Loader2, GraduationCap, CheckCircle, Clock, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TrainingCompletionDetailsProps {
  personId: string;
  personName: string;
  onClose: () => void;
}

const statusStyles: Record<string, string> = {
  completed: 'bg-status-passing/15 text-status-passing',
  in_progress: 'bg-status-in-progress/15 text-status-in-progress',
  assigned: 'bg-status-warning/15 text-status-warning',
  expired: 'bg-status-failing/15 text-status-failing',
};

const statusIcons: Record<string, typeof CheckCircle> = {
  completed: CheckCircle,
  in_progress: Clock,
  assigned: Clock,
  expired: AlertCircle,
};

export function TrainingCompletionDetails({ personId, personName, onClose }: TrainingCompletionDetailsProps) {
  const [assignments, setAssignments] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('training_assignments')
        .select('id, status, score, completed_at, created_at, course:course_id(title, category, duration_minutes)')
        .eq('user_id', personId)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      setAssignments(data ?? []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [personId]);

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;
  const pendingCount = assignments.filter(a => a.status === 'assigned').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Training Completion</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{personName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-status-passing">{completedCount}</div>
            <div className="text-[10px] text-muted-foreground">Completed</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-status-in-progress">{inProgressCount}</div>
            <div className="text-[10px] text-muted-foreground">In Progress</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-muted-foreground">{pendingCount}</div>
            <div className="text-[10px] text-muted-foreground">Pending</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No training assignments found</p>
              <p className="text-xs text-muted-foreground/60">This person has not been assigned any training courses yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => {
                const course = a.course as Record<string, any> | null;
                const SIcon = statusIcons[a.status] ?? Clock;
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60">
                    <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{course?.title ?? 'Unknown Course'}</p>
                      <p className="text-xs text-muted-foreground">
                        {course?.category ? `${course.category} · ` : ''}
                        {course?.duration_minutes ? `${course.duration_minutes} min` : ''}
                        {a.score !== null ? ` · Score: ${a.score}%` : ''}
                      </p>
                      {a.completed_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Completed {new Date(a.completed_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${statusStyles[a.status] ?? ''}`}>
                      <SIcon className="h-3 w-3" />
                      {a.status.replace(/_/g, ' ')}
                    </span>
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
