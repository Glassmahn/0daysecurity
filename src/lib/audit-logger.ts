import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/monitoring';

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'role_change' | 'view' | 'export' | 'revert' | 'send_reminders' | 'offboarding_completed' | 'assign_personnel';

export type AuditEntityType =
  | 'control' | 'evidence' | 'framework' | 'policy' | 'risk'
  | 'incident' | 'asset' | 'vendor' | 'test' | 'alert'
  | 'kb_article' | 'user' | 'role' | 'session' | 'personnel' | 'compliance_snapshot' | 'trust_portal_share'
  | 'policy_acknowledgment' | 'vendor_assessment' | 'access_review_campaign' | 'access_review_assignment'
  | 'custom_field_definition' | 'custom_field_value'
  | 'audit' | 'audit_finding' | 'audit_evidence_request'
  | 'sso_configuration' | 'training_course' | 'training_assignment' | 'report_schedule';

export interface AuditLogEntry {
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string;
  details?: Record<string, unknown>;
}

export function logAudit(entry: AuditLogEntry) {
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { error } = await supabase.from('audit_logs').insert([{
        action: entry.action,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id ?? null,
        user_id: user.id,
        details: (entry.details ?? null) as import('@/integrations/supabase/types').Json,
      }]);
      if (error) captureError(error, { context: 'audit-logger insert' });
    } catch (err) {
      captureError(err, { context: 'audit-logger' });
    }
  })();
}
