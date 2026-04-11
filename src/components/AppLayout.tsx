import { Outlet } from '@tanstack/react-router';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { useSidebarStore } from '@/hooks/use-sidebar-store';

export function AppLayout() {
  const { open, setOpen } = useSidebarStore();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AppSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
