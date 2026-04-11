import { useRole } from '@/hooks/use-role-context';
import type { ReactNode } from 'react';
import type { AppRole } from '@/hooks/use-user-role';

interface WriteGuardProps {
  children: ReactNode;
  /** If not provided, defaults to admin + analyst */
  allowedRoles?: AppRole[];
  /** What to render when access is denied. Defaults to nothing. */
  fallback?: ReactNode;
}

/** Renders children only if the current user has write access. */
export function WriteGuard({ children, allowedRoles, fallback = null }: WriteGuardProps) {
  const { role, canWrite } = useRole();
  
  if (allowedRoles) {
    return role && allowedRoles.includes(role) ? <>{children}</> : <>{fallback}</>;
  }
  
  return canWrite ? <>{children}</> : <>{fallback}</>;
}

/** Renders children only if the current user is admin. */
export function AdminGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isAdmin } = useRole();
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
}

/** Shows access denied message for unauthorized route access. */
export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { role, isLoading } = useRole();
  
  if (isLoading) return null;
  
  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-semibold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your role ({role ?? 'unknown'}) doesn't have permission to access this page.
            Contact an administrator to request access.
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
