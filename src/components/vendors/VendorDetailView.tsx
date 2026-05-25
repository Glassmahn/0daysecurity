import { useState, useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, Json } from '@/integrations/supabase/types';
import {
  ArrowLeft, Loader2, AlertTriangle, Building2, Shield, FileText,
  Calendar, Mail, Clock, User, Download, Upload, X, Globe, CheckCircle2, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { VendorAssessmentCard } from './VendorAssessmentCard';
import { VendorAssessmentWizard } from './VendorAssessmentWizard';

const tierStyles: Record<string, string> = {
  critical: 'bg-severity-critical/15 text-severity-critical',
  high: 'bg-severity-high/15 text-severity-high',
  medium: 'bg-severity-medium/15 text-severity-medium',
  low: 'bg-status-passing/15 text-status-passing',
};

const statusStyles: Record<string, string> = {
  active: 'bg-status-passing/15 text-status-passing',
  under_review: 'bg-status-warning/15 text-status-warning',
  suspended: 'bg-status-failing/15 text-status-failing',
  offboarded: 'bg-muted text-muted-foreground',
};

interface VendorDetailViewProps {
  vendorId: string;
}

export function VendorDetailView({ vendorId }: VendorDetailViewProps) {
  const [vendor, setVendor] = useState<Tables<'vendors'> | null>(null);
  const [controls, setControls] = useState<Tables<'controls'>[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assessments' | 'documents' | 'controls' | 'details'>('assessments');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .maybeSingle();
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setVendor(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load vendor');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [vendorId]);

  useEffect(() => {
    if (!vendor) return;
    let cancelled = false;
    supabase.from('vendor_assessments').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false }).then(({ data }) => {
      if (!cancelled) setAssessments(data ?? []);
    });
    supabase.from('controls').select('id, code, title, status').limit(20).then(({ data }) => {
      if (!cancelled) setControls(data ?? []);
    });
    return () => { cancelled = true; };
  }, [vendor, vendorId]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !vendor) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return; }
    setUploading(true);
    try {
      const path = `vendors/${vendorId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('evidence-files').upload(path, file);
      if (uploadErr) { toast.error('Upload failed'); setUploading(false); return; }
      const existing = (vendor.documents as Array<{ name: string; path: string; type: string; uploaded_at: string }>) ?? [];
      const updated = [...existing, { name: file.name, path, type: file.type, uploaded_at: new Date().toISOString() }];
      const { error: updateErr } = await supabase.from('vendors').update({ documents: updated as unknown as Json }).eq('id', vendorId);
      if (updateErr) { toast.error('Failed to save document'); } else {
        toast.success('Document uploaded');
        setVendor(prev => prev ? { ...prev, documents: updated as unknown as Json } : prev);
      }
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle className="h-12 w-12 text-severity-critical" />
      <p className="text-sm text-severity-critical">{error}</p>
      <Link to="/vendors" className="text-primary hover:underline text-sm">← Back to Vendors</Link>
    </div>
  );

  if (!vendor) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Building2 className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold text-foreground">Vendor not found</h2>
      <Link to="/vendors" className="text-primary hover:underline text-sm">← Back to Vendors</Link>
    </div>
  );

  const docs = (vendor.documents as Array<{ name: string; path: string; type: string; uploaded_at: string }>) ?? [];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/vendors">
          <button className="mt-1 p-1 rounded hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {vendor.risk_tier && <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${tierStyles[vendor.risk_tier]}`}>{vendor.risk_tier}</span>}
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[vendor.status] ?? ''}`}>{vendor.status.replace('_', ' ')}</span>
          </div>
          <h1 className="text-lg font-bold text-foreground">{vendor.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            {vendor.contact_email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {vendor.contact_email}</span>}
            {vendor.contract_expiry && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Contract: {format(new Date(vendor.contract_expiry), 'MMM d, yyyy')}</span>}
            {vendor.assessment_date && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Last assessed: {format(new Date(vendor.assessment_date), 'MMM d, yyyy')}</span>}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => setWizardOpen(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <Send className="h-3 w-3" /> Schedule Review
            </button>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Risk Tier</div>
          <div className={`text-2xl font-bold capitalize ${vendor.risk_tier === 'critical' ? 'text-severity-critical' : vendor.risk_tier === 'high' ? 'text-severity-high' : vendor.risk_tier === 'medium' ? 'text-severity-medium' : 'text-status-passing'}`}>
            {vendor.risk_tier ?? '—'}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Data Access</div>
          <div className="text-lg font-bold text-foreground">{vendor.data_access ?? '—'}</div>
          <div className="text-xs text-muted-foreground mt-1">Classified data handled</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground uppercase font-semibold mb-1">Contract Value</div>
          <div className="text-lg font-bold text-foreground">{vendor.contract_value ? `$${Number(vendor.contract_value).toLocaleString()}` : '—'}</div>
          <div className="text-xs text-muted-foreground mt-1">Annual contract value</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-md p-0.5 overflow-x-auto" role="tablist">
        {[
          { key: 'assessments' as const, label: 'Assessments', icon: Shield, count: assessments.length },
          { key: 'documents' as const, label: 'Documents', icon: FileText, count: docs.length },
          { key: 'controls' as const, label: 'Linked Controls', icon: Shield, count: controls.length },
          { key: 'details' as const, label: 'Details', icon: FileText, count: null },
        ].map(t => (
          <button key={t.key} role="tab" aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}{t.count !== null ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* Assessments tab */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          <VendorAssessmentCard vendorId={vendorId} />
          {assessments.length > 1 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Assessment History</h3>
              </div>
              <div className="divide-y divide-border">
                {assessments.map(a => (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-foreground">{a.status}</span>
                      <span className={`text-sm font-bold ${a.score >= 80 ? 'text-status-passing' : a.score >= 50 ? 'text-status-warning' : 'text-status-failing'}`}>{a.score}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy') : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Contracts & Certifications ({docs.length})</h3>
            <div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
              </button>
            </div>
          </div>
          {docs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No documents uploaded yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {docs.map((d, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-surface transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate">{d.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{d.uploaded_at ? format(new Date(d.uploaded_at), 'MMM d, yyyy') : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked Controls tab */}
      {activeTab === 'controls' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" /> Linked Controls ({controls.length})
            </h3>
          </div>
          {controls.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No controls linked to this vendor.</div>
          ) : (
            <div className="divide-y divide-border">
              {controls.map(c => (
                <Link key={c.id} to="/controls/$controlId" params={{ controlId: c.id }}>
                  <div className="px-5 py-3 flex items-center justify-between hover:bg-surface transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                      <span className="text-sm text-foreground truncate">{c.title}</span>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${c.status === 'implemented' ? 'bg-status-passing/15 text-status-passing' : c.status === 'in_progress' ? 'bg-status-warning/15 text-status-warning' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Details tab */}
      {activeTab === 'details' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Vendor Details</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Name</p><p className="text-foreground">{vendor.name}</p></div>
              <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Status</p><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusStyles[vendor.status] ?? ''}`}>{vendor.status.replace('_', ' ')}</span></div>
              <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Risk Tier</p><span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${tierStyles[vendor.risk_tier ?? ''] ?? ''}`}>{vendor.risk_tier ?? '—'}</span></div>
              <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Contact</p><p className="text-foreground">{vendor.contact_email ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Data Access</p><p className="text-foreground">{vendor.data_access ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Contract Value</p><p className="text-foreground">{vendor.contract_value ? `$${Number(vendor.contract_value).toLocaleString()}` : '—'}</p></div>
              {vendor.contract_expiry && <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Contract Expiry</p><p className="text-foreground">{format(new Date(vendor.contract_expiry), 'MMM d, yyyy')}</p></div>}
              <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Last Assessment</p><p className="text-foreground">{vendor.assessment_date ? format(new Date(vendor.assessment_date), 'MMM d, yyyy') : '—'}</p></div>
              <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Created</p><p className="text-foreground">{format(new Date(vendor.created_at), 'MMM d, yyyy')}</p></div>
              <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Updated</p><p className="text-foreground">{format(new Date(vendor.updated_at), 'MMM d, yyyy')}</p></div>
            </div>
            {vendor.notes && <div><p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Notes</p><p className="text-sm text-foreground bg-muted/30 border border-border rounded-lg p-3">{vendor.notes}</p></div>}
          </div>
        </div>
      )}

      <VendorAssessmentWizard vendorId={vendorId} open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
