import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Search, Filter, Clock, User, Shield, FileText,
  AlertTriangle, Monitor, Flame, Building2, FlaskConical,
  Paperclip, ListChecks, BookOpen, LogIn, LogOut, RotateCcw,
  Download, Eye, Pencil, Trash2, Plus,
} from 'lucide-react';

const actionIcons: Record<string, typeof Plus> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
  role_change: Shield,
  view: Eye,
  export: Download,
  revert: RotateCcw,
};

const actionStyles: Record<string, string> = {
  create: 'bg-status-passing/15 text-status-passing',
  update: 'bg-status-in-progress/15 text-status-in-progress',
  delete: 'bg-status-failing/15 text-status-failing',
  login: 'bg-chart-5/15 text-chart-5',
  logout: 'bg-muted text-muted-foreground',
  role_change: 'bg-severity-critical/15 text-severity-critical',
  view: 'bg-muted text-muted-foreground',
  export: 'bg-status-warning/15 text-status-warning',
  revert: 'bg-chart-5/15 text-chart-5',
};

const entityIcons: Record<string, typeof Shield> = {
  control: ListChecks,
  evidence: Paperclip,
  framework: Shield,
  policy: FileText,
  risk: AlertTriangle,
  incident: Flame,
  asset: Monitor,
  vendor: Building2,
  test: FlaskConical,
  kb_article: BookOpen,
  user: User,
  role: Shield,
  session: Clock,
};

export function AuditTrailPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, entityFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (actionFilter !== 'all') query = query.eq('action', actionFilter);
      if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-audit'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, display_name');
      return data ?? [];
    },
  });

  const profileMap = new Map(profiles.map(p => [p.user_id, p.display_name]));

  const filtered = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    const userName = profileMap.get(log.user_id ?? '') ?? '';
    return (
      log.action.toLowerCase().includes(s) ||
      log.entity_type.toLowerCase().includes(s) ||
      userName.toLowerCase().includes(s) ||
      (log.entity_id ?? '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Audit Trail</h1>
        <p className="text-sm text-muted-foreground">Complete activity log of all user actions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground"
        >
          <option value="all">All Actions</option>
          {['create', 'update', 'delete', 'login', 'logout', 'role_change', 'view', 'export', 'revert'].map(a => (
            <option key={a} value={a}>{a.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground"
        >
          <option value="all">All Entities</option>
          {['control', 'evidence', 'framework', 'policy', 'risk', 'incident', 'asset', 'vendor', 'test', 'kb_article', 'user', 'role', 'session'].map(e => (
            <option key={e} value={e}>{e.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: logs.length, icon: Clock },
          { label: 'Creates', value: logs.filter(l => l.action === 'create').length, icon: Plus },
          { label: 'Updates', value: logs.filter(l => l.action === 'update').length, icon: Pencil },
          { label: 'Deletes', value: logs.filter(l => l.action === 'delete').length, icon: Trash2 },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <span className="text-lg font-bold text-foreground">{s.value}</span>
            </div>
          );
        })}
      </div>

      {/* Log entries */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading audit logs...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No audit logs found</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(log => {
              const ActionIcon = actionIcons[log.action] ?? Clock;
              const EntityIcon = entityIcons[log.entity_type] ?? FileText;
              const userName = profileMap.get(log.user_id ?? '') ?? 'System';
              const details = log.details as Record<string, unknown> | null;

              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface transition-colors">
                  <div className={`p-1.5 rounded-md mt-0.5 ${actionStyles[log.action] ?? 'bg-muted text-muted-foreground'}`}>
                    <ActionIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{userName}</span>
                      <span className="text-xs text-muted-foreground">performed</span>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${actionStyles[log.action] ?? 'bg-muted text-muted-foreground'}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">on</span>
                      <span className="flex items-center gap-1 text-xs text-foreground">
                        <EntityIcon className="h-3 w-3" />
                        {log.entity_type.replace('_', ' ')}
                      </span>
                    </div>
                    {details && Object.keys(details).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-1">
                    {format(new Date(log.created_at), 'MMM d, HH:mm')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
