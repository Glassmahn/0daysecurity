import { Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: 'g then d', label: 'Go to Dashboard' },
  { keys: 'g then r', label: 'Go to Risk Register' },
  { keys: 'g then c', label: 'Go to Controls' },
  { keys: 'g then i', label: 'Go to Incidents' },
  { keys: 'g then a', label: 'Go to Assets' },
  { keys: 'g then p', label: 'Go to Policies' },
  { keys: 'g then v', label: 'Go to Vendors' },
  { keys: 'g then e', label: 'Go to Evidence' },
  { keys: 'g then t', label: 'Go to Training' },
  { keys: 'g then k', label: 'Go to Knowledge Base' },
  { keys: '?', label: 'Toggle this help' },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Command className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h2>
            <p className="text-xs text-muted-foreground">Navigate faster with key sequences</p>
          </div>
        </div>

        <div className="space-y-1">
          {SHORTCUTS.map(s => (
            <div key={s.keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">{s.label}</span>
              <kbd className="px-2 py-0.5 bg-muted border border-border rounded text-xs font-mono text-muted-foreground">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Type the sequence <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">g</kbd> then <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">d</kbd> within one second to navigate. Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">?</kbd> to toggle.
          </p>
        </div>
      </div>
    </div>
  );
}
