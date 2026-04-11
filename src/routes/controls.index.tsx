import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useSupabaseTable } from '@/hooks/use-supabase-data';
import { Search, Loader2 } from 'lucide-react';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';

const controlsSearchSchema = z.object({
  status: fallback(z.string(), 'all').default('all'),
  category: fallback(z.string(), 'all').default('all'),
  q: fallback(z.string(), '').default(''),
});

export const Route = createFileRoute('/controls/')({
  component: ControlsPage,
  validateSearch: zodValidator(controlsSearchSchema),
  head: () => ({
    meta: [
      { title: 'Controls — WatchDog Security' },
      { name: 'description', content: 'Security controls management' },
    ],
  }),
});

const statusStyles: Record<string, string> = {
  implemented: 'bg-status-passing/15 text-status-passing',
  in_progress: 'bg-status-in-progress/15 text-status-in-progress',
  failing: 'bg-status-failing/15 text-status-failing',
  not_started: 'bg-muted text-muted-foreground',
  not_applicable: 'bg-muted text-muted-foreground',
};

function ControlsPage() {
  const navigate = useNavigate({ from: '/controls/' });
  const { status: statusFilter, category: categoryFilter, q: search } = Route.useSearch();
  const { data: controls, loading } = useSupabaseTable('controls');

  const usedCategories = useMemo(
    () => [...new Set(controls.map(c => c.category).filter(Boolean))].sort() as string[],
    [controls]
  );

  const filtered = useMemo(() => {
    return controls.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [controls, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: controls.length,
    implemented: controls.filter(c => c.status === 'implemented').length,
    failing: controls.filter(c => c.status === 'failing').length,
    in_progress: controls.filter(c => c.status === 'in_progress').length,
  }), [controls]);

  const updateSearch = (updates: Record<string, string>) => {
    navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...updates }) });
  };

  const activeFilterCount = [statusFilter, categoryFilter].filter(f => f !== 'all').length + (search ? 1 : 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Controls</h1>
          <p className="text-sm text-muted-foreground">{controls.length} controls</p>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={() => navigate({ search: { status: 'all', category: 'all', q: '' } })}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={() => updateSearch({ status: 'all' })} className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-colors cursor-pointer">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Controls</div>
        </button>
        <button onClick={() => updateSearch({ status: 'implemented' })} className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-colors cursor-pointer">
          <div className="text-2xl font-bold text-status-passing">{stats.implemented}</div>
          <div className="text-xs text-muted-foreground">Implemented</div>
        </button>
        <button onClick={() => updateSearch({ status: 'failing' })} className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-colors cursor-pointer">
          <div className="text-2xl font-bold text-status-failing">{stats.failing}</div>
          <div className="text-xs text-muted-foreground">Failing</div>
        </button>
        <button onClick={() => updateSearch({ status: 'in_progress' })} className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary/40 transition-colors cursor-pointer">
          <div className="text-2xl font-bold text-status-in-progress">{stats.in_progress}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search controls..."
            value={search}
            onChange={e => updateSearch({ q: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => updateSearch({ status: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
        >
          <option value="all">All Statuses</option>
          <option value="implemented">Implemented</option>
          <option value="in_progress">In Progress</option>
          <option value="failing">Failing</option>
          <option value="not_started">Not Started</option>
        </select>
        <select
          value={categoryFilter}
          onChange={e => updateSearch({ category: e.target.value })}
          className={`bg-card border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${categoryFilter !== 'all' ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
        >
          <option value="all">All Categories</option>
          {usedCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} controls matching filters</p>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Code</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Category</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Last Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr
                key={c.id}
                onClick={() => navigate({ to: '/controls/$controlId', params: { controlId: c.id } })}
                className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-xs text-primary">{c.code}</td>
                <td className="px-4 py-3 text-foreground">{c.title}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.category ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusStyles[c.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                  {c.last_reviewed ? new Date(c.last_reviewed).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No controls match the current filters.{' '}
            <button onClick={() => navigate({ search: { status: 'all', category: 'all', q: '' } })} className="text-primary hover:underline cursor-pointer">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
