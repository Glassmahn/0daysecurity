import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Loader2, Send, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VendorAssessmentWizard } from './VendorAssessmentWizard';
import { Badge } from '@/components/ui/badge';

interface VendorAssessmentCardProps {
  vendorId: string;
}

export function VendorAssessmentCard({ vendorId }: VendorAssessmentCardProps) {
  const [assessment, setAssessment] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('vendor_assessments')
        .select('id, score, status, due_at, created_at')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) setAssessment(data);
      setLoading(false);
    })();
  }, [vendorId]);

  return (
    <>
      <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Security Assessment</h3>
          <button onClick={() => setWizardOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 gradient-primary text-white rounded-lg text-xs font-medium hover:opacity-90 shadow-glow transition-all">
            <Send className="h-3.5 w-3.5" /> Send Assessment
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : !assessment ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-6 w-6 text-muted-foreground/50" />
            <p>No assessment completed yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Score</span>
              <span className={`text-lg font-bold ${(assessment.score ?? 0) >= 80 ? 'text-status-passing' : (assessment.score ?? 0) >= 50 ? 'text-status-in-progress' : 'text-status-failing'}`}>
                {assessment.score ?? '—'}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge variant={assessment.status === 'completed' ? 'default' : assessment.status === 'pending' ? 'secondary' : 'outline'} className="text-xs">
                {assessment.status === 'completed' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : assessment.status === 'pending' ? <Clock className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {assessment.status ?? 'draft'}
              </Badge>
            </div>
            {assessment.due_at && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Due</span>
                <span className="text-xs font-medium">{new Date(assessment.due_at).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Submitted</span>
              <span className="text-xs font-medium">{assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        )}
      </div>

      <VendorAssessmentWizard vendorId={vendorId} open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
