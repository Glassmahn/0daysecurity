import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { logAudit } from '@/lib/audit-logger';
import type { AuditEntityType } from '@/lib/audit-logger';
import { sanitizeError } from '@/lib/errors';
import { captureError } from '@/lib/monitoring';

type CrudTable = 'controls' | 'incidents' | 'evidence' | 'alerts' | 'vendors' | 'frameworks' | 'risks' | 'tests' | 'assets' | 'policies' | 'knowledge_base';

const tableToEntityType: Record<CrudTable, AuditEntityType> = {
  controls: 'control',
  incidents: 'incident',
  evidence: 'evidence',
  alerts: 'alert',
  vendors: 'vendor',
  frameworks: 'framework',
  risks: 'risk',
  tests: 'test',
  assets: 'asset',
  policies: 'policy',
  knowledge_base: 'kb_article',
};

export function useSupabaseCrud<T extends CrudTable>(
  table: T,
  orderBy: string = 'created_at',
  ascending: boolean = false
) {
  const [data, setData] = useState<Tables<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const entityType = tableToEntityType[table];

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data: rows, error: err } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending });
    if (err) {
      captureError(err, { table, operation: 'fetch' });
      setError(sanitizeError(err));
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
    const { data: inserted, error: err } = await supabase.from(table).insert(record as never).select('id').maybeSingle();
    if (err) {
      captureError(err, { table, operation: 'insert' });
      toast.error(`Failed to create: ${sanitizeError(err)}`);
      return false;
    }
    toast.success('Record created successfully');
    logAudit({
      action: 'create',
      entity_type: entityType,
      entity_id: (inserted as any)?.id,
      details: { table, title: record.title ?? record.name ?? undefined },
    });
    await refetch();
    return true;
  }, [table, entityType, refetch]);

  const update = useCallback(async (id: string, record: Record<string, unknown>) => {
    const { error: err } = await (supabase.from(table).update(record as never) as any).eq('id', id);
    if (err) {
      captureError(err, { table, operation: 'update', id });
      toast.error(`Failed to update: ${sanitizeError(err)}`);
      return false;
    }
    toast.success('Record updated successfully');
    logAudit({
      action: 'update',
      entity_type: entityType,
      entity_id: id,
      details: { table, fields: Object.keys(record) },
    });
    await refetch();
    return true;
  }, [table, entityType, refetch]);

  const remove = useCallback(async (id: string) => {
    const { error: err } = await (supabase.from(table).delete() as any).eq('id', id);
    if (err) {
      captureError(err, { table, operation: 'delete', id });
      toast.error(`Failed to delete: ${sanitizeError(err)}`);
      return false;
    }
    toast.success('Record deleted successfully');
    logAudit({ action: 'delete', entity_type: entityType, entity_id: id, details: { table } });
    await refetch();
    return true;
  }, [table, entityType, refetch]);

  const bulkRemove = useCallback(async (ids: string[]) => {
    const { error: err } = await (supabase.from(table).delete() as any).in('id', ids);
    if (err) {
      captureError(err, { table, operation: 'bulkDelete', count: ids.length });
      toast.error(`Failed to delete: ${sanitizeError(err)}`);
      return false;
    }
    toast.success(`${ids.length} record${ids.length > 1 ? 's' : ''} deleted`);
    ids.forEach(id => logAudit({ action: 'delete', entity_type: entityType, entity_id: id, details: { table, bulk: true } }));
    await refetch();
    return true;
  }, [table, entityType, refetch]);

  const bulkUpdate = useCallback(async (ids: string[], record: Record<string, unknown>) => {
    const { error: err } = await (supabase.from(table).update(record as never) as any).in('id', ids);
    if (err) {
      captureError(err, { table, operation: 'bulkUpdate', count: ids.length });
      toast.error(`Failed to update: ${sanitizeError(err)}`);
      return false;
    }
    toast.success(`${ids.length} record${ids.length > 1 ? 's' : ''} updated`);
    ids.forEach(id => logAudit({ action: 'update', entity_type: entityType, entity_id: id, details: { table, fields: Object.keys(record), bulk: true } }));
    await refetch();
    return true;
  }, [table, entityType, refetch]);

  return { data, loading, error, refetch, insert, update, remove, bulkRemove, bulkUpdate };
}
