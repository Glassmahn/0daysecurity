import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, Plus, UserCheck, CheckCircle2, XCircle, Clock, AlertCircle, Calendar, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { WriteGuard, RouteGuard } from '@/components/guards/RoleGuards';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/crud/TablePagination';
import { exportToCsv } from '@/lib/export-csv';

export const Route = createFileRoute('/reviews/')({
  component: ReviewsIndexPage,
  head: () => ({ meta: [{ title: 'Access Reviews — ZeroDay Security' }] }),
});

const statusStyles: Record<string, string> = {
  active: 'bg-status-passing/12 text-status-passing',
  pending: 'bg-status-in-progress/12 text-status-in-progress',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-status-failing/12 text-status-failing',
};

function ReviewsIndexPage() {
  const navigate = useNavigate({ from: '/reviews/' });
  const [campaigns, setCampaigns] = useState<Record<string, any>[]>([]);
  const [personnel, setPersonnel] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  async function fetchCampaigns(cancelRef?: { current: boolean }) {
    setLoading(true);
    const { data, error } = await supabase.from('access_review_campaigns')
      .select('id, name, status, due_date, created_at')
      .order('created_at', { ascending: false });
    if (cancelRef?.current) return;
    if (error) toast.error('Failed to load campaigns');
    else setCampaigns(data ?? []);
    setLoading(false);
  }

  async function fetchPersonnel(cancelRef?: { current: boolean }) {
    const { data, error } = await supabase.from('personnel')
      .select('id, name, email, department')
      .order('name');
    if (cancelRef?.current) return;
    if (!error) setPersonnel(data ?? []);
  }

  useEffect(() => {
    const cancelRef = { current: false };
    fetchCampaigns(cancelRef);
    fetchPersonnel(cancelRef);
    return () => { cancelRef.current = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return campaigns;
    const q = search.toLowerCase();
    return campaigns.filter(c => c.name.toLowerCase().includes(q));
  }, [campaigns, search]);

  const pagination = usePagination(filtered);

  const campaignFields: FieldDef[] = [
    { name: 'name', label: 'Campaign Name', type: 'text', required: true, placeholder: 'e.g. Q2 2026 Access Review', max: 255 },
    { name: 'due_date', label: 'Due Date', type: 'date' },
    { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional campaign notes...', max: 2000 },
    {
      name: 'reviewee_ids', label: 'Assign Personnel for Review', type: 'multi-select',
      options: personnel.map(p => ({ value: p.id, label: `${p.name}${p.department ? ` (${p.department})` : ''}` })),
    },
  ];

  if (loading && !campaigns.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 animate-fade-up">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading campaigns…</p>
      </div>
    );
  }

  return (
    <RouteGuard allowedRoles={['admin']}>
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <UserCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Access Reviews</h1>
            <p className="text-sm text-muted-foreground">{campaigns.length} campaigns{loading && <span className="inline-flex items-center gap-1 ml-2 text-xs"><Loader2 className="h-3 w-3 animate-spin" />refreshing</span>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WriteGuard>
            <button onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-glow transition-all">
              <Plus className="h-4 w-4" /> New Campaign
            </button>
          </WriteGuard>
          <button onClick={() => exportToCsv('access-reviews', filtered as Record<string, unknown>[], [
            { key: 'name', label: 'Campaign' },
            { key: 'status', label: 'Status' },
            { key: 'due_date', label: 'Due Date' },
            { key: 'created_at', label: 'Created' },
          ])}
            className="flex items-center gap-1.5 px-3 py-2 border border-border/60 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" aria-label="Search campaigns" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all" />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} campaign{filtered.length !== 1 ? 's' : ''} matching</p>

      {/* Campaigns list */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left bg-surface/50">
              <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Campaign</th>
              <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Status</th>
              <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Due Date</th>
              <th scope="col" className="px-4 py-3.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Created</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paged.map(c => (
              <tr key={c.id} className="border-b border-border/40 hover:bg-primary/[0.03] transition-colors cursor-pointer"
                onClick={() => navigate({ to: '/reviews/$campaignId', params: { campaignId: c.id } })}>
                <td className="px-4 py-3.5 font-medium text-foreground">{c.name}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-md ${statusStyles[c.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {c.status === 'active' ? <CheckCircle2 className="h-3 w-3" /> : c.status === 'pending' ? <Clock className="h-3 w-3" /> : c.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {c.status ?? 'unknown'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                  {c.due_date ? (
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(c.due_date).toLocaleDateString()}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3.5 text-muted-foreground text-xs hidden md:table-cell">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4}>
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-3">
                  <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <p>No campaigns found.</p>
                  <button onClick={() => setFormOpen(true)} className="text-primary hover:text-primary-glow transition-colors cursor-pointer font-medium text-xs">Create one</button>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
        <TablePagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} pageSize={pagination.pageSize} onPageChange={pagination.goTo} />
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title="New Campaign" fields={campaignFields}
        onSubmit={async (vals) => {
          const { data: campaign, error } = await supabase.from('access_review_campaigns').insert({
            name: vals.name as string,
            due_date: (vals.due_date as string | null) || null,
            notes: (vals.notes as string | null) || null,
            status: 'active',
          } as TablesInsert<'access_review_campaigns'>).select('id').single();
          if (error) { toast.error('Failed: ' + error.message); return false; }

          const revieweeIds = vals.reviewee_ids as string[];
          if (revieweeIds?.length > 0) {
            const { error: assignError } = await supabase.from('access_review_assignments').insert(
              revieweeIds.map(pid => ({
                campaign_id: campaign.id,
                reviewee_id: pid,
                status: 'pending',
              }))
            );
            if (assignError) toast.error('Campaign created, but some assignments failed: ' + assignError.message);
            else toast.success(`Campaign created with ${revieweeIds.length} reviewer(s)`);
          } else {
            toast.success('Campaign created');
          }
          await fetchCampaigns();
          return true;
        }} />
    </div>
    </RouteGuard>
  );
}
