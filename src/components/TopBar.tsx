import { Search, Bell, Sun, Moon, Menu, LogOut } from 'lucide-react';
import { CommandSearch } from './CommandSearch';
import { useThemeStore } from '@/hooks/use-theme';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from '@tanstack/react-router';
import { useSupabaseCrud } from '@/hooks/use-supabase-crud';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TopBar() {
  const { theme, toggleTheme } = useThemeStore();
  const sidebarToggle = useSidebarStore((s) => s.toggle);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: alerts } = useSupabaseCrud('alerts');
  const openAlertCount = alerts?.filter((a: { status: string }) => a.status === 'open').length ?? 0;

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="h-16 border-b border-border/60 flex items-center justify-between px-4 md:px-6 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={sidebarToggle}
            className="p-2 rounded-xl hover:bg-accent transition-all lg:hidden"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center gap-2 bg-surface/80 border border-border/50 rounded-xl px-3.5 py-2 w-48 sm:w-80 cursor-pointer hover:border-primary/30 hover:bg-surface transition-all group"
          >
            <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground flex-1 text-left truncate">Search anything…</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 bg-background border border-border/50 rounded-lg text-[10px] text-muted-foreground font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-accent transition-all group"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-muted-foreground group-hover:text-status-warning transition-colors" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </button>

          <button
            onClick={() => navigate({ to: '/alerts' })}
            className="relative p-2.5 rounded-xl hover:bg-accent transition-all group"
            title="View open alerts"
          >
            <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            {openAlertCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full gradient-primary text-[9px] font-bold text-white flex items-center justify-center shadow-glow">
                {openAlertCount > 99 ? '99+' : openAlertCount}
              </span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 hover:bg-accent rounded-xl px-2.5 py-1.5 transition-all ml-1">
                <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:block truncate max-w-[120px]">
                  {displayName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
              <div className="px-2.5 py-2">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive rounded-lg">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandSearch />
    </>
  );
}