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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cancelled) {
        setRole(data?.role ?? 'viewer');
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
  const isAuditor = role === 'auditor';
  const isViewer = role === 'viewer';

  const canWrite = isAdmin || isAnalyst;
  const canManage = isAdmin;

  return { role, isLoading, isAdmin, isAnalyst, isAuditor, isViewer, canWrite, canManage };
}
