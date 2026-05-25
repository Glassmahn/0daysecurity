import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIntegrations } from './use-integrations';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('@/lib/errors', () => ({ sanitizeError: (e: any) => e.message ?? String(e) }));
vi.mock('@/lib/monitoring', () => ({ captureError: vi.fn() }));
vi.mock('@/lib/audit-logger', () => ({ logAudit: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { supabase } from '@/integrations/supabase/client';

const MOCK_DATA = [
  { id: 'int-1', provider: 'slack', name: 'Slack', category: 'Communication', status: 'connected', config: { webhook_url: 'x' }, last_synced_at: '2026-05-01T00:00:00Z', controls_mapped: 3, error_message: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z' },
  { id: 'int-2', provider: 'okta', name: 'Okta', category: 'Identity', status: 'disconnected', config: null, last_synced_at: null, controls_mapped: 0, error_message: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

function mockSupabaseFrom(result: unknown) {
  const orderFn2 = vi.fn().mockResolvedValue({ data: result, error: null });
  const orderFn1 = vi.fn().mockReturnValue({ order: orderFn2 });
  const selectChain = vi.fn().mockReturnValue({ order: orderFn1 });
  const fromMock = vi.fn().mockReturnValue({ select: selectChain });
  (supabase as any).from = fromMock;
  return { fromMock, selectChain, orderChain: orderFn2 };
}

describe('useIntegrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches integrations on mount', async () => {
    mockSupabaseFrom(MOCK_DATA);

    const { result } = renderHook(() => useIntegrations());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.integrations).toHaveLength(2);
    expect(result.current.integrations[0].provider).toBe('slack');
    expect(result.current.integrations[1].provider).toBe('okta');
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    const orderFn2 = vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection failed' } });
    const orderFn1 = vi.fn().mockReturnValue({ order: orderFn2 });
    const selectChain = vi.fn().mockReturnValue({ order: orderFn1 });
    const fromMock = vi.fn().mockReturnValue({ select: selectChain });
    (supabase as any).from = fromMock;

    const { result } = renderHook(() => useIntegrations());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Connection failed');
    expect(result.current.integrations).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    mockSupabaseFrom(null);

    const { result } = renderHook(() => useIntegrations());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.integrations).toEqual([]);
  });

  it('connect updates status to connected', async () => {
    mockSupabaseFrom(MOCK_DATA);

    const updateChain = vi.fn().mockResolvedValue({ error: null });
    const eqChain = vi.fn().mockReturnValue({ eq: updateChain });
    const updateMock = vi.fn().mockReturnValue({ eq: eqChain });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock, select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: MOCK_DATA, error: null }) }) }) });
    (supabase as any).from = fromMock;

    const { result } = renderHook(() => useIntegrations());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await result.current.connect('int-1', 'slack', { webhook_url: 'https://hooks.slack.com/xxx' });
    expect(ok).toBe(true);
  });

  it('connect returns false on error', async () => {
    mockSupabaseFrom(MOCK_DATA);

    const eqChain = vi.fn().mockResolvedValue({ error: { message: 'Update failed' } });
    const updateMock = vi.fn().mockReturnValue({ eq: eqChain });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock, select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: MOCK_DATA, error: null }) }) }) });
    (supabase as any).from = fromMock;

    const { result } = renderHook(() => useIntegrations());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await result.current.connect('int-1', 'slack', { webhook_url: 'x' });
    expect(ok).toBe(false);
  });

  it('disconnect resets integration to disconnected', async () => {
    mockSupabaseFrom(MOCK_DATA);

    const eqChain = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqChain });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock, select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: MOCK_DATA, error: null }) }) }) });
    (supabase as any).from = fromMock;

    const { result } = renderHook(() => useIntegrations());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const ok = await result.current.disconnect('int-1', 'slack');
    expect(ok).toBe(true);
  });

  it('setError updates status to error', async () => {
    mockSupabaseFrom(MOCK_DATA);

    const eqChain = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: eqChain });
    const fromMock = vi.fn().mockReturnValue({ update: updateMock, select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: MOCK_DATA, error: null }) }) }) });
    (supabase as any).from = fromMock;

    const { result } = renderHook(() => useIntegrations());

    await waitFor(() => expect(result.current.loading).toBe(false));
    await expect(result.current.setError('int-1', 'Something broke')).resolves.not.toThrow();
  });

  it('refetch reloads data', async () => {
    mockSupabaseFrom(MOCK_DATA);

    const { result } = renderHook(() => useIntegrations());

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockSupabaseFrom([MOCK_DATA[0]]);
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.integrations).toHaveLength(1);
    });
  });

  it('returns the correct return type shape', async () => {
    mockSupabaseFrom(MOCK_DATA);

    const { result } = renderHook(() => useIntegrations());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toHaveProperty('integrations');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('connect');
    expect(result.current).toHaveProperty('disconnect');
    expect(result.current).toHaveProperty('setError');
    expect(result.current).toHaveProperty('refetch');
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
    expect(typeof result.current.refetch).toBe('function');
  });
});
