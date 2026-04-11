import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { enrichedControls, type EnrichedControl } from '@/lib/framework-catalog';
import { testLibraryCatalog } from '@/lib/test-library-catalog';
import {
  CheckCircle, XCircle, AlertTriangle, Shield, Layers, Target,
} from 'lucide-react';

const frameworkLabels: Record<string, string> = {
  SOC2: 'SOC 2', HIPAA: 'HIPAA', ISO27001: 'ISO 27001', PCI_DSS: 'PCI DSS',
  NIST_800_53: 'NIST 800-53', NIST_CSF: 'NIST CSF', GDPR: 'GDPR', CCPA: 'CCPA', CIS: 'CIS',
};

interface ControlCoverage {
  control: EnrichedControl;
  testCount: number;
  testNames: string[];
}

interface FrameworkCoverage {
  framework: string;
  label: string;
  totalControls: number;
  coveredControls: number;
  pct: number;
}

export function TestCoverageDashboard() {
  const { controlCoverage, frameworkCoverage, summary } = useMemo(() => {
    // Build a set of all controlRefs covered by tests
    const refToTests = new Map<string, string[]>();
    for (const tmpl of testLibraryCatalog) {
      for (const ref of tmpl.controlRefs) {
        const existing = refToTests.get(ref) ?? [];
        existing.push(tmpl.name);
        refToTests.set(ref, existing);
      }
    }

    // Per-control coverage
    const controlCoverage: ControlCoverage[] = enrichedControls.map(ec => ({
      control: ec,
      testCount: refToTests.get(ec.ref)?.length ?? 0,
      testNames: refToTests.get(ec.ref) ?? [],
    }));

    // Per-framework coverage
    const allFrameworks = new Set<string>();
    enrichedControls.forEach(ec => ec.frameworks.forEach(f => allFrameworks.add(f)));

    const frameworkCoverage: FrameworkCoverage[] = [...allFrameworks]
      .filter(f => frameworkLabels[f])
      .map(fw => {
        const fwControls = enrichedControls.filter(ec => ec.frameworks.includes(fw));
        const covered = fwControls.filter(ec => (refToTests.get(ec.ref)?.length ?? 0) > 0);
        return {
          framework: fw,
          label: frameworkLabels[fw] ?? fw,
          totalControls: fwControls.length,
          coveredControls: covered.length,
          pct: fwControls.length > 0 ? Math.round((covered.length / fwControls.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.totalControls - a.totalControls);

    const covered = controlCoverage.filter(c => c.testCount > 0).length;
    const total = controlCoverage.length;
    const fullyTestedFw = frameworkCoverage.filter(f => f.pct === 100).length;

    return {
      controlCoverage,
      frameworkCoverage,
      summary: { covered, total, pct: Math.round((covered / total) * 100), fullyTestedFw, totalFw: frameworkCoverage.length },
    };
  }, []);

  const uncovered = controlCoverage.filter(c => c.testCount === 0);
  const categories = [...new Set(enrichedControls.map(ec => ec.category))];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Control Coverage</span>
          </div>
          <div className="text-2xl font-display font-bold text-foreground">{summary.pct}%</div>
          <p className="text-xs text-muted-foreground mt-1">{summary.covered}/{summary.total} controls tested</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-status-passing" />
            <span className="text-xs font-medium text-muted-foreground">Frameworks 100%</span>
          </div>
          <div className="text-2xl font-display font-bold text-status-passing">{summary.fullyTestedFw}</div>
          <p className="text-xs text-muted-foreground mt-1">of {summary.totalFw} fully covered</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Test Templates</span>
          </div>
          <div className="text-2xl font-display font-bold text-foreground">{testLibraryCatalog.length}</div>
          <p className="text-xs text-muted-foreground mt-1">across {categories.length} categories</p>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-status-failing" />
            <span className="text-xs font-medium text-muted-foreground">Gaps</span>
          </div>
          <div className="text-2xl font-display font-bold text-status-failing">{uncovered.length}</div>
          <p className="text-xs text-muted-foreground mt-1">controls without tests</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Framework Coverage */}
        <div className="bg-card border border-border/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />Framework Coverage
          </h3>
          <div className="space-y-3">
            {frameworkCoverage.map(fw => (
              <div key={fw.framework} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{fw.label}</span>
                  <span className="flex items-center gap-2">
                    {fw.pct === 100 ? (
                      <Badge variant="default" className="text-xs gap-1 bg-status-passing/15 text-status-passing border-0">
                        <CheckCircle className="h-3 w-3" />Full
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1">
                        {fw.coveredControls}/{fw.totalControls}
                      </Badge>
                    )}
                    <span className="text-xs font-mono text-muted-foreground w-9 text-right">{fw.pct}%</span>
                  </span>
                </div>
                <Progress value={fw.pct} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Category Coverage */}
        <div className="bg-card border border-border/60 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />Category Coverage
          </h3>
          <div className="space-y-3">
            {categories.map(cat => {
              const catControls = enrichedControls.filter(ec => ec.category === cat);
              const covered = catControls.filter(ec => testLibraryCatalog.some(t => t.controlRefs.includes(ec.ref)));
              const pct = Math.round((covered.length / catControls.length) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{cat}</span>
                    <span className="flex items-center gap-2">
                      {pct === 100 ? (
                        <CheckCircle className="h-3.5 w-3.5 text-status-passing" />
                      ) : (
                        <span className="text-xs text-muted-foreground">{covered.length}/{catControls.length}</span>
                      )}
                      <span className="text-xs font-mono text-muted-foreground w-9 text-right">{pct}%</span>
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Uncovered Controls */}
      {uncovered.length > 0 && (
        <div className="bg-card border border-status-failing/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-status-failing" />Controls Without Test Coverage ({uncovered.length})
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {uncovered.map(({ control }) => (
              <Link
                key={control.id}
                to="/controls/$controlId"
                params={{ controlId: control.id }}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 hover:border-status-failing/30 hover:bg-status-failing/5 transition-all group"
              >
                <Badge variant="outline" className="text-xs font-mono shrink-0">{control.ref}</Badge>
                <span className="text-sm text-foreground truncate group-hover:text-status-failing transition-colors">{control.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Full Control Matrix */}
      <div className="bg-card border border-border/60 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />Full Control–Test Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Ref</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Control</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Tests</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {controlCoverage.map(({ control, testCount, testNames }) => (
                <tr key={control.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="py-2 px-3">
                    <Link to="/controls/$controlId" params={{ controlId: control.id }} className="font-mono text-xs text-primary hover:underline">
                      {control.ref}
                    </Link>
                  </td>
                  <td className="py-2 px-3 font-medium text-foreground">{control.title}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{control.category}</td>
                  <td className="py-2 px-3">
                    <Badge variant="outline" className={`text-xs ${
                      control.status === 'implemented' ? 'text-status-passing border-status-passing/30' :
                      control.status === 'failing' ? 'text-status-failing border-status-failing/30' :
                      control.status === 'in_progress' ? 'text-status-in-progress border-status-in-progress/30' :
                      'text-muted-foreground'
                    }`}>
                      {control.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {testCount > 0 ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-status-passing/10 text-status-passing text-xs font-bold">{testCount}</span>
                    ) : (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-status-failing/10 text-status-failing text-xs font-bold">0</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {testCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-status-passing shrink-0" />
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={testNames.join(', ')}>{testNames[0]}{testCount > 1 && ` +${testCount - 1}`}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5 text-status-failing shrink-0" />
                        <span className="text-xs text-status-failing">No tests</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
