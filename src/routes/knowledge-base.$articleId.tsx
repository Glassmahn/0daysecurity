import { createFileRoute, Link } from '@tanstack/react-router';
import { useSupabaseTable } from '@/hooks/use-supabase-data';
import { Loader2, ArrowLeft, BookOpen, Calendar, Pencil, History, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MarkdownPreview = lazy(() => import('@uiw/react-md-editor').then(mod => ({ default: mod.default.Markdown })));

export const Route = createFileRoute('/knowledge-base/$articleId')({
  component: KBArticleDetail,
  head: () => ({
    meta: [{ title: 'Article — ZeroDay Security' }],
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

interface ArticleVersion {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  content: string | null;
  category: string | null;
  status: string | null;
  changed_by: string | null;
  created_at: string;
}

function KBArticleDetail() {
  const { articleId } = Route.useParams();
  const { data: articles, loading } = useSupabaseTable('knowledge_base');
  const { update, refetch } = useSupabaseCrud('knowledge_base');
  const [formOpen, setFormOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);

  const article = (articles as any[]).find((a: any) => a.id === articleId);

  const fetchVersions = useCallback(async () => {
    if (!articleId) return;
    setVersionsLoading(true);
    const { data } = await supabase
      .from('kb_article_versions' as any)
      .select('*')
      .eq('article_id', articleId)
      .order('version_number', { ascending: false });
    setVersions((data ?? []) as unknown as ArticleVersion[]);
    setVersionsLoading(false);
  }, [articleId]);

  useEffect(() => {
    if (showHistory) fetchVersions();
  }, [showHistory, fetchVersions]);

  const handleRevert = async (version: ArticleVersion) => {
    setReverting(version.id);
    const ok = await update(articleId, {
      title: version.title,
      content: version.content,
      category: version.category,
      status: version.status,
    });
    setReverting(null);
    if (ok) {
      toast.success(`Reverted to version ${version.version_number}`);
      await fetchVersions();
      await refetch();
    }
  };

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
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${showHistory ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted text-foreground'}`}>
            <History className="h-4 w-4" /> History{versions.length > 0 && ` (${versions.length})`}
          </button>
          <button onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors text-foreground">
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${categoryStyles[article.category ?? ''] ?? 'bg-muted text-muted-foreground'}`}>{article.category}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">v{article.current_version ?? 1}</span>
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

      {/* Version History Panel */}
      {showHistory && (
        <div className="bg-card border border-border rounded-lg overflow-hidden animate-slide-in">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Version History
            </h2>
          </div>

          {versionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No previous versions yet. Edit the article to create version history.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {versions.map(v => {
                const isExpanded = expandedVersion === v.id;
                const titleChanged = v.title !== article.title;
                const contentChanged = v.content !== article.content;
                const categoryChanged = v.category !== article.category;

                return (
                  <div key={v.id} className="group">
                    <button
                      onClick={() => setExpandedVersion(isExpanded ? null : v.id)}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-bold text-muted-foreground">
                          v{v.version_number}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{v.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(v.created_at).toLocaleString()}
                            {titleChanged && <span className="ml-2 text-status-warning">title changed</span>}
                            {contentChanged && <span className="ml-2 text-status-in-progress">content changed</span>}
                            {categoryChanged && <span className="ml-2 text-primary">category changed</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${categoryStyles[v.category ?? ''] ?? 'bg-muted text-muted-foreground'}`}>{v.category}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4 space-y-3 animate-slide-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Preview of version {v.version_number}</span>
                          <button
                            onClick={() => handleRevert(v)}
                            disabled={reverting === v.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {reverting === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            Revert to this version
                          </button>
                        </div>
                        <div className="bg-muted/50 border border-border rounded-lg p-4 max-h-80 overflow-y-auto" data-color-mode="auto">
                          {v.content ? (
                            <Suspense fallback={<div className="h-16 bg-muted rounded animate-pulse" />}>
                              <MarkdownPreview source={v.content} style={{ background: 'transparent' }} />
                            </Suspense>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No content in this version.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title="Edit Article" fields={kbFields}
        initialValues={{ title: article.title, content: article.content, category: article.category, status: article.status, _id: article.id }}
        onSubmit={async (vals) => {
          const { _id, ...data } = vals as any;
          const ok = await update(String(_id), data);
          if (ok && showHistory) await fetchVersions();
          return ok;
        }} />
    </div>
  );
}
