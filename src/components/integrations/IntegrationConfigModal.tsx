import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import type { Integration } from '@/hooks/use-integrations';
import { PROVIDER_META } from './providerMeta';
import { toast } from 'sonner';

interface Props {
  integration: Integration;
  open: boolean;
  onClose: () => void;
  onSave: (config: Record<string, string>) => Promise<boolean>;
}

export function IntegrationConfigModal({ integration, open, onClose, onSave }: Props) {
  const meta = PROVIDER_META[integration.provider];
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failure' | null>(null);

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      meta?.fields.forEach(f => {
        initial[f.key] = (integration.config?.[f.key] as string) ?? '';
      });
      setValues(initial);
      setTestResult(null);
    }
  }, [open, integration.config, meta]);

  if (!open || !meta) return null;

  const allFilled = meta.fields.every(f => values[f.key]?.trim());

  async function handleSave() {
    setSaving(true);
    const ok = await onSave(values);
    setSaving(false);
    if (ok) onClose();
  }

  async function handleTest() {
    if (integration.provider !== 'slack') return;
    const webhookUrl = values['webhook_url'];
    if (!webhookUrl) {
      toast.error('Enter a webhook URL first');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '✅ ZeroDay Security test connection — webhook is working.' }),
      });
      setTestResult(res.ok ? 'success' : 'failure');
      if (res.ok) toast.success('Slack test message sent');
      else toast.error('Slack returned an error — check the webhook URL');
    } catch {
      setTestResult('failure');
      toast.error('Could not reach Slack — check the URL and network access');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">{meta.label} Configuration</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">&times;</button>
        </div>

        {/* Fields */}
        <div className="px-6 py-5 space-y-4">
          {meta.fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">{field.label}</label>
              <input
                type={field.type === 'password' ? 'password' : 'text'}
                value={values[field.key] ?? ''}
                onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
              {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
            </div>
          ))}

          <a
            href={meta.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            <ExternalLink className="h-3 w-3" />Setup guide
          </a>

          {/* Slack test connection */}
          {meta.testable && (
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleTest}
                disabled={testing || !values['webhook_url']?.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-xs font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Test Connection
              </button>
              {testResult === 'success' && <span className="flex items-center gap-1 text-xs text-status-passing"><CheckCircle className="h-3.5 w-3.5" />Connected</span>}
              {testResult === 'failure' && <span className="flex items-center gap-1 text-xs text-status-failing"><XCircle className="h-3.5 w-3.5" />Failed</span>}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
            Credentials are stored encrypted in your Supabase project and never leave your infrastructure.
            For production deployments, migrate secrets to Supabase Vault.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !allFilled}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
