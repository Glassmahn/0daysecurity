import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, Plus, Pencil, Trash2, Download, BookOpen, Tag } from 'lucide-react';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { useTableSort } from '@/hooks/use-table-sort';
import { SortableHeader } from '@/components/crud/SortableHeader';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';
import { exportToCsv } from '@/lib/export-csv';

const kbSearchSchema = z.object({
  category: fallback(z.string(), 'all').default('all'),
  q: fallback(z.string(), '').default(''),
});

export const Route = createFileRoute('/knowledge-base/')({
  component: KnowledgeBasePage,
  validateSearch: zodValidator(kbSearchSchema),
  head: () => ({
    meta: [
      { title: 'Knowledge Base — WatchDog Security' },
      { name: 'description', content: 'Internal security knowledge base, runbooks, and guides' },
    ],
  }),
});

const categoryStyles: Record<string, string> = {
  runbook: 'bg-status-in-progress/15 text-status-in-progress',
  guide: 'bg-primary/15 text-primary',
  procedure: 'bg-status-warning/15 text-status-warning',
  checklist: 'bg-status-passing/15 text-status-passing',
};

const statusStyles: Record<string, string> = {
  published: 'bg-status-passing/15 text-status-passing',
  draft: 'bg-muted text-muted-foreground',
  archived: 'bg-status-failing/15 text-status-failing',
};

const kbFields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Article title', max: 255 },
  { name: 'content', label: 'Content', type: 'markdown' as const, placeholder: 'Write your article content in Markdown...', max: 50000 },
  {
    name: 'category', label: 'Category', type: 'select', required: true,
    options: [
      { value: 'runbook', label: 'Runbook' }, { value: 'guide', label: 'Guide' },
      { value: 'procedure', label: 'Procedure' }, { value: 'checklist', label: 'Checklist' },
    ],
  },
  {
    name: 'status', label: 'Status', type: 'select', required: true,
    options: [
      { value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' },
      { value: 'archived', label: 'Archived' },
    ],
  },
];

const kbStatusOptions = kbFields.find(f => f.name === 'status')!.options!;

function KnowledgeBasePage() {
  const navigate = useNavigate({ from: '/knowledge-base/' });
  const { category: categoryFilter, q: search } = Route.useSearch();
  const { data: articles, loading, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('knowledge_base');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const filtered = useMemo(() => {
    return articles.filter(a => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.title.toLowerCase().includes(q) || (a.content ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [articles, categoryFilter, search]);

  const { sorted, sort, toggle: toggleSort } = useTableSort(filtered, 'updated_at', 'desc');
  const pagination = usePagination(sorted);
  const filteredIds = useMemo(() => filtered.map(a => a.id), [filtered]);
  const bulk = useBulkSelection(filteredIds);

  const updateSearch = (updates: Record<string, string>) => {
    navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...updates }) });
  };

  const activeFilterCount = (categoryFilter !== 'all' ? 1 : 0) + (search ? 1 : 0);

  const categoryCounts = useMemo(() => ({
    runbook: articles.filter(a => a.category === 'runbook').length,
    guide: articles.filter(a => a.category === 'guide').length,
    procedure: articles.filter(a => a.category === 'procedure').length,
    checklist: articles.filter(a => a.category === 'checklist').length,
  }), [articles]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">{articles.length} articles</p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button onClick={() => navigate({ search: { category: 'all', q: '' } })}
              className="text-xs text-primary hover:underline cursor-pointer">
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <button onClick={() => exportToCsv('knowledge-base', filtered as Record<string, unknown>[], [
              { key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'status', label: 'Status' },
              { key: 'updated_at', label: 'Updated' },
            ])} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={() => { setEditing(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> New Article
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['runbook', 'guide', 'procedure', 'checklist'] as const).map(cat => (
          <button key={cat} onClick={() => updateSearch({ category: categoryFilter === cat ? 'all' : cat })}
            className={`bg-card border rounded-lg p-4 text-left hover:border-primary/40 transition-all cursor-pointer ${categoryFilter === cat ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
            <div className={`text-2xl font-bold ${categoryFilter === cat ? 'text-primary' : ''}`}>{categoryCounts[cat]}</div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground capitalize">{cat}s</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search articles..." value={search} onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={categoryFilter} onChange={e => updateSearch({ category: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${categoryFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
          <option value="all">All Categories</option>
          <option value="runbook">Runbooks</option><option value="guide">Guides</option>
          <option value="procedure">Procedures</option><option value="checklist">Checklists</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} articles matching filters</p>

      <BulkActionBar count={bulk.count} onClear={bulk.clear}
        onBulkDelete={() => bulkRemove([...bulk.selected])}
        statusOptions={kbStatusOptions}
        onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })}
        entityName="article" />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3 w-10">
                <input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }}
                  onChange={bulk.toggleAll} className="rounded border-border" />
              </th>
              <SortableHeader label="Title" column="title" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Category" column="category" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
              <SortableHeader label="Updated" column="updated_at" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paged.map(article => (
              <tr key={article.id} className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${bulk.isSelected(article.id) ? 'bg-primary/5' : ''}`}
                onClick={() => navigate({ to: '/knowledge-base/$articleId', params: { articleId: article.id } })}>
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={bulk.isSelected(article.id)} onChange={() => bulk.toggle(article.id)} className="rounded border-border" />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{article.title}</div>
                  {article.tags && (article.tags as string[]).length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {(article.tags as string[]).slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${categoryStyles[article.category ?? ''] ?? 'bg-muted text-muted-foreground'}`}>{article.category}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[article.status] ?? ''}`}>{article.status}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                  {new Date(article.updated_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditing({ title: article.title, content: article.content, category: article.category, status: article.status, _id: article.id }); setFormOpen(true); }}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteTarget({ id: article.id, title: article.title })}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No articles match the current filters.{' '}
            <button onClick={() => navigate({ search: { category: 'all', q: '' } })} className="text-primary hover:underline cursor-pointer">Clear filters</button>
          </div>
        )}
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title={editing ? 'Edit Article' : 'New Article'} fields={kbFields}
        initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'article'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
  );
}
