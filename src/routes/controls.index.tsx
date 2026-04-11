import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { enrichedControls, controlCategories, frameworkCatalog, evidenceTypes } from '@/lib/framework-catalog';
import { Search, Filter, Layers, Zap, ChevronDown } from 'lucide-react';

export const Route = createFileRoute('/controls/')({
  component: ControlsPage,
  head: () => ({
    meta: [
      { title: 'Controls — WatchDog Security' },
      { name: 'description', content: 'Security controls management with cross-framework mapping' },
    ],
  }),
});

const statusStyles: Record<string, string> = {
  implemented: 'bg-status-passing/15 text-status-passing',
  in_progress: 'bg-status-in-progress/15 text-status-in-progress',
  failing: 'bg-status-failing/15 text-status-failing',
  not_implemented: 'bg-muted text-muted-foreground',
  not_applicable: 'bg-muted text-muted-foreground',
};

function ControlsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeFrameworks = frameworkCatalog.filter(fw => fw.enabled);
  const usedCategories = [...new Set(enrichedControls.map(c => c.category))].sort();

  const filtered = useMemo(() => {
    return enrichedControls.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (frameworkFilter !== 'all' && !c.frameworks.includes(frameworkFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter, categoryFilter, frameworkFilter]);

  const stats = {
    total: enrichedControls.length,
    implemented: enrichedControls.filter(c => c.status === 'implemented').length,
    failing: enrichedControls.filter(c => c.status === 'failing').length,
    automatable: enrichedControls.filter(c => c.automatable).length,
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Controls</h1>
        <p className="text-sm text-muted-foreground">{enrichedControls.length} controls across {[...new Set(enrichedControls.flatMap(c => c.frameworks))].length} frameworks</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Controls</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-status-passing">{stats.implemented}</div>
          <div className="text-xs text-muted-foreground">Implemented</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-status-failing">{stats.failing}</div>
          <div className="text-xs text-muted-foreground">Failing</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-chart-1" />
            <span className="text-2xl font-bold text-foreground">{stats.automatable}</span>
          </div>
          <div className="text-xs text-muted-foreground">Automatable</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search controls..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Statuses</option>
          <option value="implemented">Implemented</option>
          <option value="in_progress">In Progress</option>
          <option value="failing">Failing</option>
          <option value="not_implemented">Not Implemented</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Categories</option>
          {usedCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={frameworkFilter} onChange={e => setFrameworkFilter(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Frameworks</option>
          {[...new Set(enrichedControls.flatMap(c => c.frameworks))].sort().map(fw => (
            <option key={fw} value={fw}>{fw}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} controls matching filters</p>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Ref</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Category</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Frameworks</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Owner</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Impl %</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <>
                <tr
                  key={c.id}
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary">{c.ref}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-foreground">{c.title}</span>
                      {c.automatable && <Zap className="h-3 w-3 text-chart-1 shrink-0" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.category}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusStyles[c.status]}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {c.frameworks.slice(0, 3).map(fw => (
                        <span key={fw} className="text-[9px] px-1 py-0.5 bg-muted rounded text-muted-foreground">{fw}</span>
                      ))}
                      {c.frameworks.length > 3 && (
                        <span className="text-[9px] px-1 py-0.5 bg-muted rounded text-muted-foreground">+{c.frameworks.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.owner}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${c.implementationPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{c.implementationPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{c.evidenceCount}</td>
                </tr>
                {expandedId === c.id && (
                  <tr key={`${c.id}-detail`} className="border-b border-border">
                    <td colSpan={8} className="px-4 py-4 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</h4>
                          <p className="text-sm text-foreground">{c.description}</p>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-3 mb-1">Test Frequency</h4>
                          <p className="text-sm text-foreground capitalize">{c.testFrequency}</p>
                          {c.lastTested && (
                            <>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-3 mb-1">Last Tested</h4>
                              <p className="text-sm text-foreground">{c.lastTested}</p>
                            </>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Cross-Framework Mappings</h4>
                          <div className="space-y-1">
                            {c.crossMappings.map(m => (
                              <div key={m.framework + m.ref} className="flex items-center gap-2 text-sm">
                                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-mono">{m.framework}</span>
                                <span className="text-muted-foreground">{m.ref}</span>
                              </div>
                            ))}
                          </div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-3 mb-1">Evidence Types</h4>
                          <div className="flex flex-wrap gap-1">
                            {c.evidenceTypes.map(et => (
                              <span key={et} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground capitalize">
                                {et.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {c.evidenceTypes.length === 0 && <span className="text-xs text-muted-foreground italic">No evidence linked</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
