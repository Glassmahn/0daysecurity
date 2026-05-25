import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WriteGuard, AdminGuard, RouteGuard } from './RoleGuards';

// Mock the role context so tests are isolated from Supabase
vi.mock('@/hooks/use-role-context', () => ({
  useRole: vi.fn(),
}));

import { useRole } from '@/hooks/use-role-context';

type RoleValue = {
  role: 'admin' | 'analyst' | 'auditor' | 'viewer' | null;
  isAdmin: boolean;
  isAnalyst: boolean;
  isEditor: boolean;
  isAuditor: boolean;
  isViewer: boolean;
  canWrite: boolean;
  canManage: boolean;
  isLoading: boolean;
};

function mockRole(overrides: Partial<RoleValue>) {
  const defaults: RoleValue = {
    role: null,
    isAdmin: false,
    isAnalyst: false,
    isEditor: false,
    isAuditor: false,
    isViewer: false,
    canWrite: false,
    canManage: false,
    isLoading: false,
  };
  vi.mocked(useRole).mockReturnValue({ ...defaults, ...overrides });
}

// ─── WriteGuard ──────────────────────────────────────────────────────────────

describe('WriteGuard', () => {
  it('renders children for admin', () => {
    mockRole({ role: 'admin', isAdmin: true, canWrite: true, canManage: true });
    render(<WriteGuard><span>secret</span></WriteGuard>);
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('renders children for analyst', () => {
    mockRole({ role: 'analyst', isAnalyst: true, canWrite: true });
    render(<WriteGuard><span>secret</span></WriteGuard>);
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('renders nothing (default fallback) for auditor', () => {
    mockRole({ role: 'auditor', isAuditor: true });
    const { container } = render(<WriteGuard><span>secret</span></WriteGuard>);
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing (default fallback) for viewer', () => {
    mockRole({ role: 'viewer', isViewer: true });
    const { container } = render(<WriteGuard><span>secret</span></WriteGuard>);
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders custom fallback when access is denied', () => {
    mockRole({ role: 'viewer', isViewer: true });
    render(
      <WriteGuard fallback={<span>no access</span>}>
        <span>secret</span>
      </WriteGuard>
    );
    expect(screen.getByText('no access')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('respects custom allowedRoles — auditor allowed', () => {
    mockRole({ role: 'auditor', isAuditor: true });
    render(
      <WriteGuard allowedRoles={['admin', 'analyst', 'auditor']}>
        <span>auditor content</span>
      </WriteGuard>
    );
    expect(screen.getByText('auditor content')).toBeInTheDocument();
  });

  it('respects custom allowedRoles — analyst denied when only admin allowed', () => {
    mockRole({ role: 'analyst', isAnalyst: true, canWrite: true });
    render(
      <WriteGuard allowedRoles={['admin']}>
        <span>admin only</span>
      </WriteGuard>
    );
    expect(screen.queryByText('admin only')).not.toBeInTheDocument();
  });

  it('denies when role is null and custom allowedRoles provided', () => {
    mockRole({ role: null });
    const { container } = render(
      <WriteGuard allowedRoles={['admin']}>
        <span>content</span>
      </WriteGuard>
    );
    expect(container.firstChild).toBeNull();
  });
});

// ─── AdminGuard ──────────────────────────────────────────────────────────────

describe('AdminGuard', () => {
  it('renders children for admin', () => {
    mockRole({ role: 'admin', isAdmin: true, canWrite: true, canManage: true });
    render(<AdminGuard><span>admin panel</span></AdminGuard>);
    expect(screen.getByText('admin panel')).toBeInTheDocument();
  });

  it('renders nothing for analyst', () => {
    mockRole({ role: 'analyst', isAnalyst: true, canWrite: true });
    const { container } = render(<AdminGuard><span>admin panel</span></AdminGuard>);
    expect(screen.queryByText('admin panel')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for auditor', () => {
    mockRole({ role: 'auditor', isAuditor: true });
    const { container } = render(<AdminGuard><span>admin panel</span></AdminGuard>);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for viewer', () => {
    mockRole({ role: 'viewer', isViewer: true });
    const { container } = render(<AdminGuard><span>admin panel</span></AdminGuard>);
    expect(container.firstChild).toBeNull();
  });

  it('renders custom fallback for non-admin', () => {
    mockRole({ role: 'analyst', isAnalyst: true, canWrite: true });
    render(
      <AdminGuard fallback={<span>not admin</span>}>
        <span>admin panel</span>
      </AdminGuard>
    );
    expect(screen.getByText('not admin')).toBeInTheDocument();
    expect(screen.queryByText('admin panel')).not.toBeInTheDocument();
  });
});

// ─── RouteGuard ──────────────────────────────────────────────────────────────

describe('RouteGuard', () => {
  it('renders nothing while loading', () => {
    mockRole({ role: null, isLoading: true });
    const { container } = render(
      <RouteGuard allowedRoles={['admin']}>
        <span>protected</span>
      </RouteGuard>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders children when role is in allowedRoles', () => {
    mockRole({ role: 'admin', isAdmin: true, canWrite: true, canManage: true });
    render(
      <RouteGuard allowedRoles={['admin', 'analyst']}>
        <span>protected page</span>
      </RouteGuard>
    );
    expect(screen.getByText('protected page')).toBeInTheDocument();
  });

  it('renders access-denied UI when role is not in allowedRoles', () => {
    mockRole({ role: 'viewer', isViewer: true });
    render(
      <RouteGuard allowedRoles={['admin', 'analyst']}>
        <span>protected page</span>
      </RouteGuard>
    );
    expect(screen.queryByText('protected page')).not.toBeInTheDocument();
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });

  it('shows the current role name in the access-denied message', () => {
    mockRole({ role: 'auditor', isAuditor: true });
    render(
      <RouteGuard allowedRoles={['admin']}>
        <span>protected page</span>
      </RouteGuard>
    );
    expect(screen.getByText(/auditor/)).toBeInTheDocument();
  });

  it('renders access-denied UI when role is null and not loading', () => {
    mockRole({ role: null, isLoading: false });
    render(
      <RouteGuard allowedRoles={['admin']}>
        <span>protected page</span>
      </RouteGuard>
    );
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });
});
