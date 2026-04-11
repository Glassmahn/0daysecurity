import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type SupabaseTable = 'controls' | 'incidents' | 'evidence' | 'alerts' | 'vendors' | 'frameworks' | 'knowledge_base';

export function useSupabaseTable<T extends SupabaseTable>(
  table: T,
  orderBy: string = 'created_at',
  ascending: boolean = false
) {
  const [data, setData] = useState<Tables<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      const { data: rows, error: err } = await supabase
        .from(table)
        .select('*')
        .order(orderBy, { ascending });
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setData((rows ?? []) as Tables<T>[]);
      setLoading(false);
    }
    fetch();
    return () => { cancelled = true; };
  }, [table, orderBy, ascending]);

  return { data, loading, error };
}
