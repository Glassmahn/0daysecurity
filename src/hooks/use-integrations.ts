import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeError } from '@/lib/errors';
import { captureError } from '@/lib/monitoring';
import { logAudit } from '@/lib/audit-logger';
import { toast } from 'sonner';

export interface Integration {
  id: string;
  provider: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  config: Record<string, string> | null;
  last_synced_at: string | null;
  controls_mapped: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await (supabase as any)
      .from('integrations')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    if (err) {
      captureError(err, { operation: 'fetch_integrations' });
      setError(sanitizeError(err));
    } else {
      setIntegrations((data ?? []) as Integration[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const connect = useCallback(async (id: string, provider: string, config: Record<string, string>): Promise<boolean> => {
    const { error: err } = await (supabase as any)
      .from('integrations')
      .update({
        status: 'connected',
        config,
        error_message: null,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (err) {
      captureError(err, { operation: 'connect_integration', provider });
      toast.error(`Failed to save: ${sanitizeError(err)}`);
      return false;
    }
    toast.success(`${provider} connected`);
    logAudit({ action: 'create', entity_type: 'vendor', entity_id: id, details: { action: 'integration_connect', provider } });
    await refetch();
    return true;
  }, [refetch]);

  const disconnect = useCallback(async (id: string, provider: string): Promise<boolean> => {
    const { error: err } = await (supabase as any)
      .from('integrations')
      .update({ status: 'disconnected', config: null, error_message: null, last_synced_at: null, controls_mapped: 0 })
      .eq('id', id);

    if (err) {
      captureError(err, { operation: 'disconnect_integration', provider });
      toast.error(`Failed to disconnect: ${sanitizeError(err)}`);
      return false;
    }
    toast.success(`${provider} disconnected`);
    logAudit({ action: 'delete', entity_type: 'vendor', entity_id: id, details: { action: 'integration_disconnect', provider } });
    await refetch();
    return true;
  }, [refetch]);

  const setError_ = useCallback(async (id: string, message: string) => {
    await (supabase as any)
      .from('integrations')
      .update({ status: 'error', error_message: message })
      .eq('id', id);
    await refetch();
  }, [refetch]);

  return { integrations, loading, error, refetch, connect, disconnect, setError: setError_ };
}
