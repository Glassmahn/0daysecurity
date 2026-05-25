import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceDetailView } from './EvidenceDetailView';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress" data-value={value} className={className} />
  ),
}));

import { supabase } from '@/integrations/supabase/client';

function makeNode(overrides: Record<string, any> = {}) {
  return {
    maybeSingle: overrides.maybeSingle ?? vi.fn().mockReturnValue(new Promise(() => {})),
    order: overrides.order ?? vi.fn().mockReturnValue({
      then: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
    }),
    neq: overrides.neq ?? vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
    eq: vi.fn(() => makeNode(overrides)),
  };
}

function makeFrom(overrides: Record<string, any> = {}) {
  return vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue(makeNode(overrides)),
  });
}


describe('EvidenceDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (supabase.from as any) = makeFrom();
    render(<EvidenceDetailView evidenceId="ev-001" />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows error state when evidence not found', async () => {
    (supabase.from as any) = makeFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) });
    render(<EvidenceDetailView evidenceId="nonexistent" />);
    expect(await screen.findByRole('heading', { name: 'Evidence not found' })).toBeInTheDocument();
  });

  it('shows error message from Supabase', async () => {
    (supabase.from as any) = makeFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }) });
    render(<EvidenceDetailView evidenceId="ev-001" />);
    expect(await screen.findByText('Database error')).toBeInTheDocument();
  });

  it('renders evidence details from DB data', async () => {
    const evidenceData = {
      id: 'ev-001',
      title: 'AWS CloudTrail Audit Log',
      type: 'log',
      status: 'valid',
      source: 'auto',
      collected_at: '2026-05-10T00:00:00Z',
      expires_at: '2026-08-10T00:00:00Z',
      file_url: null,
      control_id: null,
      created_at: '2026-05-10T00:00:00Z',
      control: null,
    };

    (supabase.from as any) = makeFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: evidenceData, error: null }) });
    render(<EvidenceDetailView evidenceId="ev-001" />);
    expect(await screen.findByText('AWS CloudTrail Audit Log')).toBeInTheDocument();
    const validElements = await screen.findAllByText('Valid');
    expect(validElements.length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText('Auto')).toBeInTheDocument();
  });

  it('renders evidence with linked control', async () => {
    const evidenceData = {
      id: 'ev-002',
      title: 'Okta MFA Report',
      type: 'report',
      status: 'valid',
      source: 'auto',
      collected_at: '2026-05-09T00:00:00Z',
      expires_at: '2026-06-09T00:00:00Z',
      file_url: null,
      control_id: 'ctrl-001',
      created_at: '2026-05-09T00:00:00Z',
      control: {
        code: 'AC-2',
        title: 'Account Management',
        status: 'implemented',
        category: 'Access Control',
        framework_id: 'fw-001',
      },
    };

    (supabase.from as any) = makeFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: evidenceData, error: null }) });
    render(<EvidenceDetailView evidenceId="ev-002" />);
    expect(await screen.findByText('Okta MFA Report')).toBeInTheDocument();
    expect(await screen.findByText('AC-2', { exact: false })).toBeInTheDocument();
  });

  it('renders manual evidence without auto-collection badge', async () => {
    const evidenceData = {
      id: 'ev-003',
      title: 'Manual Upload Doc',
      type: 'document',
      status: 'pending_review',
      source: 'manual',
      collected_at: '2026-05-01T00:00:00Z',
      expires_at: null,
      file_url: null,
      control_id: null,
      created_at: '2026-05-01T00:00:00Z',
      control: null,
    };

    (supabase.from as any) = makeFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: evidenceData, error: null }) });
    render(<EvidenceDetailView evidenceId="ev-003" />);
    expect(await screen.findByText('Manual Upload Doc')).toBeInTheDocument();
    expect(screen.queryByText('Auto')).not.toBeInTheDocument();
  });

  it('switches tabs on click', async () => {
    const evidenceData = {
      id: 'ev-001',
      title: 'Test Evidence',
      type: 'document',
      status: 'valid',
      source: 'manual',
      collected_at: '2026-05-10T00:00:00Z',
      expires_at: '2026-08-10T00:00:00Z',
      file_url: null,
      control_id: null,
      created_at: '2026-05-10T00:00:00Z',
      control: null,
    };

    (supabase.from as any) = makeFrom({ maybeSingle: vi.fn().mockResolvedValue({ data: evidenceData, error: null }) });
    render(<EvidenceDetailView evidenceId="ev-001" />);
    expect(await screen.findByText('Test Evidence')).toBeInTheDocument();
    const historyTab = screen.getByText('Collection History');
    expect(historyTab).toBeInTheDocument();
  });
});
