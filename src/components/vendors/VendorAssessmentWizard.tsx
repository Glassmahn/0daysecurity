import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const QUESTIONS = [
  { id: 'soc2', label: 'Do you have SOC 2 Type II report?' },
  { id: 'encryption', label: 'Do you encrypt data at rest?' },
  { id: 'incident_response', label: 'Do you have an incident response plan?' },
  { id: 'background_checks', label: 'Do you conduct background checks?' },
  { id: 'mfa', label: 'Do you have MFA enforced?' },
];

interface VendorAssessmentWizardProps {
  vendorId: string;
  open: boolean;
  onClose: () => void;
}

export function VendorAssessmentWizard({ vendorId, open, onClose }: VendorAssessmentWizardProps) {
  const [step, setStep] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const yesCount = Object.values(answers).filter(Boolean).length;
  const score = QUESTIONS.length > 0 ? Math.round((yesCount / QUESTIONS.length) * 100) : 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error } = await (supabase as any).from('vendor_assessments').insert({
      vendor_id: vendorId,
      status: 'completed',
      score,
      responses: { answers, due_date: dueDate || null },
      due_at: dueDate || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Failed to submit assessment: ' + error.message);
      return;
    }
    toast.success('Assessment submitted successfully');
    onClose();
    setStep(0);
    setDueDate('');
    setAnswers({});
  };

  const handleClose = () => {
    onClose();
    setStep(0);
    setDueDate('');
    setAnswers({});
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 0 && 'New Vendor Assessment'}
            {step === 1 && 'Security Questions'}
            {step === 2 && 'Review & Submit'}
          </DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-1">
          {['Info', 'Questions', 'Review'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-status-passing text-white' : 'bg-muted text-muted-foreground'
              }`}>{i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}</div>
              <span className={`text-xs font-medium hidden sm:inline ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (step < 2) setStep(s => s + 1); else handleSubmit(); }}>
          {/* Step 1: Info */}
          {step === 0 && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date (optional)</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">Set a deadline for the vendor to complete this assessment.</p>
            </div>
          )}

          {/* Step 2: Questions */}
          {step === 1 && (
            <div className="space-y-3 py-2">
              {QUESTIONS.map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60">
                  <span className="text-sm font-medium text-foreground">{q.label}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setAnswers(p => ({ ...p, [q.id]: true }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        answers[q.id] === true ? 'bg-status-passing/15 text-status-passing ring-1 ring-status-passing/30' : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}>
                      <CheckCircle2 className="h-3 w-3" /> Yes
                    </button>
                    <button type="button" onClick={() => setAnswers(p => ({ ...p, [q.id]: false }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        answers[q.id] === false ? 'bg-status-failing/15 text-status-failing ring-1 ring-status-failing/30' : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}>
                      <XCircle className="h-3 w-3" /> No
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 2 && (
            <div className="space-y-4 py-2">
              {dueDate && (
                <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-card border border-border/60">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium">{dueDate}</span>
                </div>
              )}
              {QUESTIONS.map(q => (
                <div key={q.id} className="flex items-center justify-between text-sm p-3 rounded-xl bg-card border border-border/60">
                  <span className="text-foreground">{q.label}</span>
                  <span className={`flex items-center gap-1 font-medium ${answers[q.id] ? 'text-status-passing' : 'text-status-failing'}`}>
                    {answers[q.id] ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {answers[q.id] ? 'Yes' : 'No'}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                <span className="text-sm font-semibold text-foreground">Security Score</span>
                <span className="text-lg font-bold text-primary">{score}%</span>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} disabled={submitting}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            {step < 2 ? (
              <Button type="submit">
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                <Send className="h-4 w-4 mr-1" /> Submit Assessment
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
