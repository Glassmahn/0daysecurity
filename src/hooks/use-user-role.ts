import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export function useUserRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRole() {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || cancelled) {
        setIsLoading(false);
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!cancelled) {
        // Seed admin override: only active when VITE_SEED_ADMIN_ID is set.
        const SEED_ADMIN_ID = import.meta.env.VITE_SEED_ADMIN_ID ?? '';
        if (SEED_ADMIN_ID && user.id === SEED_ADMIN_ID) {
          setRole('admin');
        } else if (roles && roles.length > 0) {
          // Pick highest privilege role (ordered by privilege: admin > analyst > editor > auditor > viewer)
          const hierarchy: Record<string, number> = { admin: 5, analyst: 4, editor: 3, auditor: 2, viewer: 1 };
          const best = roles.reduce((a, b) => (hierarchy[a.role] ?? 0) > (hierarchy[b.role] ?? 0) ? a : b);
          setRole(best.role as AppRole);
        } else {
          setRole('viewer');
        }
        setIsLoading(false);
      }
    }

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = role === 'admin';
  const isAnalyst = role === 'analyst';
  const isEditor = role === 'editor';
  const isAuditor = role === 'auditor';
  const isViewer = role === 'viewer';

  const canWrite = isAdmin || isAnalyst || isEditor;
  const canManage = isAdmin;

  return { role, isLoading, isAdmin, isAnalyst, isEditor, isAuditor, isViewer, canWrite, canManage };
}
