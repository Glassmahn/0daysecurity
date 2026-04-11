import { createFileRoute, Link } from '@tanstack/react-router';
import { useSupabaseTable } from '@/hooks/use-supabase-data';
import { Loader2, ArrowLeft, BookOpen, Calendar, Pencil } from 'lucide-react';
import { useState, lazy, Suspense } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';

const MarkdownPreview = lazy(() => import('@uiw/react-md-editor').then(mod => ({ default: mod.default.Markdown })));

export const Route = createFileRoute('/knowledge-base/$articleId')({
  component: KBArticleDetail,
  head: () => ({
    meta: [{ title: 'Article — WatchDog Security' }],
  }),
});

const categoryStyles: Record<string, string> = {
  runbook: 'bg-status-in-progress/15 text-status-in-progress',
  guide: 'bg-primary/15 text-primary',
  procedure: 'bg-status-warning/15 text-status-warning',
  checklist: 'bg-status-passing/15 text-status-passing',
};

const kbFields: FieldDef[] = [
  { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Article title', max: 255 },
  { name: 'content', label: 'Content', type: 'markdown' as const, placeholder: 'Write content in Markdown...', max: 50000 },
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

function KBArticleDetail() {
  const { articleId } = Route.useParams();
  const { data: articles, loading } = useSupabaseTable('knowledge_base');
  const { update } = useSupabaseCrud('knowledge_base');
  const [formOpen, setFormOpen] = useState(false);

  const article = (articles as any[]).find((a: any) => a.id === articleId);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!article) {
    return (
      <div className="text-center py-24">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Article not found</h2>
        <Link to="/knowledge-base" className="text-primary hover:underline text-sm">← Back to Knowledge Base</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <Link to="/knowledge-base" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Knowledge Base
        </Link>
        <button onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground">
          <Pencil className="h-4 w-4" /> Edit
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${categoryStyles[article.category ?? ''] ?? 'bg-muted text-muted-foreground'}`}>{article.category}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Updated {new Date(article.updated_at).toLocaleDateString()}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-6">{article.title}</h1>

        {article.tags && (article.tags as string[]).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {(article.tags as string[]).map((tag: string) => (
              <span key={tag} className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}

        <div data-color-mode="auto">
          {article.content ? (
            <Suspense fallback={<div className="h-32 bg-muted rounded animate-pulse" />}>
              <MarkdownPreview source={article.content} style={{ background: 'transparent' }} />
            </Suspense>
          ) : (
            <p className="text-sm text-muted-foreground italic">No content yet.</p>
          )}
        </div>
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title="Edit Article" fields={kbFields}
        initialValues={{ title: article.title, content: article.content, category: article.category, status: article.status, _id: article.id }}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; return update(String(_id), data); }} />
    </div>
  );
}
