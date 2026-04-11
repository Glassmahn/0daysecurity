import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Shield, AlertTriangle, Flame, Monitor, Users, FileText, AlertCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { enrichedControls } from '@/lib/framework-catalog';
import { alerts, incidents, assets } from '@/lib/mock-data';
import { personnelMembers, policies } from '@/lib/mock-data-extended';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ElementType;
  href: string;
}

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Cmd+K listener
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

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useSearchResults(query);
  const grouped = groupResults(results);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    }
  }, [results.length]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search controls, alerts, incidents, assets, personnel, policies…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {query.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">Start typing to search across all modules</p>
              <div className="flex justify-center gap-2 mt-3">
                {['Controls', 'Alerts', 'Incidents', 'Assets', 'Personnel', 'Policies'].map(label => (
                  <span key={label} className="text-[10px] px-2 py-1 bg-muted rounded-full text-muted-foreground">{label}</span>
                ))}
              </div>
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
                  return (
                    <Link
                      key={item.id}
                      to={item.href}
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

        {/* Footer */}
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

function useSearchResults(query: string): SearchResult[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];
  const limit = 5; // per category

  // Controls
  let count = 0;
  for (const c of enrichedControls) {
    if (count >= limit) break;
    if (c.title.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)) {
      results.push({
        id: `ctrl-${c.id}`,
        title: `${c.ref} — ${c.title}`,
        subtitle: `${c.category} · ${c.status.replace(/_/g, ' ')} · ${c.owner}`,
        category: 'Controls',
        icon: Shield,
        href: '/controls',
      });
      count++;
    }
  }

  // Alerts
  count = 0;
  for (const a of alerts) {
    if (count >= limit) break;
    if (a.title.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.source.toLowerCase().includes(q)) {
      results.push({
        id: `alert-${a.id}`,
        title: `${a.id} — ${a.title}`,
        subtitle: `${a.severity} · ${a.status} · ${a.source}`,
        category: 'Alerts',
        icon: AlertTriangle,
        href: '/alerts',
      });
      count++;
    }
  }

  // Incidents
  count = 0;
  for (const inc of incidents) {
    if (count >= limit) break;
    if (inc.title.toLowerCase().includes(q) || inc.id.toLowerCase().includes(q)) {
      results.push({
        id: `inc-${inc.id}`,
        title: `${inc.id} — ${inc.title}`,
        subtitle: `${inc.severity} · ${inc.status} · ${inc.priority.toUpperCase()}`,
        category: 'Incidents',
        icon: Flame,
        href: '/incidents',
      });
      count++;
    }
  }

  // Assets
  count = 0;
  for (const a of assets) {
    if (count >= limit) break;
    if (a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q)) {
      results.push({
        id: `asset-${a.id}`,
        title: a.name,
        subtitle: `${a.type} · ${a.environment} · Risk: ${a.riskScore}`,
        category: 'Assets',
        icon: Monitor,
        href: '/assets',
      });
      count++;
    }
  }

  // Personnel
  count = 0;
  for (const p of personnelMembers) {
    if (count >= limit) break;
    if (p.name.toLowerCase().includes(q) || p.department.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)) {
      results.push({
        id: `person-${p.id}`,
        title: p.name,
        subtitle: `${p.title} · ${p.department} · ${p.email}`,
        category: 'Personnel',
        icon: Users,
        href: '/personnel',
      });
      count++;
    }
  }

  // Policies
  count = 0;
  for (const pol of policies) {
    if (count >= limit) break;
    if (pol.title.toLowerCase().includes(q) || pol.category.toLowerCase().includes(q)) {
      results.push({
        id: `pol-${pol.id}`,
        title: pol.title,
        subtitle: `${pol.category} · v${pol.version} · ${pol.status}`,
        category: 'Policies',
        icon: FileText,
        href: '/policies',
      });
      count++;
    }
  }

  return results;
}

function groupResults(results: SearchResult[]): Record<string, SearchResult[]> {
  const groups: Record<string, SearchResult[]> = {};
  for (const r of results) {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  }
  return groups;
}
