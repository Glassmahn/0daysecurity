import { Search, Bell, User, Sun, Moon, Menu, LogOut } from 'lucide-react';
import { CommandSearch } from './CommandSearch';
import { useThemeStore } from '@/hooks/use-theme';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { useAuth } from '@/hooks/use-auth';
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

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card">
        <div className="flex items-center gap-3">
          <button
            onClick={sidebarToggle}
            className="p-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center gap-2 bg-input rounded-md px-3 py-1.5 w-48 sm:w-80 cursor-pointer hover:bg-accent transition-colors"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground flex-1 text-left truncate">Search controls, alerts, assets…</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] text-muted-foreground font-mono">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent transition-colors group"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </button>

          <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-severity-critical text-[9px] font-bold text-primary-foreground flex items-center justify-center">
              3
            </span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:bg-accent rounded-lg px-2 py-1.5 transition-colors">
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">{initials}</span>
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:block truncate max-w-[120px]">
                  {displayName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
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
