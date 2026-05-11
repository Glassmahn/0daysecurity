import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import { TEST_STATUS } from '@/lib/constants';
import { useBulkSelection } from '@/hooks/use-bulk-selection';
import { Search, Loader2, Plus, Pencil, Trash2, Download, FlaskConical, Filter, Library, Cpu, User, Clock, Play, ChevronRight, Zap, Target } from 'lucide-react';
import { exportToCsv } from '@/lib/export-csv';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { useTableSort } from '@/hooks/use-table-sort';
import { SortableHeader } from '@/components/crud/SortableHeader';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { BulkActionBar } from '@/components/crud/BulkActionBar';
import { WriteGuard, RouteGuard } from '@/components/guards/RoleGuards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { testLibraryCatalog, getTestCategories, getTestFrameworks, type TestTemplate } from '@/lib/test-library-catalog';
import { enrichedControls } from '@/lib/framework-catalog';
import { TestCoverageDashboard } from '@/components/tests/TestCoverageDashboard';

export const Route = createFileRoute('/tests/')({ component: TestsIndexPage,
  head: () => ({ meta: [{ title: 'Tests — ZeroDay Security' }, { name: 'description', content: 'Compliance test management' }] }) });

const statusStyles: Record<string, string> = { passing: 'bg-status-passing/12 text-status-passing', failing: 'bg-status-failing/12 text-status-failing', pending: 'bg-status-in-progress/12 text-status-in-progress', error: 'bg-severity-high/12 text-severity-high', disabled: 'bg-muted text-muted-foreground' };

const testFields: FieldDef[] = [
  { name: 'name', label: 'Test Name', type: 'text', required: true, placeholder: 'Test name', max: 255 },
  { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe this test...', max: 2000 },
  { name: 'status', label: 'Status', type: 'select', required: true, options: [
    { value: 'passing', label: 'Passing' }, { value: 'failing', label: 'Failing' }, { value: 'pending', label: 'Pending' }, { value: 'error', label: 'Error' }, { value: 'disabled', label: 'Disabled' },
  ]},
  { name: 'result', label: 'Result', type: 'text', placeholder: 'pass/fail', max: 50 },
  { name: 'schedule', label: 'Schedule', type: 'text', placeholder: 'e.g. weekly, monthly', max: 50 },
];
const testStatusOptions = testFields.find(f => f.name === 'status')!.options!;

const methodBadge: Record<string, { icon: typeof Cpu; label: string; cls: string }> = {
  automated: { icon: Cpu, label: 'Automated', cls: 'bg-primary/10 text-primary' },
  manual: { icon: User, label: 'Manual', cls: 'bg-accent text-accent-foreground' },
  hybrid: { icon: Zap, label: 'Hybrid', cls: 'bg-status-in-progress/12 text-status-in-progress' },
};

const complexityColors: Record<string, string> = {
  low: 'text-status-passing',
  medium: 'text-status-in-progress',
  high: 'text-status-failing',
};

const frameworkShortLabels: Record<string, string> = {
  SOC2: 'SOC 2', HIPAA: 'HIPAA', ISO27001: 'ISO 27001', PCI_DSS: 'PCI DSS',
  NIST_800_53: 'NIST 800-53', NIST_CSF: 'NIST CSF', GDPR: 'GDPR', CCPA: 'CCPA', CIS: 'CIS',
};

function TestsIndexPage() {
  const navigate = useNavigate();
  const { data: tests, loading, insert, update, remove, bulkRemove, bulkUpdate } = useSupabaseCrud('tests');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Library state
  const [libSearch, setLibSearch] = useState('');
  const [libCategory, setLibCategory] = useState<string | null>(null);
  const [libFramework, setLibFramework] = useState<string | null>(null);
  const [libMethod, setLibMethod] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const categories = useMemo(() => getTestCategories(), []);
  const frameworks = useMemo(() => getTestFrameworks(), []);

  const filteredLibrary = useMemo(() => {
    let items = testLibraryCatalog;
    if (libSearch) {
      const q = libSearch.toLowerCase();
      items = items.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.controlRefs.some(r => r.toLowerCase().includes(q)));
    }
    if (libCategory) items = items.filter(t => t.category === libCategory);
    if (libFramework) items = items.filter(t => t.frameworks.includes(libFramework));
    if (libMethod) items = items.filter(t => t.method === libMethod);
    return items;
  }, [libSearch, libCategory, libFramework, libMethod]);

  const filtered = useMemo(() => {
    if (!search) return tests;
    const q = search.toLowerCase();
    return tests.filter(t => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q));
  }, [tests, search]);

  const { sorted, sort, toggle: toggleSort } = useTableSort(filtered, 'name', 'asc');
  const pagination = usePagination(sorted);
  const filteredIds = useMemo(() => filtered.map(t => t.id), [filtered]);
  const bulk = useBulkSelection(filteredIds);

  const stats = useMemo(() => ({
    passing: tests.filter(t => t.status === TEST_STATUS.PASSING).length,
    failing: tests.filter(t => t.status === TEST_STATUS.FAILING).length,
    pending: tests.filter(t => t.status === TEST_STATUS.PENDING).length,
    total: tests.length,
  }), [tests]);
  const passRate = stats.total > 0 ? Math.round((stats.passing / stats.total) * 100) : 0;

  const libStats = useMemo(() => ({
    total: testLibraryCatalog.length,
    automated: testLibraryCatalog.filter(t => t.method === 'automated').length,
    manual: testLibraryCatalog.filter(t => t.method === 'manual').length,
    hybrid: testLibraryCatalog.filter(t => t.method === 'hybrid').length,
    categories: getTestCategories().length,
    frameworks: getTestFrameworks().length,
  }), []);

  async function instantiateTemplate(tmpl: TestTemplate) {
    await insert({ name: tmpl.name, description: tmpl.description, status: 'pending', schedule: tmpl.frequency.toLowerCase() });
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">Loading tests…</p>
    </div>
  );

  return (
    <RouteGuard allowedRoles={['admin', 'analyst']}>
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Tests</h1>
            <p className="text-sm text-muted-foreground">{tests.length} active tests · {testLibraryCatalog.length} templates available</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportToCsv('tests', filtered as Record<string, unknown>[], [
              { key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }, { key: 'result', label: 'Result' },
              { key: 'schedule', label: 'Schedule' }, { key: 'last_run', label: 'Last Run' }, { key: 'description', label: 'Description' },
            ])} className="flex items-center gap-1.5 px-3.5 py-2 border border-border/60 rounded-xl text-sm font-medium hover:bg-accent hover:border-primary/30 transition-all text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <WriteGuard>
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-glow transition-all">
              <Plus className="h-4 w-4" /> New Test
            </button>
          </WriteGuard>
        </div>
      </div>

      {/* Tabs: Active Tests / Test Library */}
      <Tabs defaultValue="active" className="space-y-5">
        <TabsList className="bg-surface/50 border border-border/60">
          <TabsTrigger value="active" className="gap-1.5 data-[state=active]:shadow-glow"><FlaskConical className="h-3.5 w-3.5" />Active Tests</TabsTrigger>
          <TabsTrigger value="library" className="gap-1.5 data-[state=active]:shadow-glow"><Library className="h-3.5 w-3.5" />Test Library ({testLibraryCatalog.length})</TabsTrigger>
          <TabsTrigger value="coverage" className="gap-1.5 data-[state=active]:shadow-glow"><Target className="h-3.5 w-3.5" />Coverage</TabsTrigger>
        </TabsList>

        {/* ═══ Active Tests Tab ═══ */}
        <TabsContent value="active" className="space-y-5 mt-0">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
            <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all"><div className="text-2xl font-display font-bold text-foreground">{passRate}%</div><div className="text-[11px] text-muted-foreground font-medium mt-1">Pass Rate</div></div>
            <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all"><div className="text-2xl font-display font-bold text-status-passing">{stats.passing}</div><div className="text-[11px] text-muted-foreground font-medium mt-1">Passing</div></div>
            <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all"><div className="text-2xl font-display font-bold text-status-failing">{stats.failing}</div><div className="text-[11px] text-muted-foreground font-medium mt-1">Failing</div></div>
            <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all"><div className="text-2xl font-display font-bold text-status-in-progress">{stats.pending}</div><div className="text-[11px] text-muted-foreground font-medium mt-1">Pending</div></div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />
          </div>

          <BulkActionBar count={bulk.count} onClear={bulk.clear} onBulkDelete={() => bulkRemove([...bulk.selected])}
            statusOptions={testStatusOptions} onBulkStatusUpdate={(status) => bulkUpdate([...bulk.selected], { status })} entityName="test" />

          {/* Table */}
          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/60 text-left bg-surface/50">
                <th className="px-3 py-3.5 w-10"><input type="checkbox" checked={bulk.allSelected} ref={el => { if (el) el.indeterminate = bulk.someSelected; }} onChange={bulk.toggleAll} className="rounded-md border-border" /></th>
                <SortableHeader label="Test Name" column="name" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
                <SortableHeader label="Schedule" column="schedule" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden md:table-cell" />
                <SortableHeader label="Last Run" column="last_run" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Status" column="status" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
                <SortableHeader label="Result" column="result" currentColumn={sort.column} direction={sort.direction} onSort={toggleSort} />
                <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground w-20">Actions</th>
              </tr></thead>
              <tbody>{pagination.paged.map(t => (
                <tr key={t.id} className={`border-b border-border/40 hover:bg-primary/[0.03] transition-colors cursor-pointer ${bulk.isSelected(t.id) ? 'bg-primary/5' : ''}`}
                  onClick={() => navigate({ to: '/tests/$testId', params: { testId: t.id } })}>
                  <td className="px-3 py-3.5" onClick={e => e.stopPropagation()}><input type="checkbox" checked={bulk.isSelected(t.id)} onChange={() => bulk.toggle(t.id)} className="rounded-md border-border" /></td>
                  <td className="px-4 py-3.5"><div className="font-medium text-foreground">{t.name}</div><div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div></td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs hidden md:table-cell capitalize">{t.schedule ?? '—'}</td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">{t.last_run ? new Date(t.last_run).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3.5"><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusStyles[t.status] ?? 'bg-muted text-muted-foreground'}`}>{t.status}</span></td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{t.result ?? '—'}</td>
                  <td className="px-4 py-3.5"><div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <WriteGuard>
                      <button onClick={() => { setEditing({ name: t.name, description: t.description, status: t.status, result: t.result, schedule: t.schedule, _id: t.id }); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget({ id: t.id, title: t.name })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </WriteGuard>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                  <Filter className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p>No tests found.</p>
              </div>
            )}
            <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
          </div>
        </TabsContent>

        {/* ═══ Test Library Tab ═══ */}
        <TabsContent value="library" className="space-y-5 mt-0">
          {/* Library Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
            <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all">
              <div className="text-2xl font-display font-bold text-foreground">{libStats.total}</div>
              <div className="text-[11px] text-muted-foreground font-medium mt-1">Test Templates</div>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all">
              <div className="text-2xl font-display font-bold text-primary">{libStats.automated}</div>
              <div className="text-[11px] text-muted-foreground font-medium mt-1">Automated</div>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all">
              <div className="text-2xl font-display font-bold text-foreground">{libStats.categories}</div>
              <div className="text-[11px] text-muted-foreground font-medium mt-1">Categories</div>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-4 hover:shadow-glow transition-all">
              <div className="text-2xl font-display font-bold text-foreground">{libStats.frameworks}</div>
              <div className="text-[11px] text-muted-foreground font-medium mt-1">Frameworks</div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search test templates, controls..." value={libSearch} onChange={e => setLibSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />
            </div>

            {/* Framework chips */}
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setLibFramework(null)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${!libFramework ? 'bg-primary text-white shadow-glow' : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30'}`}>All Frameworks</button>
              {frameworks.map(fw => (
                <button key={fw} onClick={() => setLibFramework(libFramework === fw ? null : fw)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${libFramework === fw ? 'bg-primary text-white shadow-glow' : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30'}`}>
                  {frameworkShortLabels[fw] ?? fw}
                </button>
              ))}
            </div>

            {/* Category & Method filters */}
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setLibCategory(null)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${!libCategory ? 'bg-accent text-foreground' : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground'}`}>All Categories</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setLibCategory(libCategory === cat ? null : cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${libCategory === cat ? 'bg-accent text-foreground' : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground'}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-1.5">
              {(['automated', 'manual', 'hybrid'] as const).map(m => {
                const info = methodBadge[m];
                return (
                  <button key={m} onClick={() => setLibMethod(libMethod === m ? null : m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${libMethod === m ? info.cls + ' ring-1 ring-primary/30' : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground'}`}>
                    <info.icon className="h-3 w-3" />{info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">{filteredLibrary.length} of {testLibraryCatalog.length} templates</p>

          {/* Template Cards */}
          <div className="space-y-3">
            {filteredLibrary.map(tmpl => {
              const info = methodBadge[tmpl.method];
              const isExpanded = expandedTemplate === tmpl.id;
              return (
                <div key={tmpl.id} className="bg-card border border-border/60 rounded-xl overflow-hidden hover:shadow-glow transition-all">
                  {/* Card Header */}
                  <button className="w-full px-4 py-3.5 flex items-center gap-3 text-left" onClick={() => setExpandedTemplate(isExpanded ? null : tmpl.id)}>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{tmpl.name}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${info.cls}`}>
                          <info.icon className="h-3 w-3" />{info.label}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase ${complexityColors[tmpl.complexity]}`}>{tmpl.complexity}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{tmpl.description}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">Controls</div>
                        <div className="text-xs font-semibold text-foreground">{tmpl.controlRefs.length}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">Frameworks</div>
                        <div className="text-xs font-semibold text-foreground">{tmpl.frameworks.length}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />{tmpl.estimatedDuration}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border/40 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                        {/* Left: metadata */}
                        <div className="space-y-3">
                          <div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Category</div>
                            <Badge variant="outline" className="text-xs">{tmpl.category}</Badge>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Frequency</div>
                            <span className="text-xs text-foreground">{tmpl.frequency}</span>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Duration</div>
                            <span className="text-xs text-foreground">{tmpl.estimatedDuration}</span>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Control Refs</div>
                            <div className="flex flex-wrap gap-1">{tmpl.controlRefs.map(r => {
                              const ec = enrichedControls.find(c => c.ref === r);
                              return ec ? (
                                <Link key={r} to="/controls/$controlId" params={{ controlId: ec.id }} onClick={e => e.stopPropagation()}>
                                  <Badge variant="secondary" className="text-[10px] font-mono hover:bg-primary/20 cursor-pointer transition-colors">{r}</Badge>
                                </Link>
                              ) : (
                                <Badge key={r} variant="secondary" className="text-[10px] font-mono">{r}</Badge>
                              );
                            })}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Frameworks</div>
                            <div className="flex flex-wrap gap-1">{tmpl.frameworks.map(f => <Badge key={f} variant="outline" className="text-[10px]">{frameworkShortLabels[f] ?? f}</Badge>)}</div>
                          </div>
                        </div>

                        {/* Center: steps */}
                        <div className="space-y-3">
                          <div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Test Steps</div>
                            <ol className="space-y-1.5">
                              {tmpl.steps.map((s, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                                  <span className="shrink-0 h-4 w-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                                  {s}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        {/* Right: evidence, tools, prereqs */}
                        <div className="space-y-3">
                          <div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Expected Evidence</div>
                            <ul className="space-y-1">{tmpl.expectedEvidence.map((e, i) => <li key={i} className="text-xs text-foreground font-mono">{e}</li>)}</ul>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Suggested Tools</div>
                            <div className="flex flex-wrap gap-1">{tmpl.suggestedTools.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Prerequisites</div>
                            <ul className="space-y-1">{tmpl.prerequisites.map((p, i) => <li key={i} className="text-xs text-muted-foreground">• {p}</li>)}</ul>
                          </div>
                          <WriteGuard>
                            <button onClick={() => instantiateTemplate(tmpl)} className="flex items-center gap-1.5 px-3.5 py-2 gradient-primary text-white rounded-xl text-xs font-medium hover:opacity-90 shadow-glow transition-all mt-2">
                              <Play className="h-3.5 w-3.5" /> Deploy as Active Test
                            </button>
                          </WriteGuard>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredLibrary.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                  <Filter className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p>No templates match your filters.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══ Coverage Dashboard Tab ═══ */}
        <TabsContent value="coverage" className="mt-0">
          <TestCoverageDashboard />
        </TabsContent>
      </Tabs>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit Test' : 'New Test'} fields={testFields} initialValues={editing ?? undefined}
        onSubmit={async (vals) => { const { _id, ...data } = vals as any; if (_id) return update(String(_id), data); return insert(data); }} />
      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title={deleteTarget?.title ?? 'test'}
        onConfirm={async () => deleteTarget ? remove(deleteTarget.id) : false} />
    </div>
    </RouteGuard>
  );
}
