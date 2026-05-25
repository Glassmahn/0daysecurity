import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { logAudit } from '@/lib/audit-logger';
import type { AuditEntityType } from '@/lib/audit-logger';
import { sanitizeError } from '@/lib/errors';
import { captureError } from '@/lib/monitoring';

type CrudTable = 'controls' | 'incidents' | 'evidence' | 'alerts' | 'vendors' | 'frameworks' | 'risks' | 'tests' | 'assets' | 'policies' | 'knowledge_base' | 'personnel' | 'compliance_snapshots' | 'trust_portal_shares' | 'policy_acknowledgments' | 'vendor_assessments' | 'access_review_campaigns' | 'access_review_assignments' | 'custom_field_definitions' | 'custom_field_values' | 'audits' | 'audit_findings' | 'audit_evidence_requests' | 'sso_configurations' | 'training_courses' | 'training_assignments' | 'report_schedules';

const tablesWithOrgId: Set<CrudTable> = new Set([
  'controls', 'incidents', 'evidence', 'alerts', 'vendors', 'risks', 'tests', 'assets', 'policies',
  'knowledge_base', 'personnel', 'compliance_snapshots', 'trust_portal_shares', 'policy_acknowledgments',
  'vendor_assessments', 'access_review_campaigns', 'access_review_assignments', 'custom_field_definitions',
  'custom_field_values', 'audits', 'audit_findings', 'audit_evidence_requests', 'sso_configurations',
  'training_assignments', 'report_schedules',
]);

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
  personnel: 'personnel',
  compliance_snapshots: 'compliance_snapshot',
  trust_portal_shares: 'trust_portal_share',
  policy_acknowledgments: 'policy_acknowledgment',
  vendor_assessments: 'vendor_assessment',
  access_review_campaigns: 'access_review_campaign',
  access_review_assignments: 'access_review_assignment',
  custom_field_definitions: 'custom_field_definition',
  custom_field_values: 'custom_field_value',
  audits: 'audit',
  audit_findings: 'audit_finding',
  audit_evidence_requests: 'audit_evidence_request',
  sso_configurations: 'sso_configuration',
  training_courses: 'training_course',
  training_assignments: 'training_assignment',
  report_schedules: 'report_schedule',
};

interface UseSupabaseCrudReturn<T extends CrudTable> {
  data: Tables<T>[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  insert: (record: Record<string, unknown>) => Promise<boolean>;
  update: (id: string, record: Record<string, unknown>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  bulkRemove: (ids: string[]) => Promise<boolean>;
  bulkUpdate: (ids: string[], record: Record<string, unknown>) => Promise<boolean>;
}

export function useSupabaseCrud<T extends CrudTable>(
  table: T,
  orderBy: string = 'created_at',
  ascending: boolean = false,
  orgId?: string | null
): UseSupabaseCrudReturn<T> {
  const [data, setData] = useState<Tables<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const entityType = tableToEntityType[table];
  const filterByOrg = tablesWithOrgId.has(table) && orgId;

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from(table).select('*');
      if (filterByOrg) {
        query = query.eq('org_id' as never, orgId as never);
      }
      const { data: rows, error: err } = await query.order(orderBy, { ascending });
      if (err) {
        captureError(err, { table, operation: 'fetch' });
        setError(sanitizeError(err));
        setLoading(false);
        return;
      }
      setData((rows ?? []) as Tables<T>[]);
    } catch (err) {
      captureError(err, { table, operation: 'fetch' });
      setError(sanitizeError(err));
    }
    setLoading(false);
  }, [table, orderBy, ascending, filterByOrg, orgId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const insert = useCallback(async (record: Record<string, unknown>) => {
    try {
      const enriched = { ...record } as Record<string, unknown>;
      if (filterByOrg) {
        enriched.org_id = orgId;
      }
      const { data: inserted, error: err } = await supabase.from(table).insert(enriched as never).select('id').maybeSingle();
      if (err) {
        captureError(err, { table, operation: 'insert' });
        toast.error(`Failed to create: ${sanitizeError(err)}`);
        return false;
      }
      toast.success('Record created successfully');
      logAudit({
        action: 'create',
        entity_type: entityType,
        entity_id: (inserted as Tables<T> | null)?.id,
        details: { table, title: record.title ?? record.name ?? undefined },
      });
      await refetch();
      return true;
    } catch (err) {
      captureError(err, { table, operation: 'insert' });
      toast.error(`Failed to create: ${sanitizeError(err)}`);
      return false;
    }
  }, [table, entityType, refetch, filterByOrg, orgId]);

  const update = useCallback(async (id: string, record: Record<string, unknown>) => {
    let snapshot: Tables<T>[] | null = null;
    setData(prev => { snapshot = prev; return prev.map((item: Tables<T>) =>
      ((item as unknown) as Record<string, unknown>).id === (id as unknown)
        ? ({ ...item, ...record } as Tables<T>)
        : item
    ); });

    try {
      let query = supabase.from(table).update(record as never).eq('id' as never, id);
      if (filterByOrg) {
        query = query.eq('org_id' as never, orgId as never);
      }
      const { error: err } = await query;
      if (err) {
        setData(snapshot ?? []);
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
    } catch (err) {
      setData(snapshot ?? []);
      captureError(err, { table, operation: 'update', id });
      toast.error(`Failed to update: ${sanitizeError(err)}`);
      return false;
    }
      }, [table, entityType, refetch, filterByOrg, orgId]);

  const remove = useCallback(async (id: string) => {
    try {
      let query = supabase.from(table).delete().eq('id' as never, id);
      if (filterByOrg) {
        query = query.eq('org_id' as never, orgId as never);
      }
      const { error: err } = await query;
      if (err) {
        captureError(err, { table, operation: 'delete', id });
        toast.error(`Failed to delete: ${sanitizeError(err)}`);
        return false;
      }
      toast.success('Record deleted successfully');
      logAudit({ action: 'delete', entity_type: entityType, entity_id: id, details: { table } });
      await refetch();
      return true;
    } catch (err) {
      captureError(err, { table, operation: 'delete', id });
      toast.error(`Failed to delete: ${sanitizeError(err)}`);
      return false;
    }
    }, [table, entityType, refetch, filterByOrg, orgId]);

  const bulkRemove = useCallback(async (ids: string[]) => {
    try {
      let query = supabase.from(table).delete().in('id' as never, ids as never);
      if (filterByOrg) {
        query = query.eq('org_id' as never, orgId as never);
      }
      const { error: err } = await query;
      if (err) {
        captureError(err, { table, operation: 'bulkDelete', count: ids.length });
        toast.error(`Failed to delete: ${sanitizeError(err)}`);
        return false;
      }
      toast.success(`${ids.length} record${ids.length > 1 ? 's' : ''} deleted`);
      logAudit({ action: 'delete', entity_type: entityType, entity_id: ids.join(','), details: { table, bulk: true, count: ids.length } });
      await refetch();
      return true;
    } catch (err) {
      captureError(err, { table, operation: 'bulkDelete', count: ids.length });
      toast.error(`Failed to delete: ${sanitizeError(err)}`);
      return false;
    }
    }, [table, entityType, refetch, filterByOrg, orgId]);

  const bulkUpdate = useCallback(async (ids: string[], record: Record<string, unknown>) => {
    try {
      let query = supabase.from(table).update(record as never).in('id' as never, ids as never);
      if (filterByOrg) {
        query = query.eq('org_id' as never, orgId as never);
      }
      const { error: err } = await query;
      if (err) {
        captureError(err, { table, operation: 'bulkUpdate', count: ids.length });
        toast.error(`Failed to update: ${sanitizeError(err)}`);
        return false;
      }
      toast.success(`${ids.length} record${ids.length > 1 ? 's' : ''} updated`);
      logAudit({ action: 'update', entity_type: entityType, entity_id: ids.join(','), details: { table, fields: Object.keys(record), bulk: true, count: ids.length } });
      await refetch();
      return true;
    } catch (err) {
      captureError(err, { table, operation: 'bulkUpdate', count: ids.length });
      toast.error(`Failed to update: ${sanitizeError(err)}`);
      return false;
    }
      }, [table, entityType, refetch, filterByOrg, orgId]);

  return { data, loading, error, refetch, insert, update, remove, bulkRemove, bulkUpdate };
}
