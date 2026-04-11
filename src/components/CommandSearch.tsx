import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Shield, AlertTriangle, Flame, Monitor, FileText, Paperclip, AlertOctagon, Building2, FlaskConical, BookOpen } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ElementType;
  href: string;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; table: string; titleCol: string; subtitleCols: string[]; hrefPrefix: string; paramName?: string }> = {
  Controls: { icon: Shield, table: 'controls', titleCol: 'title', subtitleCols: ['code', 'status', 'category'], hrefPrefix: '/controls/$controlId', paramName: 'controlId' },
  Incidents: { icon: Flame, table: 'incidents', titleCol: 'title', subtitleCols: ['severity', 'status'], hrefPrefix: '/incidents/$incidentId', paramName: 'incidentId' },
  Evidence: { icon: Paperclip, table: 'evidence', titleCol: 'title', subtitleCols: ['type', 'status', 'source'], hrefPrefix: '/evidence/$evidenceId', paramName: 'evidenceId' },
  Alerts: { icon: AlertTriangle, table: 'alerts', titleCol: 'title', subtitleCols: ['severity', 'status', 'source'], hrefPrefix: '/alerts' },
  Risks: { icon: AlertOctagon, table: 'risks', titleCol: 'title', subtitleCols: ['category', 'status', 'risk_score'], hrefPrefix: '/risk-register/$riskId', paramName: 'riskId' },
  Vendors: { icon: Building2, table: 'vendors', titleCol: 'name', subtitleCols: ['risk_tier', 'status', 'contact_email'], hrefPrefix: '/vendors/$vendorId', paramName: 'vendorId' },
  Tests: { icon: FlaskConical, table: 'tests', titleCol: 'name', subtitleCols: ['status', 'result', 'schedule'], hrefPrefix: '/tests/$testId', paramName: 'testId' },
  Policies: { icon: FileText, table: 'policies', titleCol: 'title', subtitleCols: ['status', 'version'], hrefPrefix: '/policies/$policyId', paramName: 'policyId' },
  Assets: { icon: Monitor, table: 'assets', titleCol: 'name', subtitleCols: ['type', 'status', 'criticality'], hrefPrefix: '/assets/$assetId', paramName: 'assetId' },
  'Knowledge Base': { icon: BookOpen, table: 'knowledge_base', titleCol: 'title', subtitleCols: ['category', 'status'], hrefPrefix: '/knowledge-base/$articleId', paramName: 'articleId' },
};

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAll(query), 200);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function searchAll(q: string) {
    setSearching(true);
    const allResults: SearchResult[] = [];
    const limit = 4;

    const promises = Object.entries(CATEGORY_CONFIG).map(async ([category, cfg]) => {
      const cols = [cfg.titleCol, ...cfg.subtitleCols, 'id'].join(',');
      const { data } = await supabase
        .from(cfg.table as any)
        .select(cols)
        .ilike(cfg.titleCol, `%${q}%`)
        .limit(limit);

      if (data) {
        for (const row of data as any[]) {
          const subtitle = cfg.subtitleCols.map(c => row[c] ?? '—').join(' · ');
          let href = cfg.hrefPrefix;
          if (cfg.paramName) {
            href = cfg.hrefPrefix;
          } else {
            href = cfg.hrefPrefix;
          }
          allResults.push({
            id: `${cfg.table}-${row.id}`,
            title: row[cfg.titleCol],
            subtitle,
            category,
            icon: cfg.icon,
            href,
            // Store ID for parameterized links
            ...(cfg.paramName ? { _entityId: row.id, _paramName: cfg.paramName } as any : {}),
          });
        }
      }
    });

    await Promise.all(promises);
    setResults(allResults);
    setSelectedIndex(0);
    setSearching(false);
  }

  const grouped = groupResults(results);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    }
  }, [results.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search controls, incidents, evidence, vendors, knowledge base…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] text-muted-foreground font-mono">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {query.length < 2 ? (
            <div className="px-4 py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">Type at least 2 characters to search across all modules</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {Object.keys(CATEGORY_CONFIG).map(label => (
                  <span key={label} className="text-[10px] px-2 py-1 bg-muted rounded-full text-muted-foreground">{label}</span>
                ))}
              </div>
            </div>
          ) : searching ? (
            <div className="px-4 py-8 text-center">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Searching…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No results for "<span className="text-foreground">{query}</span>"</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-1.5">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">{category}</span>
                </div>
                {items.map(item => {
                  const globalIndex = results.indexOf(item);
                  const Icon = item.icon;
                  const paramName = (item as any)._paramName;
                  const entityId = (item as any)._entityId;
                  const linkProps = paramName
                    ? { to: item.href, params: { [paramName]: entityId } }
                    : { to: item.href };
                  return (
                    <Link
                      key={item.id}
                      {...linkProps as any}
                      data-index={globalIndex}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                        globalIndex === selectedIndex ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {results.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
            <span>{results.length} results</span>
            <div className="flex items-center gap-2">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function groupResults(results: SearchResult[]): Record<string, SearchResult[]> {
  const groups: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  }
  return groups;
}
