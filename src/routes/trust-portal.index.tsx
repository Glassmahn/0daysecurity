import { createFileRoute } from '@tanstack/react-router';
import { useState, type ElementType } from 'react';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import {
  Globe, Plus, Copy, Trash2, ExternalLink, Clock, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { WriteGuard } from '@/components/guards/RoleGuards';
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog';
import { EntityFormDialog, type FieldDef } from '@/components/crud/EntityFormDialog';
import { toast } from 'sonner';

export const Route = createFileRoute('/trust-portal/')({
  component: TrustPortalPage,
  head: () => ({
    meta: [
      { title: 'Trust Portal — ZeroDay Security' },
      { name: 'description', content: 'Share compliance status and evidence packages with customers' },
    ],
  }),
  validateSearch: () => ({}),
});

const shareFields: FieldDef[] = [
  { name: 'name', label: 'Share Name', type: 'text', required: true, placeholder: 'e.g. SOC 2 Report for Acme Corp', max: 255 },
  { name: 'expires_at', label: 'Expires At', type: 'date' },
];

const statusConfig: Record<string, { style: string; icon: ElementType; label: string }> = {
  active: { style: 'bg-status-passing/12 text-status-passing', icon: CheckCircle, label: 'Active' },
  expired: { style: 'bg-muted text-muted-foreground', icon: Clock, label: 'Expired' },
  revoked: { style: 'bg-status-failing/12 text-status-failing', icon: XCircle, label: 'Revoked' },
};

function TrustPortalPage() {
  const { data: shares, loading, error, refetch, insert, update } = useSupabaseCrud('trust_portal_shares');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
          <XCircle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm font-medium text-destructive">Failed to load shares</p>
        <button onClick={refetch} className="text-xs text-primary hover:underline cursor-pointer">Try again</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading trust portal…</p>
      </div>
    );
  }

  const activeCount = shares.filter((s: any) => s.status === 'active').length;
  const totalAccess = shares.reduce((sum: number, s: any) => sum + (s.access_count ?? 0), 0);

  async function handleCreate(values: Record<string, unknown>): Promise<boolean> {
    const { _id, ...data } = values;
    const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const result = await insert({ ...data, token, status: 'active' });
    if (result) {
      setFormOpen(false);
      toast.success('Share link created — copy it to share with your customer');
      return true;
    }
    return false;
  }

  async function handleCopyLink(share: any) {
    const link = `${window.location.origin}/trust-portal/${share.token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Share link copied to clipboard');
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Trust Portal</h1>
            <p className="text-sm text-muted-foreground">Share compliance status with customers and stakeholders</p>
          </div>
        </div>
        <WriteGuard>
          <button onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 gradient-primary text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-glow transition-all">
            <Plus className="h-4 w-4" /> New Share
          </button>
        </WriteGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="text-2xl font-bold text-foreground">{activeCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Active Shares</div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="text-2xl font-bold text-foreground">{shares.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Shares</div>
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-4">
          <div className="text-2xl font-bold text-foreground">{totalAccess}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Views</div>
        </div>
      </div>

      {/* Shares list */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left bg-surface/50">
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Name</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Views</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Expires</th>
              <th className="px-4 py-3.5 text-xs font-semibold text-muted-foreground w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shares.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground text-sm">
                  No shares yet. Create one to share compliance data with customers.
                </td>
              </tr>
            ) : shares.map((share: any) => {
              const sc = statusConfig[share.status] ?? statusConfig.active;
              const StatusIcon = sc.icon;
              const shareUrl = `${window.location.origin}/trust-portal/${share.token}`;
              return (
                <tr key={share.id} className="border-b border-border/40 hover:bg-primary/[0.03] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-foreground">{share.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate max-w-[300px]">{shareUrl}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-md ${sc.style}`}>
                      <StatusIcon className="h-3 w-3" />{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">{share.access_count ?? 0}</td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs hidden lg:table-cell">
                    {share.expires_at ? new Date(share.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleCopyLink(share)}
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Copy link">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Open">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <WriteGuard>
                        <button onClick={() => setDeleteTarget({ id: share.id, title: share.name })}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive" title="Revoke">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </WriteGuard>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen}
        title="New Share Link" fields={shareFields}
        onSubmit={handleCreate} />

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={deleteTarget?.title ?? 'share'}
        onConfirm={async () => deleteTarget ? update(deleteTarget.id, { status: 'revoked' }) : false} />
    </div>
  );
}
