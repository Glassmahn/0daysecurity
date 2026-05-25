import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CourseEditor } from '@/components/training/CourseEditor';
import { toast } from 'sonner';

export const Route = createFileRoute('/training/$courseId/edit')({
  component: CourseEditPage,
  head: () => ({ meta: [{ title: 'Edit Course — ZeroDay Security' }] }),
});

function CourseEditPage() {
  const navigate = useNavigate({ from: '/training/$courseId/edit' });
  const { courseId } = Route.useParams();
  const [course, setCourse] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('training_courses').select('id, title, content').eq('id', courseId).single();
      if (cancelled) return;
      if (error) { toast.error('Failed to load course'); navigate({ to: '/training' }); return; }
      setCourse(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        <p className="text-sm text-muted-foreground">Loading course...</p>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <button onClick={() => navigate({ to: '/training/$courseId', params: { courseId } })} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to {course.title}
      </button>

      <div className="bg-card border border-border/60 rounded-xl p-6">
        <CourseEditor
          courseId={courseId}
          initialContent={course.content ?? { sections: [] }}
          onSaved={() => {
            (async () => { const { data } = await supabase.from('training_courses').select('id, title, content').eq('id', courseId).single(); if (data) setCourse(data); })();
          }}
        />
      </div>
    </div>
  );
}
