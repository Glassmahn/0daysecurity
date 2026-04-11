import { createContext, useContext, type ReactNode } from 'react';
import { useUserRole, type AppRole } from '@/hooks/use-user-role';

interface RoleContextValue {
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAnalyst: boolean;
  isAuditor: boolean;
  isViewer: boolean;
  canWrite: boolean;
  canManage: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  isLoading: true,
  isAdmin: false,
  isAnalyst: false,
  isAuditor: false,
  isViewer: false,
  canWrite: false,
  canManage: false,
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const value = useUserRole();
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}
