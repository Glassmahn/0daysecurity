import { useState } from 'react';
import { Shield, Search, Plus, ChevronRight, Globe, Lock, Brain, Building, MapPin, Sparkles } from 'lucide-react';
import { frameworkCatalog, categoryLabels, type CatalogFramework } from '@/lib/framework-catalog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AddFrameworkWizard } from './AddFrameworkWizard';

const categoryIcons: Record<CatalogFramework['category'], React.ElementType> = {
  commercial: Building,
  federal: Lock,
  privacy: Globe,
  industry: Shield,
  ai_governance: Brain,
  regional: MapPin,
  custom: Sparkles,
};

const statusBadge: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-status-in-progress/15 text-status-in-progress',
  audit_ready: 'bg-chart-1/15 text-chart-1',
  certified: 'bg-status-passing/15 text-status-passing',
};

export function FrameworkMarketplace() {
  const [search, setSearch] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<CatalogFramework | null>(null);
  const [localCatalog, setLocalCatalog] = useState(frameworkCatalog);

  const categories: CatalogFramework['category'][] = ['commercial', 'federal', 'privacy', 'industry', 'ai_governance', 'regional'];

  const filtered = localCatalog.filter(fw =>
    fw.name.toLowerCase().includes(search.toLowerCase()) ||
    fw.standard.toLowerCase().includes(search.toLowerCase()) ||
    fw.description.toLowerCase().includes(search.toLowerCase())
  );

  const enabledFrameworks = localCatalog.filter(fw => fw.enabled);
  const availableFrameworks = filtered.filter(fw => !fw.enabled);

  function handleEnableFramework(fw: CatalogFramework) {
    setSelectedFramework(fw);
    setWizardOpen(true);
  }

  function handleWizardComplete(frameworkId: string) {
    setLocalCatalog(prev => prev.map(fw =>
      fw.id === frameworkId ? { ...fw, enabled: true, status: 'in_progress' as const, compliancePct: 0, targetDate: '2027-01-01' } : fw
    ));
    setWizardOpen(false);
    setSelectedFramework(null);
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Frameworks</h1>
          <p className="text-sm text-muted-foreground">
            {enabledFrameworks.length} active · {localCatalog.length} available
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedFramework(null);
            setWizardOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Framework
        </button>
      </div>

      {/* Active Frameworks */}
      {enabledFrameworks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Active Frameworks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enabledFrameworks.map(fw => (
              <div key={fw.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/40 transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{fw.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusBadge[fw.status]}`}>
                          {fw.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-muted-foreground">{fw.controlCount} controls</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-3xl font-bold text-foreground">{fw.compliancePct}%</span>
                    {fw.targetDate && <span className="text-xs text-muted-foreground">Target: {fw.targetDate}</span>}
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${fw.compliancePct}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-status-passing/10 rounded px-2 py-1.5">
                    <div className="text-sm font-bold text-status-passing">{fw.controlCounts.passing}</div>
                    <div className="text-[10px] text-muted-foreground">Passing</div>
                  </div>
                  <div className="bg-status-failing/10 rounded px-2 py-1.5">
                    <div className="text-sm font-bold text-status-failing">{fw.controlCounts.failing}</div>
                    <div className="text-[10px] text-muted-foreground">Failing</div>
                  </div>
                  <div className="bg-status-in-progress/10 rounded px-2 py-1.5">
                    <div className="text-sm font-bold text-status-in-progress">{fw.controlCounts.inProgress}</div>
                    <div className="text-[10px] text-muted-foreground">In Prog</div>
                  </div>
                  <div className="bg-muted rounded px-2 py-1.5">
                    <div className="text-sm font-bold text-muted-foreground">{fw.controlCounts.na}</div>
                    <div className="text-[10px] text-muted-foreground">N/A</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Framework Marketplace */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Framework Marketplace</h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search frameworks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Category Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="bg-card border border-border mb-4 flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="all" className="text-xs">All ({availableFrameworks.length})</TabsTrigger>
            {categories.map(cat => {
              const count = availableFrameworks.filter(fw => fw.category === cat).length;
              if (count === 0) return null;
              const Icon = categoryIcons[cat];
              return (
                <TabsTrigger key={cat} value={cat} className="text-xs flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {categoryLabels[cat]} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all">
            <FrameworkGrid frameworks={availableFrameworks} onEnable={handleEnableFramework} />
          </TabsContent>
          {categories.map(cat => (
            <TabsContent key={cat} value={cat}>
              <FrameworkGrid frameworks={availableFrameworks.filter(fw => fw.category === cat)} onEnable={handleEnableFramework} />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {wizardOpen && (
        <AddFrameworkWizard
          framework={selectedFramework}
          allFrameworks={localCatalog}
          onComplete={handleWizardComplete}
          onClose={() => { setWizardOpen(false); setSelectedFramework(null); }}
        />
      )}
    </div>
  );
}

function FrameworkGrid({ frameworks, onEnable }: { frameworks: CatalogFramework[]; onEnable: (fw: CatalogFramework) => void }) {
  if (frameworks.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No frameworks match your search.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {frameworks.map(fw => {
        const Icon = categoryIcons[fw.category];
        return (
          <div key={fw.id} className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-all group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{fw.name}</h3>
                  <span className="text-[10px] text-muted-foreground">{fw.controlCount} controls</span>
                </div>
              </div>
              {fw.popularity === 'high' && (
                <span className="text-[10px] font-medium text-chart-1 bg-chart-1/10 px-1.5 py-0.5 rounded">Popular</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{fw.description}</p>
            <button
              onClick={() => onEnable(fw)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Enable Framework
            </button>
          </div>
        );
      })}
    </div>
  );
}
