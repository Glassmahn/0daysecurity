import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Shield, Calendar, Search } from 'lucide-react';
import { type CatalogFramework, enrichedControls, controlCategories } from '@/lib/framework-catalog';

interface Props {
  framework: CatalogFramework | null;
  allFrameworks: CatalogFramework[];
  onComplete: (frameworkId: string) => void;
  onClose: () => void;
}

export function AddFrameworkWizard({ framework, allFrameworks, onComplete, onClose }: Props) {
  const [step, setStep] = useState(framework ? 2 : 1);
  const [selectedId, setSelectedId] = useState(framework?.id || '');
  const [search, setSearch] = useState('');
  const [selectedControls, setSelectedControls] = useState<Set<string>>(() => {
    if (framework) {
      const ids = new Set<string>();
      enrichedControls
        .filter(c => c.frameworks.includes(framework.standard))
        .forEach(c => ids.add(c.id));
      return ids;
    }
    return new Set();
  });
  const [ownerAssignments, setOwnerAssignments] = useState<Record<string, string>>({});
  const [targetDate, setTargetDate] = useState('');

  const availableFrameworks = allFrameworks.filter(fw => !fw.enabled);
  const selected = allFrameworks.find(fw => fw.id === selectedId);

  const matchingControls = selected
    ? enrichedControls.filter(c => c.frameworks.includes(selected.standard))
    : [];

  const filteredControls = matchingControls.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.ref.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  const owners = ['Sarah Chen', 'James Wilson', 'Maria Garcia', 'Alex Kim', 'David Park', 'Sandra White', 'Amanda Martinez', 'Brian Young'];

  const categoryCounts = controlCategories
    .map(cat => ({
      ...cat,
      count: matchingControls.filter(c => c.categoryId === cat.id).length,
      selectedCount: matchingControls.filter(c => c.categoryId === cat.id && selectedControls.has(c.id)).length,
    }))
    .filter(cat => cat.count > 0);

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedControls(new Set(matchingControls.map(c => c.id)));
    } else {
      setSelectedControls(new Set());
    }
  }

  function toggleControl(id: string) {
    setSelectedControls(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const canNext = () => {
    if (step === 1) return !!selectedId;
    if (step === 2) return selectedControls.size > 0;
    if (step === 3) return true;
    if (step === 4) return true; // date is optional
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Add Framework</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {['Select Standard', 'Review Controls', 'Assign Owners', 'Set Timeline'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i + 1 < step ? 'bg-status-passing text-white' :
                  i + 1 === step ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i + 1 < step ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${i + 1 === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
                {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Select a compliance standard to enable. Controls will be auto-populated from the template library.</p>
              {availableFrameworks.map(fw => (
                <button
                  key={fw.id}
                  onClick={() => {
                    setSelectedId(fw.id);
                    const ids = new Set<string>();
                    enrichedControls.filter(c => c.frameworks.includes(fw.standard)).forEach(c => ids.add(c.id));
                    setSelectedControls(ids);
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedId === fw.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{fw.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{fw.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{fw.controlCount} controls</span>
                      {selectedId === fw.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedControls.size} of {matchingControls.length} controls selected for <span className="font-medium text-foreground">{selected?.name}</span>
                </p>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedControls.size === matchingControls.length}
                    onChange={e => toggleAll(e.target.checked)}
                    className="rounded border-border"
                  />
                  Select all
                </label>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter controls..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Category summary */}
              <div className="flex flex-wrap gap-2">
                {categoryCounts.map(cat => (
                  <span key={cat.id} className="text-[10px] px-2 py-1 bg-muted rounded-full text-muted-foreground">
                    {cat.name}: {cat.selectedCount}/{cat.count}
                  </span>
                ))}
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredControls.map(c => (
                  <label
                    key={c.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedControls.has(c.id) ? 'bg-primary/5' : 'hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedControls.has(c.id)}
                      onChange={() => toggleControl(c.id)}
                      className="mt-0.5 rounded border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-primary">{c.ref}</span>
                        <span className="text-sm font-medium text-foreground">{c.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>
                      {c.crossMappings.length > 1 && (
                        <div className="flex gap-1 mt-1">
                          {c.crossMappings.map(m => (
                            <span key={m.framework + m.ref} className="text-[9px] px-1 py-0.5 bg-muted rounded text-muted-foreground">
                              {m.framework}: {m.ref}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {c.automatable && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-chart-1/10 text-chart-1 rounded shrink-0">Auto</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Assign default owners to control categories. You can change individual assignments later.</p>
              {categoryCounts.filter(c => c.selectedCount > 0).map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{cat.name}</h4>
                    <span className="text-xs text-muted-foreground">{cat.selectedCount} controls</span>
                  </div>
                  <select
                    value={ownerAssignments[cat.id] || ''}
                    onChange={e => setOwnerAssignments(prev => ({ ...prev, [cat.id]: e.target.value }))}
                    className="bg-card border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Assign owner...</option>
                    {owners.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">Set your target certification date and review the summary.</p>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  <Calendar className="h-4 w-4 inline mr-1.5" />
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  className="bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                />
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Framework</span>
                    <p className="font-medium text-foreground">{selected?.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Controls</span>
                    <p className="font-medium text-foreground">{selectedControls.size} selected</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categories</span>
                    <p className="font-medium text-foreground">{categoryCounts.filter(c => c.selectedCount > 0).length}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Automatable</span>
                    <p className="font-medium text-foreground">
                      {matchingControls.filter(c => selectedControls.has(c.id) && c.automatable).length} controls
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              if (step < 4) setStep(s => s + 1);
              else if (selectedId) onComplete(selectedId);
            }}
            disabled={!canNext()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step < 4 ? (
              <>Next <ChevronRight className="h-4 w-4" /></>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Enable Framework
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
