import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logAudit } from '@/lib/audit-logger';
import { toast } from 'sonner';
import { sanitizeError } from '@/lib/errors';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roleStyles: Record<string, string> = {
  admin: 'bg-severity-critical/15 text-severity-critical',
  analyst: 'bg-status-in-progress/15 text-status-in-progress',
  auditor: 'bg-chart-5/15 text-chart-5',
  viewer: 'bg-muted text-muted-foreground',
};

const roleDescriptions: Record<string, string> = {
  admin: 'Full access — manage team, settings, and all modules',
  analyst: 'Write access to alerts, incidents, assets, controls, evidence',
  auditor: 'Read-only access to frameworks, controls, evidence, policies',
  viewer: 'Dashboard read-only',
};

const allRoles: AppRole[] = ['admin', 'analyst', 'auditor', 'viewer'];

interface UserWithRole {
  user_id: string;
  display_name: string | null;
  role: AppRole;
  role_id: string;
}

export function RBACManager() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const { data: usersWithRoles = [], isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Fetch profiles and roles separately, join client-side
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name'),
        supabase.from('user_roles').select('id, user_id, role'),
      ]);

      if (!profiles || !roles) return [];

      const roleMap = new Map(roles.map(r => [r.user_id, { role: r.role, role_id: r.id }]));

      return profiles.map(p => ({
        user_id: p.user_id,
        display_name: p.display_name,
        role: roleMap.get(p.user_id)?.role ?? ('viewer' as AppRole),
        role_id: roleMap.get(p.user_id)?.role_id ?? '',
      })) as UserWithRole[];
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole, oldRole }: { userId: string; newRole: AppRole; oldRole: AppRole }) => {
      // Atomic update — single query avoids race condition of delete+insert
      const { error: updErr } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      if (updErr) throw updErr;

      logAudit({
        action: 'role_change',
        entity_type: 'role',
        entity_id: userId,
        details: { from: oldRole, to: newRole },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      setEditingUser(null);
      toast.success('Role updated successfully');
    },
    onError: (err) => {
      toast.error(`Failed to update role: ${sanitizeError(err)}`);
    },
  });

  return (
    <div className="space-y-6">
      {/* Role descriptions */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Role Permissions</h3>
        {allRoles.map(role => (
          <div key={role} className="flex items-center gap-3 px-4 py-3 bg-surface rounded-lg">
            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${roleStyles[role]}`}>{role}</span>
            <span className="text-xs text-muted-foreground">{roleDescriptions[role]}</span>
          </div>
        ))}
      </div>

      {/* User roles table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">User Roles ({usersWithRoles.length})</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Current Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersWithRoles.map(u => (
                <tr key={u.user_id} className="border-b border-border hover:bg-surface transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{u.display_name ?? 'Unknown'}</span>
                    <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">{u.user_id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-4 py-3">
                    {editingUser === u.user_id ? (
                      <select
                        defaultValue={u.role}
                        onChange={e => {
                          const newRole = e.target.value as AppRole;
                          if (newRole !== u.role) {
                            changeRoleMutation.mutate({ userId: u.user_id, newRole, oldRole: u.role });
                          } else {
                            setEditingUser(null);
                          }
                        }}
                        className="px-2 py-1 bg-input border border-border rounded text-xs text-foreground"
                        autoFocus
                        onBlur={() => setEditingUser(null)}
                      >
                        {allRoles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${roleStyles[u.role]}`}>{u.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingUser(u.user_id)}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Change Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
