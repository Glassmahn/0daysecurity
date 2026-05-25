import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const Route = createFileRoute('/vendor-portal/$token')({
  component: VendorPortalTokenPage,
});

function VendorPortalTokenPage() {
  const { token } = Route.useParams();
  const [portal, setPortal] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);

  useEffect(() => {
    (supabase as any).from('vendor_portal_tokens').select('*, vendor:vendor_id(*)').eq('token', token).maybeSingle().then(({ data, error: err }: any) => {
      if (err || !data) { setError('Invalid or expired portal link'); setLoading(false); return; }
      if (new Date(data.expires_at) < new Date()) { setError('This portal link has expired'); setLoading(false); return; }
      setPortal(data);
      setVendor(data.vendor);
      supabase.from('vendor_portal_submissions').select('id, document_type, portal_token_id').eq('portal_token_id', data.id).then(({ data: subs }) => {
        setSubmitted((subs ?? []).map((s: any) => s.document_type));
      });
      (supabase as any).from('vendor_portal_tokens').update({ last_accessed_at: new Date().toISOString() }).eq('id', data.id);
      setLoading(false);
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { return; }
    setSubmitting(true);
    let fileUrl = '';
    if (file) {
      const folder = `vendor-portal/${token}/`;
      const filePath = `${folder}${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage.from('evidence-files').upload(filePath, file);
      if (!uploadErr && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('evidence-files').getPublicUrl(uploadData.path);
        fileUrl = publicUrl;
      } else if (uploadErr) {
        toast.error('File upload failed: ' + uploadErr.message);
      }
    }
    const { error: insertErr } = await (supabase as any).from('vendor_portal_submissions').insert({
      portal_token_id: portal.id,
      document_type: file.name.split('.').pop() ?? 'unknown',
      file_url: fileUrl || file.name,
      notes,
    });
    if (insertErr) { toast.error('Failed to submit: ' + insertErr.message); } else {
      setSubmitted([...submitted, file.name]);
      setFile(null);
      setNotes('');
    }
    setSubmitting(false);
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">Loading portal...</div>;
  if (error) return <div className="text-center py-20"><h2 className="text-lg font-semibold text-foreground">{error}</h2><p className="text-sm text-muted-foreground mt-2">Please contact the sender for a new invitation.</p></div>;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold text-foreground">{vendor?.name ?? 'Vendor'} Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload requested documents and evidence</p>
      </div>

      {submitted.length > 0 && (
        <div className="bg-status-passing/10 border border-status-passing/30 rounded-lg p-4">
          <p className="text-sm font-semibold text-status-passing">Submitted Documents</p>
          <ul className="mt-2 space-y-1">
            {submitted.map((s) => <li key={s} className="text-xs text-muted-foreground">&#10003; {s}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Upload Document</label>
          <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:text-xs file:font-medium" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" placeholder="Add any notes about this document..." />
        </div>
        <button type="submit" disabled={!file || submitting} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Document'}
        </button>
      </form>
    </div>
  );
}
