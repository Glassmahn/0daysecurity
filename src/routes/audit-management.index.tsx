import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, Plus, ClipboardList, Calendar, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { WriteGuard } from '@/components/guards/RoleGuards';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';

export const Route = createFileRoute('/audit-management/')({
  component: AuditManagementIndexPage,
  head: () => ({ meta: [{ title: 'Audits — ZeroDay Security' }] }),
});

const auditFields: FieldDef[] = [
  { name: 'title', label: 'Audit Title', type: 'text', required: true, placeholder: 'e.g. SOC 2 Type II Audit 2026', max: 255 },
  { name: 'framework', label: 'Framework', type: 'text', placeholder: 'e.g. SOC 2, ISO 27001' },
  {
    name: 'status', label: 'Status', type: 'select', required: true,
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  { name: 'scope', label: 'Scope', type: 'textarea', placeholder: 'Audit scope description...', max: 2000 },
  { name: 'start_date', label: 'Start Date', type: 'date' },
  { name: 'end_date', label: 'End Date', type: 'date' },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...', max: 5000 },
];

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-status-in-progress/12 text-status-in-progress',
  completed: 'bg-status-passing/12 text-status-passing',
  cancelled: 'bg-status-failing/12 text-status-failing',
};

function AuditManagementIndexPage() {
  const navigate = useNavigate({ from: '/audit-management/' });
  const [audits, setAudits] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [search, setSearch] = useState('');

  async function fetchAudits(cancelRef?: { current: boolean }) {
    setLoading(true);
    const { data, error } = await supabase.from('audits')
      .select('id, title, status, framework, scope, start_date, end_date, created_at')
      .order('created_at', { ascending: false });
    if (cancelRef?.current) return;
    if (error) toast.error('Failed to load audits');
    else setAudits(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchAudits(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return audits;
    const q = search.toLowerCase();
    return audits.filter(a => a.title.toLowerCase().includes(q) || (a.framework ?? '').toLowerCase().includes(q));
  }, [audits, search]);

  const pagination = usePagination(filtered);

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = editing?.id
      ? (supabase as any).from('audits').update(values).eq('id', editing.id)
      : (supabase as any).from('audits').insert(values);
    const { error } = await payload;
    if (error) { toast.error('Failed to save audit'); return false; }
    toast.success(editing?.id ? 'Audit updated' : 'Audit created');
    await fetchAudits();
    setEditing(null);
    return true;
  }

  const openEdit = useCallback((audit: Record<string, any>) => {
    setEditing(audit);
    setFormOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading audits...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Audit Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Schedule and track audit engagements, findings, and evidence requests</p>
        </div>
        <WriteGuard>
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Audit
          </button>
        </WriteGuard>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search audits..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {audits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-primary/60" />
          </div>
          <p className="text-sm text-muted-foreground">No audits yet</p>
          <WriteGuard>
            <button
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="text-sm text-primary font-medium hover:underline"
            >
              Create your first audit
            </button>
          </WriteGuard>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {pagination.paged.map(audit => (
              <div
                key={audit.id}
                className="bg-card border border-border/60 rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => navigate({ to: '/audit-management/$auditId', params: { auditId: audit.id } })}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-foreground truncate">{audit.title}</h3>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${statusStyles[audit.status] || 'bg-muted text-muted-foreground'}`}>
                        {audit.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                      {audit.framework && (
                        <span className="flex items-center gap-1.5">
                          <ClipboardList className="h-3.5 w-3.5" /> {audit.framework}
                        </span>
                      )}
                      {audit.start_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" /> {audit.start_date}{audit.end_date ? ` → ${audit.end_date}` : ''}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Created {new Date(audit.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {audit.scope && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{audit.scope}</p>
                    )}
                  </div>
                  <WriteGuard>
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(audit); }}
                      className="shrink-0 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Edit
                    </button>
                  </WriteGuard>
                </div>
              </div>
            ))}
          </div>
          <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={v => { setFormOpen(v); if (!v) setEditing(null); }}
        title={editing ? 'Edit Audit' : 'New Audit'}
        fields={auditFields}
        initialValues={editing ?? undefined}
        onSubmit={handleSubmit}
        entityType="audits"
      />
    </div>
  );
}
