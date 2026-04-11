import { Search, Bell, User } from 'lucide-react';

export function TopBar() {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card">
      {/* Search */}
      <div className="flex items-center gap-2 bg-input rounded-md px-3 py-1.5 w-80">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search controls, alerts, assets…  ⌘K"
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Org name */}
        <span className="text-xs text-muted-foreground hidden sm:block">Meridian Health Tech</span>

        {/* Notifications */}
        <button className="relative p-1.5 rounded-md hover:bg-accent transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-severity-critical text-[9px] font-bold text-primary-foreground flex items-center justify-center">
            3
          </span>
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2 hover:bg-accent rounded-md px-2 py-1 transition-colors">
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm text-foreground hidden sm:block">Sarah Chen</span>
        </button>
      </div>
    </header>
  );
}
