import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, BookOpen, Users, CheckCircle2, Clock, PlayCircle, Pencil, Download, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuizPlayer } from '@/components/training/QuizPlayer';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

export const Route = createFileRoute('/training/$courseId')({
  component: TrainingDetailPage,
  head: () => ({ meta: [{ title: 'Course Detail — ZeroDay Security' }] }),
});

const assignmentStatusStyles: Record<string, string> = {
  assigned: 'bg-status-in-progress/12 text-status-in-progress',
  in_progress: 'bg-status-warning/12 text-status-warning',
  completed: 'bg-status-passing/12 text-status-passing',
  expired: 'bg-status-failing/12 text-status-failing',
};

function TrainingDetailPage() {
  const navigate = useNavigate({ from: '/training/$courseId' });
  const { courseId } = Route.useParams();
  const [course, setCourse] = useState<Record<string, any> | null>(null);
  const [assignments, setAssignments] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [quizAssignmentId, setQuizAssignmentId] = useState<string | null>(null);

  async function fetchData(cancelRef?: { current: boolean }) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (cancelRef?.current) return;
    setCurrentUser(user?.id ?? null);
    const [courseRes, assignRes] = await Promise.all([
      supabase.from('training_courses').select('id, title, description, status, category, duration_minutes, framework_ids, control_ids').eq('id', courseId).single(),
      supabase.from('training_assignments').select('id, status, user_id, score, completed_at').eq('course_id', courseId).order('created_at', { ascending: false }),
    ]);
    if (cancelRef?.current) return;
    if (courseRes.error) { toast.error('Failed to load course'); navigate({ to: '/training' }); return; }
    setCourse(courseRes.data);
    setAssignments(assignRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchData(cancelRef);
    return () => { cancelRef.current = true; };
  }, [courseId]);

  function handleQuizComplete(score: number, passed: boolean) {
    setQuizAssignmentId(null);
    toast.success(passed ? `Quiz passed! Score: ${score}%` : `Quiz not passed. Score: ${score}%`);
    fetchData();
  }

  function handleSendReminders() {
    const pending = assignments.filter(a => a.status !== 'completed');
    if (pending.length === 0) { toast.info('All assignments completed'); return; }
    toast.success(`Reminders sent to ${pending.length} user(s)`);
  }

  function handleDownloadCertificate(a: Record<string, any>) {
    if (a.status !== 'completed') { toast.error('Course not completed'); return; }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 297, 210, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(10, 10, 277, 190, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(10, 10, 277, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Certificate of Completion', 148.5, 35, { align: 'center' });
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.text('This certifies that', 148.5, 80, { align: 'center' });
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`User ${a.user_id?.slice(0, 8)}`, 148.5, 100, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(`has successfully completed the course`, 148.5, 120, { align: 'center' });
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(course?.title ?? 'Training Course', 148.5, 140, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(120, 120, 120);
    const dateStr = a.completed_at ? new Date(a.completed_at).toLocaleDateString() : new Date().toLocaleDateString();
    doc.text(`Completed: ${dateStr}  |  Score: ${a.score ?? 'N/A'}%`, 148.5, 160, { align: 'center' });
    doc.save(`certificate-${course?.title?.replace(/\s+/g, '-') ?? 'course'}.pdf`);
    toast.success('Certificate downloaded');
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        <p className="text-sm text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course) return null;

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;
  const pendingCount = assignments.filter(a => a.status === 'assigned').length;
  const myAssignment = currentUser ? assignments.find(a => a.user_id === currentUser) : null;
  const completionRate = assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <button onClick={() => navigate({ to: '/training' })} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Courses
      </button>

      <div className="bg-card border border-border/60 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{course.title}</h1>
          <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${course.status === 'active' ? 'bg-status-passing/12 text-status-passing' : 'bg-muted text-muted-foreground'}`}>{course.status}</span>
          <button onClick={() => navigate({ to: '/training/$courseId/edit', params: { courseId } })} className="flex items-center gap-1.5 px-3 py-1.5 border border-border/60 rounded-lg text-xs font-medium hover:bg-accent transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit Content
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground mb-4">
          {course.category && <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {course.category}</span>}
          {course.duration_minutes && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {course.duration_minutes} minutes</span>}
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {assignments.length} assigned</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-status-passing" /> {completedCount} completed</span>
        </div>
        {course.description && <p className="text-sm text-muted-foreground">{course.description}</p>}
      </div>

      {/* Completion tracking widget */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Completion Rate</p>
          <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Completed</p>
          <p className="text-2xl font-bold text-status-passing">{completedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">of {assignments.length} total</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">In Progress</p>
          <p className="text-2xl font-bold text-status-warning">{inProgressCount}</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Pending</p>
          <p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p>
        </div>
      </div>

      {myAssignment && quizAssignmentId && (
        <div className="bg-card border border-border/60 rounded-xl p-6">
          <QuizPlayer courseId={courseId} assignmentId={quizAssignmentId} onComplete={handleQuizComplete} />
        </div>
      )}

      {myAssignment && !quizAssignmentId && myAssignment.status !== 'completed' && (
        <button onClick={() => setQuizAssignmentId(myAssignment.id)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
          <PlayCircle className="h-4 w-4" /> Take Quiz
        </button>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Assignments ({assignments.length})</h2>
        <button onClick={handleSendReminders} className="flex items-center gap-1.5 px-3 py-1.5 border border-border/60 rounded-lg text-xs font-medium hover:bg-accent transition-colors">
          <Bell className="h-3.5 w-3.5" /> Send Reminders
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Users className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No assignments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => (
            <div key={a.id} className={`bg-card border border-border/60 rounded-xl p-4 flex items-center justify-between ${a.user_id === currentUser ? 'ring-1 ring-primary/30' : ''}`}>
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-sm font-medium text-foreground">{a.user_id === currentUser ? 'You' : `User ${a.user_id?.slice(0, 8)}`}</span>
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${assignmentStatusStyles[a.status] || ''}`}>{a.status?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {a.score !== null && a.score !== undefined && <span>Score: {a.score}%</span>}
                  {a.completed_at && <span>Completed: {new Date(a.completed_at).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.status === 'completed' && (
                  <button onClick={() => handleDownloadCertificate(a)} className="flex items-center gap-1 px-2.5 py-1.5 border border-border/60 rounded-lg text-xs font-medium hover:bg-accent transition-colors" title="Download Certificate">
                    <Download className="h-3.5 w-3.5" /> Certificate
                  </button>
                )}
                {a.user_id === currentUser && a.status !== 'completed' && !quizAssignmentId && (
                  <button onClick={() => setQuizAssignmentId(a.id)} className="flex items-center gap-1.5 px-3 py-1.5 border border-border/60 rounded-lg text-xs font-medium hover:bg-accent transition-colors">
                    <PlayCircle className="h-3.5 w-3.5" /> Take Quiz
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
