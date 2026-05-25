import { Outlet, Navigate, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { AuditorBanner } from './AuditorBanner';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { useAuth } from '@/hooks/use-auth';
import { RoleProvider } from '@/hooks/use-role-context';
import { OrgProvider } from '@/hooks/use-org';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { Shield, Loader2 } from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();
  const { open, setOpen } = useSidebarStore();
  const { isAuthenticated, isLoading } = useAuth();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcuts(navigate, () => setShortcutsOpen(o => !o));

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-5 animate-fade-up">
          <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading ZeroDay…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <RoleProvider>
      <OrgProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium">
        Skip to content
      </a>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {open && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
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
          <AuditorBanner />
          <main id="main-content" className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      </OrgProvider>
    </RoleProvider>
  );
}