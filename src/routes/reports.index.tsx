import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { generateReport } from '@/lib/pdf-report';
import { exportToCsv } from '@/lib/export-csv';
import { BarChart3, Download, Calendar, Play, Loader2, FileText, Plus, Trash2, Share2, Link, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { WriteGuard } from '@/components/guards/RoleGuards';

export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
  head: () => ({ meta: [{ title: 'Reports — ZeroDay Security' }] }),
});

const FORMAT_COLORS: Record<string, string> = {
  pdf: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  csv: 'bg-green-500/10 text-green-400 border border-green-500/20',
};

const reportTemplates = [
  { id: 'rpt-1', name: 'Compliance Summary', description: 'High-level compliance posture across all frameworks', type: 'Compliance', lastGenerated: null, frequency: 'weekly', format: 'pdf' },
  { id: 'rpt-2', name: 'Control Status Report', description: 'Detailed status of all controls with implementation progress', type: 'Controls', lastGenerated: null, frequency: 'monthly', format: 'pdf' },
  { id: 'rpt-3', name: 'Evidence Coverage Report', description: 'Evidence gaps and expiry analysis by control', type: 'Evidence', lastGenerated: null, frequency: 'weekly', format: 'csv' },
  { id: 'rpt-4', name: 'Alert Trends', description: 'Alert volume, severity distribution, and MTTA/MTTR trends', type: 'Alerts', lastGenerated: null, frequency: 'daily', format: 'pdf' },
  { id: 'rpt-5', name: 'Incident Summary', description: 'Active and resolved incidents with SLA compliance', type: 'Incidents', lastGenerated: null, frequency: 'weekly', format: 'pdf' },
  { id: 'rpt-6', name: 'Personnel Review Status', description: 'Access review and training completion by department', type: 'Personnel', lastGenerated: null, frequency: 'monthly', format: 'csv' },
  { id: 'rpt-7', name: 'Risk Register', description: 'Risk register summary with heat map and mitigation status', type: 'Risk', lastGenerated: null, frequency: 'quarterly', format: 'pdf' },
  { id: 'rpt-8', name: 'Executive Dashboard Export', description: 'KPI summary and trend charts for leadership review', type: 'Executive', lastGenerated: null, frequency: null, format: 'pdf' },
  { id: 'rpt-9', name: 'Audit Readiness', description: 'Per-framework readiness score with control implementation breakdown', type: 'Audit', lastGenerated: null, frequency: 'monthly', format: 'pdf' },
];

const reportTypeOptions = reportTemplates.map(r => ({ value: r.id, label: r.name }));

const scheduleFields: FieldDef[] = [
  { name: 'name', label: 'Schedule Name', type: 'text', required: true, placeholder: 'e.g. Weekly Compliance Summary', max: 255 },
  { name: 'report_type', label: 'Report Type', type: 'select', required: true, options: reportTypeOptions },
  { name: 'format', label: 'Format', type: 'select', required: true, options: [{ value: 'pdf', label: 'PDF' }, { value: 'csv', label: 'CSV' }, { value: 'html', label: 'HTML' }] },
  { name: 'schedule', label: 'Frequency', type: 'select', required: true, options: [{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }] },
];

function ReportCard({ rpt, onShare }: { rpt: typeof reportTemplates[number]; onShare: (id: string, name: string) => void }) {
  const [generating, setGenerating] = useState(false);

  const canGenerate = reportTemplates.some(r => r.id === rpt.id);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateReport(rpt.id);
      toast.success(`${rpt.name} downloaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-all group flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{rpt.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rpt.description}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ml-2 ${FORMAT_COLORS[rpt.format] ?? 'bg-muted text-muted-foreground'}`}>
          {rpt.format}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {rpt.frequency && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="capitalize">{rpt.frequency}</span>
          </div>
        )}
        {rpt.lastGenerated && <span>Last: {rpt.lastGenerated}</span>}
      </div>

      <div className="flex items-center gap-2 mt-auto pt-1">
        {canGenerate ? (
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {generating ? 'Generating...' : rpt.format === 'csv' ? 'Export CSV' : 'Generate PDF'}
          </button>
        ) : (
          <button disabled className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-medium opacity-50 cursor-not-allowed">
            <Play className="h-3 w-3" /> Generate
          </button>
        )}
        <button onClick={() => onShare(rpt.id, rpt.name)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-medium hover:bg-accent transition-colors text-muted-foreground"
          title="Share with auditor">
          <Share2 className="h-3 w-3" /> Share
        </button>
      </div>
    </div>
  );
}

function ReportsPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizard, setWizard] = useState({
    reportType: '',
    format: 'pdf' as 'pdf' | 'csv',
    dateFrom: '',
    dateTo: '',
    title: '',
  });
  const [generating, setGenerating] = useState(false);
  const [schedules, setSchedules] = useState<Record<string, any>[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [shareDialog, setShareDialog] = useState<{ open: boolean; reportId: string; reportName: string }>({ open: false, reportId: '', reportName: '' });
  const [shareToken, setShareToken] = useState('');
  const [shareGenerating, setShareGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchSchedules(cancelRef?: { current: boolean }) {
    setSchedulesLoading(true);
    const { data, error } = await supabase.from('report_schedules').select('id, name, schedule, format, status, created_at').order('created_at', { ascending: false });
    if (cancelRef?.current) return;
    if (!error) setSchedules(data ?? []);
    setSchedulesLoading(false);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchSchedules(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

  async function handleScheduleSubmit(values: Record<string, unknown>) {
    const { error } = await (supabase as any).from('report_schedules').insert(values);
    if (error) { toast.error('Failed to create schedule'); return false; }
    toast.success('Report schedule created');
    await fetchSchedules();
    return true;
  }

  async function handleDeleteSchedule(id: string) {
    const { error } = await (supabase as any).from('report_schedules').delete().eq('id', id);
    if (error) { toast.error('Failed to delete schedule'); return; }
    toast.success('Schedule deleted');
    await fetchSchedules();
  }

  async function handleGenerateCustom() {
    if (!wizard.reportType || !wizard.title) {
      toast.error('Please fill in report type and title');
      return;
    }
    setGenerating(true);
    try {
      if (wizard.format === 'csv') {
        const filtered = reportTemplates.filter(r => r.id === wizard.reportType);
        const rows = filtered.length > 0 ? filtered : reportTemplates;
        exportToCsv(wizard.title || 'report', rows as unknown as Record<string, unknown>[]);
      } else {
        await generateReport(wizard.reportType);
      }
      toast.success(`${wizard.title} generated`);
      setWizardOpen(false);
      setWizard({ reportType: '', format: 'pdf', dateFrom: '', dateTo: '', title: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }

  async function generateShareLink() {
    setShareGenerating(true);
    try {
      const token = crypto.randomUUID();
      const { error } = await supabase.from('trust_portal_shares').insert([{
        name: `Report: ${shareDialog.reportName}`,
        token,
        status: 'active',
        frameworks: [],
        include_evidence: false,
        include_reports: true,
        allowed_domains: [],
      }]);
      if (error) throw error;
      const origin = window.location.origin;
      setShareToken(`${origin}/trust-portal?token=${token}`);
    } catch (err) {
      toast.error('Failed to generate share link');
    } finally {
      setShareGenerating(false);
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">{reportTemplates.length} report templates available</p>
        </div>
        <button onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <BarChart3 className="h-4 w-4" /> Custom Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.map(rpt => (
          <ReportCard key={rpt.id} rpt={rpt} onShare={(id, name) => {
            setShareDialog({ open: true, reportId: id, reportName: name });
            setShareToken('');
            setCopied(false);
          }} />
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Scheduled Reports</h3>
          <WriteGuard>
            <button onClick={() => setScheduleFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" /> New Schedule
            </button>
          </WriteGuard>
        </div>
        {schedulesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="h-4 w-4 animate-spin" /> Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No schedules configured</p>
        ) : (
          <div className="space-y-3">
            {schedules.map(s => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-foreground font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 capitalize">({s.schedule} · {s.format?.toUpperCase()})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${s.status === 'active' ? 'bg-status-passing/15 text-status-passing' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
                  <WriteGuard>
                    <button onClick={() => handleDeleteSchedule(s.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </WriteGuard>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EntityFormDialog open={scheduleFormOpen} onOpenChange={setScheduleFormOpen}
        title="New Report Schedule" fields={scheduleFields}
        initialValues={{ status: 'active', format: 'pdf', schedule: 'weekly' }}
        onSubmit={handleScheduleSubmit} entityType="report_schedules" />

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Custom Report</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Report Title</label>
              <input value={wizard.title} onChange={e => setWizard(prev => ({ ...prev, title: e.target.value }))}
                placeholder="My Custom Report"
                className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Report Type</label>
              <Select value={wizard.reportType} onValueChange={v => setWizard(prev => ({ ...prev, reportType: v }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypeOptions.map(rt => (
                    <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Format</label>
              <Select value={wizard.format} onValueChange={v => setWizard(prev => ({ ...prev, format: v as 'pdf' | 'csv' }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">From</label>
                <input type="date" value={wizard.dateFrom} onChange={e => setWizard(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">To</label>
                <input type="date" value={wizard.dateTo} onChange={e => setWizard(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWizardOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateCustom} disabled={generating}>
              {generating && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialog.open} onOpenChange={(open) => setShareDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Share Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Generate a shareable link for <strong className="text-foreground">{shareDialog.reportName}</strong>.
              Auditors can view this report without logging in.
            </p>
            {!shareToken ? (
              <button onClick={generateShareLink} disabled={shareGenerating}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {shareGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link className="h-4 w-4" />}
                {shareGenerating ? 'Generating...' : 'Generate Share Link'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                  <Link className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs text-foreground break-all">{shareToken}</span>
                </div>
                <button onClick={copyShareLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors text-foreground">
                  {copied ? <Check className="h-4 w-4 text-status-passing" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
