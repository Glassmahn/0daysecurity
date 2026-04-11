import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'role_change' | 'view' | 'export' | 'revert';

export type AuditEntityType =
  | 'control' | 'evidence' | 'framework' | 'policy' | 'risk'
  | 'incident' | 'asset' | 'vendor' | 'test' | 'alert'
  | 'kb_article' | 'user' | 'role' | 'session';

export interface AuditLogEntry {
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(entry: AuditLogEntry) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('audit_logs').insert([{
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id ?? null,
    user_id: user.id,
    details: (entry.details ?? null) as import('@/integrations/supabase/types').Json,
  }]);
}
