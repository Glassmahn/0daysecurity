import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { X, Loader2, CheckCircle, Shield, ArrowRightLeft, Ban } from 'lucide-react';

interface RiskTreatmentDialogProps {
  riskId: string;
  riskTitle: string;
  onClose: () => void;
  onSaved: () => void;
}

const treatments = [
  { value: 'accept', label: 'Accept', description: 'Acknowledge the risk without additional action', icon: CheckCircle },
  { value: 'mitigate', label: 'Mitigate', description: 'Implement controls to reduce the risk to an acceptable level', icon: Shield },
  { value: 'transfer', label: 'Transfer', description: 'Shift the risk to a third party (insurance, vendor)', icon: ArrowRightLeft },
  { value: 'avoid', label: 'Avoid', description: 'Eliminate the activity that creates the risk', icon: Ban },
];

export function RiskTreatmentDialog({ riskId, riskTitle, onClose, onSaved }: RiskTreatmentDialogProps) {
  const [treatment, setTreatment] = useState<string>('');
  const [residualLikelihood, setResidualLikelihood] = useState<number>(1);
  const [residualImpact, setResidualImpact] = useState<number>(1);
  const [justification, setJustification] = useState('');
  const [nextReview, setNextReview] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!treatment) { toast.error('Select a treatment option'); return; }
    setSaving(true);

    const updates = {
      mitigation_plan: justification || null,
      residual_likelihood: residualLikelihood,
      residual_impact: residualImpact,
      status: treatment === 'accept' ? 'accepted' : treatment === 'mitigate' ? 'mitigated' : treatment === 'transfer' ? 'transferred' : 'closed',
    } as TablesUpdate<'risks'>;

    const { error } = await supabase.from('risks').update(updates).eq('id', riskId);
    if (error) { toast.error('Failed to save: ' + error.message); setSaving(false); return; }
    toast.success('Risk treatment recorded');
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Risk Treatment</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{riskTitle}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-2 mb-4">
          {treatments.map(t => {
            const TIcon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setTreatment(t.value)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  treatment === t.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TIcon className={`h-5 w-5 ${treatment === t.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Residual Likelihood (1-5)</label>
              <input type="number" min={1} max={5} value={residualLikelihood}
                onChange={e => setResidualLikelihood(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Residual Impact (1-5)</label>
              <input type="number" min={1} max={5} value={residualImpact}
                onChange={e => setResidualImpact(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Justification / Mitigation Plan</label>
            <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={3}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"
              placeholder="Explain why this treatment was selected..." />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Next Review Date (optional)</label>
            <input type="date" value={nextReview} onChange={e => setNextReview(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !treatment}
            className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Treatment'}
          </button>
        </div>
      </div>
    </div>
  );
}
