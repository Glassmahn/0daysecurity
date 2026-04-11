import { createFileRoute } from '@tanstack/react-router';
import { controls } from '@/lib/mock-data';

export const Route = createFileRoute('/controls/')({
  component: ControlsPage,
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
  not_implemented: 'bg-muted text-muted-foreground',
  not_applicable: 'bg-muted text-muted-foreground',
};

function ControlsPage() {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Controls</h1>
        <p className="text-sm text-muted-foreground">{controls.length} controls across all frameworks</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Ref</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Framework</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Owner</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Impl %</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {controls.map(c => (
              <tr key={c.id} className="border-b border-border hover:bg-surface transition-colors cursor-pointer">
                <td className="px-4 py-3 font-mono text-xs text-primary">{c.ref}</td>
                <td className="px-4 py-3 text-foreground">{c.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.framework}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusStyles[c.status]}`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.owner}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${c.implementationPct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{c.implementationPct}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.evidenceCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
