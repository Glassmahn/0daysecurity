import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type CrudTable = 'controls' | 'incidents' | 'evidence' | 'alerts' | 'vendors' | 'frameworks' | 'risks' | 'tests' | 'assets' | 'policies' | 'knowledge_base';

export function useSupabaseCrud<T extends CrudTable>(
  table: T,
  orderBy: string = 'created_at',
  ascending: boolean = false
) {
  const [data, setData] = useState<Tables<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setData((rows ?? []) as Tables<T>[]);
    setLoading(false);
  }, [table, orderBy, ascending]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const insert = useCallback(async (record: Record<string, unknown>) => {
    const { error: err } = await supabase.from(table).insert(record as never);
    if (err) {
      toast.error(`Failed to create: ${err.message}`);
      return false;
    }
    toast.success('Record created successfully');
    await refetch();
    return true;
  }, [table, refetch]);

  const update = useCallback(async (id: string, record: Record<string, unknown>) => {
    const { error: err } = await (supabase.from(table).update(record as never) as any).eq('id', id);
    if (err) {
      toast.error(`Failed to update: ${err.message}`);
      return false;
    }
    toast.success('Record updated successfully');
    await refetch();
    return true;
  }, [table, refetch]);

  const remove = useCallback(async (id: string) => {
    const { error: err } = await (supabase.from(table).delete() as any).eq('id', id);
    if (err) {
      toast.error(`Failed to delete: ${err.message}`);
      return false;
    }
    toast.success('Record deleted successfully');
    await refetch();
    return true;
  }, [table, refetch]);

  const bulkRemove = useCallback(async (ids: string[]) => {
    const { error: err } = await (supabase.from(table).delete() as any).in('id', ids);
    if (err) {
      toast.error(`Failed to delete: ${err.message}`);
      return false;
    }
    toast.success(`${ids.length} record${ids.length > 1 ? 's' : ''} deleted`);
    await refetch();
    return true;
  }, [table, refetch]);

  const bulkUpdate = useCallback(async (ids: string[], record: Record<string, unknown>) => {
    const { error: err } = await (supabase.from(table).update(record as never) as any).in('id', ids);
    if (err) {
      toast.error(`Failed to update: ${err.message}`);
      return false;
    }
    toast.success(`${ids.length} record${ids.length > 1 ? 's' : ''} updated`);
    await refetch();
    return true;
  }, [table, refetch]);

  return { data, loading, error, refetch, insert, update, remove, bulkRemove, bulkUpdate };
}
