import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { FileText, Plus, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { EntityFormDialog } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import type { Tables } from '@/integrations/supabase/types';

export const Route = createFileRoute('/policies/')({
  component: PoliciesPage,
  head: () => ({ meta: [{ title: 'Policies \u2014 ZeroDay Security' }] }),
});

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-status-warning/15 text-status-warning',
  approved: 'bg-status-in-progress/15 text-status-in-progress',
  published: 'bg-status-passing/15 text-status-passing',
  archived: 'bg-muted text-muted-foreground',
};

const statusOrder = ['draft', 'review', 'approved', 'published', 'archived'];

function PoliciesPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Tables<'policies'> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [frameworkOptions, setFrameworkOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    supabase.from('frameworks').select('id, name').eq('enabled', true).order('name').then(({ data }) => {
      setFrameworkOptions((data ?? []).map(f => ({ value: f.id, label: f.name })));
    });
  }, []);

  const { data: dbPolicies, loading, error, refetch, insert, update, remove } = useSupabaseCrud('policies', 'title', true);

  const policiesList = dbPolicies ?? [];

  const policyFieldDefs = [
    { name: 'title', label: 'Title', type: 'text' as const, required: true, placeholder: 'Policy title' },
    { name: 'framework_id', label: 'Framework', type: 'select' as const, options: frameworkOptions },
    { name: 'status', label: 'Status', type: 'select' as const, options: [
      { value: 'draft', label: 'Draft' },
      { value: 'review', label: 'Review' },
      { value: 'approved', label: 'Approved' },
      { value: 'published', label: 'Published' },
      { value: 'archived', label: 'Archived' },
    ]},
    { name: 'content', label: 'Content (Markdown)', type: 'markdown' as const },
    { name: 'version', label: 'Version', type: 'text' as const, placeholder: '1.0.0' },
  ];

  async function handleSubmit(values: Record<string, unknown>) {
    if (editPolicy) {
      return update(editPolicy.id, values);
    }
    return insert(values);
  }

  function handleEdit(p: Tables<'policies'>) {
    setEditPolicy(p);
    setDialogOpen(true);
  }

  function handleDelete(p: Tables<'policies'>) {
    setDeleteTarget(p);
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-destructive">Failed to load policies</p>
        <p className="text-xs text-muted-foreground max-w-md text-center">{error}</p>
        <button onClick={refetch} className="text-xs text-primary hover:underline cursor-pointer">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Policies</h1>
          <p className="text-sm text-muted-foreground">{policiesList.length} policies managed{loading && <span className="inline-flex items-center gap-1 ml-2 text-xs"><Loader2 className="h-3 w-3 animate-spin" />refreshing</span>}</p>
        </div>
        <button
          onClick={() => { setEditPolicy(null); setDialogOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Policy
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        {statusOrder.map(s => {
          const count = policiesList.filter(p => String(p.status) === s).length;
          return (
            <div key={s} className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[s]}`}>{s}</span>
              <span className="text-sm font-bold text-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading && dbPolicies.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Version</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Review Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policiesList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No policies yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                policiesList.map(p => {
                const pid = p.id as string;
                const ptitle = p.title as string;
                const pver = (p.version as string) ?? '1.0';
                const pstatus = p.status as string;
                const preview = p.review_date as string | null;
                return (
                <tr key={pid} className="border-b border-border hover:bg-surface transition-colors">
                  <td className="px-4 py-3 cursor-pointer"
                    onClick={() => navigate({ to: '/policies/$policyId', params: { policyId: pid } })}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">{ptitle}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">v{pver}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[pstatus] ?? ''}`}>{pstatus}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{preview ? new Date(preview).toLocaleDateString() : '\u2014'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(p)} className="p-1.5 hover:bg-accent rounded-md transition-colors" title="Edit">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(p)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              }))}
            </tbody>
          </table>
        )}
      </div>

      <EntityFormDialog
        open={dialogOpen}
        onOpenChange={(o: boolean) => { setDialogOpen(o); if (!o) setEditPolicy(null); }}
        title={editPolicy ? 'Edit Policy' : 'New Policy'}
        fields={policyFieldDefs}
        initialValues={editPolicy ? { title: editPolicy.title, framework_id: editPolicy.framework_id ?? '', status: editPolicy.status, content: editPolicy.content ?? '', version: editPolicy.version ?? '' } : undefined}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o: boolean) => { if (!o) setDeleteTarget(null); }}
        title="Delete Policy"
        description={`Are you sure you want to delete "${deleteTarget?.title ?? 'this policy'}"? This action cannot be undone.`}
        onConfirm={async () => {
          if (deleteTarget) {
            const ok = await remove(deleteTarget.id);
            if (ok) setDeleteTarget(null);
            return ok;
          }
          return false;
        }}
      />
    </div>
  );
}
