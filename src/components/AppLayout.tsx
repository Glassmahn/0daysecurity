import { Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { useAuth } from '@/hooks/use-auth';
import { RoleProvider } from '@/hooks/use-role-context';
import { Dog, Loader2 } from 'lucide-react';

export function AppLayout() {
  const { open, setOpen } = useSidebarStore();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Dog className="h-10 w-10 text-primary animate-pulse" />
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <RoleProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {open && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto transition-transform duration-300 lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}
