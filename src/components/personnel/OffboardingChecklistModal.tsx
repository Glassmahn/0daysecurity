import { useState } from 'react';
import { X, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logAudit } from '@/lib/audit-logger';

interface OffboardingChecklistModalProps {
  personId: string;
  personName: string;
  onClose: () => void;
  onSaved: () => void;
}

const defaultSteps = [
  { key: 'revoke_access', label: 'Revoke system access', critical: true },
  { key: 'collect_equipment', label: 'Collect company equipment', critical: true },
  { key: 'remove_distro', label: 'Remove from distribution lists', critical: false },
  { key: 'update_review', label: 'Mark access review as overdue', critical: true },
  { key: 'notify_security', label: 'Notify security team', critical: false },
  { key: 'archive_data', label: 'Archive user data', critical: false },
  { key: 'remove_projects', label: 'Remove from active projects', critical: false },
  { key: 'update_record', label: 'Update personnel record', critical: true },
];

export function OffboardingChecklistModal({ personId, personName, onClose, onSaved }: OffboardingChecklistModalProps) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  function toggle(key: string) {
    setCompleted(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const allChecked = defaultSteps.every(s => completed[s.key]);
  const criticalDone = defaultSteps.filter(s => s.critical).every(s => completed[s.key]);

  async function handleFinalize() {
    if (!criticalDone) {
      toast.error('Complete all critical steps before finalizing');
      return;
    }
    setSaving(true);

    const { error } = await supabase.from('personnel').update({
      access_review_status: 'overdue',
      training_status: 'overdue',
    }).eq('id', personId);

    if (error) {
      toast.error('Failed to update personnel: ' + error.message);
      setSaving(false);
      return;
    }

    logAudit({
      action: 'offboarding_completed',
      entity_type: 'personnel',
      entity_id: personId,
      details: { personName, completed, timestamp: new Date().toISOString() },
    });

    toast.success(`${personName} offboarding recorded`);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Offboarding Checklist</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{personName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
        </div>

        {!criticalDone && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-status-warning/10 border border-status-warning/20">
            <AlertTriangle className="h-4 w-4 text-status-warning mt-0.5 shrink-0" />
            <p className="text-xs text-status-warning">Complete all critical steps before finalizing offboarding.</p>
          </div>
        )}

        <div className="space-y-1.5 mb-6">
          {defaultSteps.map(step => (
            <button key={step.key} onClick={() => toggle(step.key)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                completed[step.key]
                  ? 'border-status-passing/20 bg-status-passing/5'
                  : 'border-border/60 hover:border-primary/30'
              }`}>
              <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                completed[step.key] ? 'border-status-passing bg-status-passing' : 'border-border'
              }`}>
                {completed[step.key] && <CheckCircle className="h-4 w-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{step.label}</p>
              </div>
              {step.critical && <span className="text-[10px] font-semibold uppercase text-status-failing shrink-0">Required</span>}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>{Object.values(completed).filter(Boolean).length}/{defaultSteps.length} complete</span>
          {allChecked && <span className="text-status-passing font-medium">All steps complete</span>}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={handleFinalize} disabled={saving || !criticalDone}
            className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Finalize Offboarding'}
          </button>
        </div>
      </div>
    </div>
  );
}
