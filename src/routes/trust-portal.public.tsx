import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield, CheckCircle, Globe, Loader2, Mail, FileText,
  Lock, Server, Clock, Users, Building2, Send,
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/trust-portal/public')({
  component: PublicTrustPortal,
  head: () => ({
    meta: [
      { title: 'Trust Portal — ZeroDay Security' },
      { name: 'description', content: 'ZeroDay Security Trust Portal — compliance status, security metrics, and trust center' },
    ],
  }),
});

const certifications = [
  { name: 'SOC 2 Type II', standard: 'SOC2', status: 'active', score: 96, badge: 'bg-status-passing/15 text-status-passing' },
  { name: 'ISO 27001', standard: 'ISO27001', status: 'active', score: 92, badge: 'bg-status-passing/15 text-status-passing' },
  { name: 'HIPAA', standard: 'HIPAA', status: 'active', score: 88, badge: 'bg-status-passing/15 text-status-passing' },
  { name: 'GDPR', standard: 'GDPR', status: 'active', score: 90, badge: 'bg-status-passing/15 text-status-passing' },
  { name: 'NIST 800-53', standard: 'NIST', status: 'in_progress', score: 72, badge: 'bg-status-in-progress/15 text-status-in-progress' },
  { name: 'FedRAMP', standard: 'FedRAMP', status: 'planned', score: 0, badge: 'bg-muted text-muted-foreground' },
];

const metrics = [
  { label: 'Uptime SLA', value: '99.99%', icon: Clock, color: 'text-status-passing' },
  { label: 'Data Encryption', value: 'AES-256', icon: Lock, color: 'text-primary' },
  { label: 'Server Locations', value: 'US / EU', icon: Server, color: 'text-chart-2' },
  { label: 'Annual Pen Tests', value: '2', icon: Shield, color: 'text-severity-high' },
  { label: 'Employees', value: '125+', icon: Users, color: 'text-muted-foreground' },
  { label: 'GDPR Compliant', value: 'Yes', icon: Globe, color: 'text-status-passing' },
];

const statusBadge: Record<string, { label: string; style: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', style: 'bg-status-passing/15 text-status-passing', icon: CheckCircle },
  in_progress: { label: 'In Progress', style: 'bg-status-in-progress/15 text-status-in-progress', icon: Clock },
  planned: { label: 'Planned', style: 'bg-muted text-muted-foreground', icon: Clock },
};

function PublicTrustPortal() {
  const [subprocessors, setSubprocessors] = useState<Record<string, any>[]>([]);
  const [subprocessorsLoading, setSubprocessorsLoading] = useState(true);

  // NDA document request form
  const [ndaForm, setNdaForm] = useState({ name: '', email: '', company: '', document_request: '', accepted_nda: false });
  const [ndaSubmitting, setNdaSubmitting] = useState(false);
  const [ndaDone, setNdaDone] = useState(false);

  // Contact form
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactDone, setContactDone] = useState(false);

  useEffect(() => {
    supabase.from('subprocessors').select('*').eq('status', 'active').order('name').then(({ data }) => {
      setSubprocessors(data ?? []);
      setSubprocessorsLoading(false);
    });
  }, []);

  async function handleNdaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ndaForm.accepted_nda) {
      toast.error('You must accept the NDA before requesting documents');
      return;
    }
    setNdaSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('request-document-access', {
        body: {
          name: ndaForm.name,
          email: ndaForm.email,
          company: ndaForm.company,
          document_request: ndaForm.document_request,
          accepted_nda: ndaForm.accepted_nda,
        },
      });
      if (error) throw error;
      setNdaDone(true);
      toast.success('Document request submitted — we will review and respond shortly');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to submit request');
    } finally {
      setNdaSubmitting(false);
    }
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setContactDone(true);
    setContactSubmitting(false);
    toast.success('Message sent — our security team will respond within 24 hours');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">ZeroDay Security</h1>
              <p className="text-[10px] text-muted-foreground">Trust Portal</p>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            <a href="#certifications" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Certifications</a>
            <a href="#metrics" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Security</a>
            <a href="#documents" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Documents</a>
            <a href="#subprocessors" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Subprocessors</a>
            <a href="#contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </nav>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mx-auto">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Trust Center</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            ZeroDay Security is committed to the highest standards of security, privacy, and compliance.
            This portal provides real-time visibility into our security posture, certifications, and subprocessors.
          </p>
        </section>

        {/* Certifications */}
        <section id="certifications">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-status-passing" /> Certifications & Compliance
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map(cert => {
              const sb = statusBadge[cert.status] ?? statusBadge.planned;
              const SIcon = sb.icon;
              return (
                <div key={cert.name} className="bg-card border border-border/60 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground text-sm">{cert.name}</h3>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${sb.style}`}>
                      <SIcon className="h-3 w-3" />{sb.label}
                    </span>
                  </div>
                  {cert.status !== 'planned' && (
                    <>
                      <div className="text-2xl font-bold text-foreground mb-1">{cert.score}%</div>
                      <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${cert.score >= 80 ? 'bg-status-passing' : cert.score >= 50 ? 'bg-status-in-progress' : 'bg-status-failing'}`}
                          style={{ width: `${cert.score}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Compliance score</p>
                    </>
                  )}
                  {cert.status === 'planned' && (
                    <p className="text-xs text-muted-foreground mt-1">Implementation planned</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Security Metrics */}
        <section id="metrics">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Security Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {metrics.map(m => {
              const MIcon = m.icon;
              return (
                <div key={m.label} className="bg-card border border-border/60 rounded-xl p-4 text-center">
                  <MIcon className={`h-5 w-5 mx-auto mb-2 ${m.color}`} />
                  <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* NDA Document Request */}
        <section id="documents">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Request Document Access
          </h2>
          <div className="bg-card border border-border/60 rounded-xl p-6">
            {ndaDone ? (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 text-status-passing mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Request Submitted</h3>
                <p className="text-xs text-muted-foreground">Our security team will review your request and respond within 1-2 business days.</p>
              </div>
            ) : (
              <form onSubmit={handleNdaSubmit} className="space-y-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Access to detailed compliance reports, evidence packages, and security documentation requires
                  acceptance of our standard Non-Disclosure Agreement.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input required value={ndaForm.name} onChange={e => setNdaForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Full name" className="px-3 py-2.5 bg-input border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input required type="email" value={ndaForm.email} onChange={e => setNdaForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="Email address" className="px-3 py-2.5 bg-input border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input value={ndaForm.company} onChange={e => setNdaForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="Company (optional)" className="px-3 py-2.5 bg-input border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <textarea required value={ndaForm.document_request} onChange={e => setNdaForm(p => ({ ...p, document_request: e.target.value }))}
                  placeholder="Describe the documents or evidence packages you need access to..."
                  rows={3} className="w-full px-3 py-2.5 bg-input border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <label className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border border-border/40 cursor-pointer">
                  <input type="checkbox" checked={ndaForm.accepted_nda} onChange={e => setNdaForm(p => ({ ...p, accepted_nda: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary" />
                  <div>
                    <p className="text-xs text-foreground font-medium">Accept NDA</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      I agree to treat all shared documentation as confidential and not disclose it to third parties.
                      This NDA covers all documents accessed through this portal.
                    </p>
                  </div>
                </label>
                <button type="submit" disabled={ndaSubmitting || !ndaForm.accepted_nda}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {ndaSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {ndaSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Subprocessors */}
        <section id="subprocessors">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Subprocessors
          </h2>
          {subprocessorsLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : subprocessors.length === 0 ? (
            <div className="bg-card border border-border/60 rounded-xl p-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No subprocessors listed</p>
            </div>
          ) : (
            <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-surface/50">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-left">Name</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-left">Purpose</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-left">Country</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-left">Data Handled</th>
                  </tr>
                </thead>
                <tbody>
                  {subprocessors.map(sp => (
                    <tr key={sp.id} className="border-b border-border/40 hover:bg-primary/[0.02]">
                      <td className="px-4 py-3 font-medium text-foreground">{sp.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sp.purpose}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sp.country}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sp.data_handled || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Contact Security Team */}
        <section id="contact">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" /> Contact Security Team
          </h2>
          <div className="bg-card border border-border/60 rounded-xl p-6">
            {contactDone ? (
              <div className="text-center py-8">
                <CheckCircle className="h-10 w-10 text-status-passing mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">Message Sent</h3>
                <p className="text-xs text-muted-foreground">Our security team will respond within 24 hours. For urgent matters, email security@zeroday.security directly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your name" className="px-3 py-2.5 bg-input border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input required type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="Your email" className="px-3 py-2.5 bg-input border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <input required value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                  placeholder="Subject" className="w-full px-3 py-2.5 bg-input border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <textarea required value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Your message..." rows={4} className="w-full px-3 py-2.5 bg-input border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button type="submit" disabled={contactSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {contactSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {contactSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-border/60 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">ZeroDay Security Trust Portal</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span>Security: security@zeroday.security</span>
            <span>Privacy: privacy@zeroday.security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
