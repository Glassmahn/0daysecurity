import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeError } from '@/lib/errors';
import { captureError } from '@/lib/monitoring';

export interface NotificationPrefs {
  critical_alerts_email: boolean;
  critical_alerts_slack: boolean;
  high_alerts_email: boolean;
  high_alerts_slack: boolean;
  evidence_expiring_email: boolean;
  evidence_expiring_slack: boolean;
  access_review_email: boolean;
  access_review_slack: boolean;
  policy_review_email: boolean;
  policy_review_slack: boolean;
  weekly_digest_email: boolean;
  weekly_digest_slack: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  critical_alerts_email: true,
  critical_alerts_slack: true,
  high_alerts_email: true,
  high_alerts_slack: false,
  evidence_expiring_email: true,
  evidence_expiring_slack: false,
  access_review_email: true,
  access_review_slack: true,
  policy_review_email: false,
  policy_review_slack: false,
  weekly_digest_email: true,
  weekly_digest_slack: false,
};

export function useNotificationPrefs() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      const { data, error: err } = await supabase
        .from('notification_preferences')
        .select('id, user_id, critical_alerts_email, critical_alerts_slack, high_alerts_email, high_alerts_slack, evidence_expiring_email, evidence_expiring_slack, access_review_email, access_review_slack, policy_review_email, policy_review_slack, weekly_digest_email, weekly_digest_slack, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (err) {
        captureError(err, { operation: 'fetch_notification_prefs' });
        setError(sanitizeError(err));
      } else if (data) {
        // Strip id/user_id/timestamps — keep only boolean columns.
        const { id: _id, user_id: _uid, created_at: _c, updated_at: _u, ...rest } = data;
        setPrefs(rest as NotificationPrefs);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const save = useCallback(async (next: NotificationPrefs): Promise<boolean> => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return false; }

    const { error: err } = await (supabase as any)
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...next }, { onConflict: 'user_id' });

    setSaving(false);
    if (err) {
      captureError(err, { operation: 'upsert_notification_prefs' });
      setError(sanitizeError(err));
      return false;
    }
    setPrefs(next);
    return true;
  }, []);

  return { prefs, loading, saving, error, save };
}
