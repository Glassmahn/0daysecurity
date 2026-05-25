import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Plus, BookOpen, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { WriteGuard } from '@/components/guards/RoleGuards';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';

export const Route = createFileRoute('/training/')({
  component: TrainingIndexPage,
  head: () => ({ meta: [{ title: 'Training — ZeroDay Security' }] }),
});

const statusStyles: Record<string, string> = {
  active: 'bg-status-passing/12 text-status-passing',
  archived: 'bg-muted text-muted-foreground',
};

function TrainingIndexPage() {
  const navigate = useNavigate({ from: '/training/' });
  const [courses, setCourses] = useState<Record<string, any>[]>([]);
  const [frameworks, setFrameworks] = useState<Record<string, any>[]>([]);
  const [controls, setControls] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [search, setSearch] = useState('');

  async function fetchCourses(cancelRef?: { current: boolean }) {
    setLoading(true);
    const { data, error } = await supabase.from('training_courses').select('id, title, description, status, category, duration_minutes, framework_ids, control_ids').order('created_at', { ascending: false });
    if (cancelRef?.current) return;
    if (error) toast.error('Failed to load courses');
    else setCourses(data ?? []);
    setLoading(false);
  }

  async function fetchLookups(cancelRef?: { current: boolean }) {
    const [fwRes, ctrlRes] = await Promise.all([
      supabase.from('frameworks').select('id, name').eq('enabled', true).order('name'),
      supabase.from('controls').select('id, code, title').order('code'),
    ]);
    if (cancelRef?.current) return;
    if (!fwRes.error) setFrameworks(fwRes.data ?? []);
    if (!ctrlRes.error) setControls(ctrlRes.data ?? []);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchCourses(cancelRef);
    fetchLookups(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return courses;
    const q = search.toLowerCase();
    return courses.filter(c => c.title.toLowerCase().includes(q));
  }, [courses, search]);

  const pagination = usePagination(filtered);

  const courseFields: FieldDef[] = [
    { name: 'title', label: 'Course Title', type: 'text', required: true, placeholder: 'e.g. Security Awareness Q2 2026', max: 255 },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Course description...', max: 5000 },
    { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g. Security Awareness, Compliance, Technical' },
    { name: 'duration_minutes', label: 'Duration (minutes)', type: 'number', min: 1, max: 9999 },
    {
      name: 'status', label: 'Status', type: 'select', required: true,
      options: [{ value: 'active', label: 'Active' }, { value: 'archived', label: 'Archived' }],
    },
    {
      name: 'framework_ids', label: 'Linked Frameworks', type: 'multi-select',
      options: frameworks.map(f => ({ value: f.id, label: f.name })),
    },
    {
      name: 'control_ids', label: 'Linked Controls', type: 'multi-select',
      options: controls.map(c => ({ value: c.id, label: `${c.code} — ${c.title}` })),
    },
  ];

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = editing?.id
      ? supabase.from('training_courses').update(values as TablesUpdate<'training_courses'>).eq('id', editing.id)
      : supabase.from('training_courses').insert(values as TablesInsert<'training_courses'>);
    const { error } = await payload;
    if (error) { toast.error('Failed to save course'); return false; }
    toast.success(editing?.id ? 'Course updated' : 'Course created');
    await fetchCourses();
    setEditing(null);
    return true;
  }

  if (loading && !courses.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        <p className="text-sm text-muted-foreground">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Training Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage training courses and assignments{loading && <span className="inline-flex items-center gap-1 ml-2 text-xs"><Loader2 className="h-3 w-3 animate-spin" />refreshing</span>}</p>
        </div>
        <WriteGuard>
          <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> New Course
          </button>
        </WriteGuard>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input aria-label="Search courses" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center"><BookOpen className="h-6 w-6 text-primary/60" /></div>
          <p className="text-sm text-muted-foreground">No courses yet</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {pagination.paged.map(course => (
              <div key={course.id} className="bg-card border border-border/60 rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate({ to: '/training/$courseId', params: { courseId: course.id } })}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-foreground truncate">{course.title}</h3>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${statusStyles[course.status] || 'bg-muted text-muted-foreground'}`}>{course.status}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                      {course.category && <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> {course.category}</span>}
                      {course.duration_minutes && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {course.duration_minutes} min</span>}
                      {course.framework_ids?.length > 0 && <span className="flex items-center gap-1">{course.framework_ids.length} framework(s)</span>}
                      {course.control_ids?.length > 0 && <span className="flex items-center gap-1">{course.control_ids.length} control(s)</span>}
                    </div>
                    {course.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{course.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
        </>
      )}

      <EntityFormDialog open={formOpen} onOpenChange={v => { setFormOpen(v); if (!v) setEditing(null); }} title={editing ? 'Edit Course' : 'New Course'} fields={courseFields} initialValues={editing ?? undefined} onSubmit={handleSubmit} entityType="training_courses" />
    </div>
  );
}
