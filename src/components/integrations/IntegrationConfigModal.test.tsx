import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntegrationConfigModal } from './IntegrationConfigModal';
import { PROVIDER_META } from './providerMeta';
import type { Integration } from '@/hooks/use-integrations';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function makeIntegration(overrides: Partial<Integration> = {}): Integration {
  return {
    id: 'int-1',
    provider: 'slack',
    name: 'Slack',
    category: 'Communication',
    status: 'disconnected',
    config: null,
    last_synced_at: null,
    controls_mapped: 0,
    error_message: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('IntegrationConfigModal', () => {
  const onClose = vi.fn();
  const onSave = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <IntegrationConfigModal integration={makeIntegration()} open={false} onClose={onClose} onSave={onSave} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for unknown provider', () => {
    const { container } = render(
      <IntegrationConfigModal integration={makeIntegration({ provider: 'unknown' })} open={true} onClose={onClose} onSave={onSave} />
    );
    expect(container.firstChild).toBeNull();
  });

  for (const [provider, meta] of Object.entries(PROVIDER_META)) {
    it(`renders config fields for ${provider}`, () => {
      render(
        <IntegrationConfigModal
          integration={makeIntegration({ provider, name: meta.label })}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />
      );
      expect(screen.getByRole('heading', { name: (content) => content.startsWith(meta.label) })).toBeInTheDocument();
      expect(screen.getByText(meta.description)).toBeInTheDocument();
      for (const field of meta.fields) {
        expect(screen.getByPlaceholderText(field.placeholder)).toBeInTheDocument();
      }
    });
  }

  it('calls onSave when Save is clicked with all fields filled', async () => {
    const integration = makeIntegration({ provider: 'slack', config: null });
    render(
      <IntegrationConfigModal integration={integration} open={true} onClose={onClose} onSave={onSave} />
    );

    const urlInput = screen.getByPlaceholderText('https://hooks.slack.com/services/…');
    const channelInput = screen.getByPlaceholderText('#security-alerts');

    fireEvent.change(urlInput, { target: { value: 'https://hooks.slack.com/services/T00/B00/xxx' } });
    fireEvent.change(channelInput, { target: { value: '#security' } });

    fireEvent.click(screen.getByText('Save & Connect'));

    expect(onSave).toHaveBeenCalledWith({
      webhook_url: 'https://hooks.slack.com/services/T00/B00/xxx',
      channel: '#security',
    });
  });

  it('disables Save button when required fields are empty', () => {
    render(
      <IntegrationConfigModal
        integration={makeIntegration({ provider: 'slack', config: null })}
        open={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Save & Connect')).toBeDisabled();
  });

  it('shows Test Connection button for testable providers', () => {
    for (const [provider] of Object.entries(PROVIDER_META).filter(([, m]) => m.testable)) {
      const { unmount } = render(
        <IntegrationConfigModal
          integration={makeIntegration({ provider })}
          open={true}
          onClose={onClose}
          onSave={onSave}
        />
      );
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
      unmount();
    }
  });

  it('disables Test Connection when URL field is empty', () => {
    render(
      <IntegrationConfigModal
        integration={makeIntegration({ provider: 'slack', config: null })}
        open={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText('Test Connection')).toBeDisabled();
  });

  it('calls onClose when clicking Cancel', () => {
    render(
      <IntegrationConfigModal integration={makeIntegration()} open={true} onClose={onClose} onSave={onSave} />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('pre-fills values from existing config', () => {
    const config = { webhook_url: 'https://hooks.slack.com/services/T00/B00/xxx', channel: '#general' };
    render(
      <IntegrationConfigModal
        integration={makeIntegration({ provider: 'slack', config })}
        open={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    const urlInput = screen.getByPlaceholderText('https://hooks.slack.com/services/…') as HTMLInputElement;
    expect(urlInput.value).toBe('https://hooks.slack.com/services/T00/B00/xxx');

    const channelInput = screen.getByPlaceholderText('#security-alerts') as HTMLInputElement;
    expect(channelInput.value).toBe('#general');
  });
});
