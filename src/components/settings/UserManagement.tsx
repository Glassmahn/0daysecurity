import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { inviteUser, deactivateUser, reactivateUser, listUsers } from '@/lib/user-management.functions';
import { UserPlus, Loader2, Search, UserX, UserCheck, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeError } from '@/lib/errors';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AppRole = Database['public']['Enums']['app_role'];

const roleStyles: Record<string, string> = {
  admin: 'bg-severity-critical/15 text-severity-critical',
  analyst: 'bg-status-in-progress/15 text-status-in-progress',
  auditor: 'bg-chart-5/15 text-chart-5',
  viewer: 'bg-muted text-muted-foreground',
};

const statusStyles: Record<string, string> = {
  active: 'bg-status-passing/15 text-status-passing',
  invited: 'bg-status-warning/15 text-status-warning',
  deactivated: 'bg-muted text-muted-foreground',
};

const allRoles: AppRole[] = ['admin', 'analyst', 'auditor', 'viewer'];

export function UserManagement() {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [search, setSearch] = useState('');
  const [inviteForm, setInviteForm] = useState({ email: '', displayName: '', role: 'viewer' as AppRole });

  const listUsersFn = useServerFn(listUsers);
  const inviteUserFn = useServerFn(inviteUser);
  const deactivateUserFn = useServerFn(deactivateUser);
  const reactivateUserFn = useServerFn(reactivateUser);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => listUsersFn(),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; displayName: string; role: AppRole }) =>
      inviteUserFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowInvite(false);
      setInviteForm({ email: '', displayName: '', role: 'viewer' });
      toast.success('User invited successfully');
    },
    onError: (err) => toast.error(sanitizeError(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => deactivateUserFn({ data: { userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deactivated');
    },
    onError: (err) => toast.error(sanitizeError(err)),
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => reactivateUserFn({ data: { userId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User reactivated');
    },
    onError: (err) => toast.error(sanitizeError(err)),
  });

  const userList = Array.isArray(users) ? users : [];

  const filtered = userList.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return u.displayName.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  const stats = {
    total: userList.length,
    active: userList.filter(u => u.status === 'active').length,
    invited: userList.filter(u => u.status === 'invited').length,
    deactivated: userList.filter(u => u.status === 'deactivated').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-lg font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Users</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-lg font-bold text-status-passing">{stats.active}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-lg font-bold text-status-warning">{stats.invited}</div>
          <div className="text-xs text-muted-foreground">Invited</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-lg font-bold text-muted-foreground">{stats.deactivated}</div>
          <div className="text-xs text-muted-foreground">Deactivated</div>
        </div>
      </div>

      {/* Search + Invite */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <UserPlus className="h-4 w-4" /> Invite User
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="bg-card border border-primary/30 rounded-lg p-5 space-y-4 animate-slide-in">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" /> Invite New User
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@company.com"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
              <input
                type="text"
                value={inviteForm.displayName}
                onChange={e => setInviteForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Role</label>
              <Select
                value={inviteForm.role}
                onValueChange={v => setInviteForm(prev => ({ ...prev, role: v as AppRole }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map(r => (
                    <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!inviteForm.email || !inviteForm.displayName) {
                  toast.error('Please fill in all fields');
                  return;
                }
                inviteMutation.mutate(inviteForm);
              }}
              disabled={inviteMutation.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {inviteMutation.isPending ? (
                <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...</span>
              ) : 'Create User'}
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            The user will be created with a temporary password. They should use "Forgot Password" on the login page to set their own credentials.
          </p>
        </div>
      )}

      {/* Users table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Last Sign In</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-border hover:bg-surface transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{u.displayName}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${roleStyles[u.role] ?? 'bg-muted text-muted-foreground'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusStyles[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {u.lastSignIn ? format(new Date(u.lastSignIn), 'MMM d, yyyy HH:mm') : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {u.status === 'deactivated' ? (
                        <button
                          onClick={() => reactivateMutation.mutate(u.id)}
                          disabled={reactivateMutation.isPending}
                          className="flex items-center gap-1 text-xs text-status-passing font-medium hover:underline disabled:opacity-50"
                          title="Reactivate user"
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Reactivate
                        </button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={deactivateMutation.isPending}
                              className="flex items-center gap-1 text-xs text-status-failing font-medium hover:underline disabled:opacity-50"
                              title="Deactivate user"
                            >
                              <UserX className="h-3.5 w-3.5" /> Deactivate
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate {u.displayName}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                They will no longer be able to sign in. Their data and assignments will be preserved.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deactivateMutation.mutate(u.id)}
                              >
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No users found</div>
        )}
      </div>
    </div>
  );
}
