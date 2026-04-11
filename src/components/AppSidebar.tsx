import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard, Shield, ListChecks, Paperclip, AlertTriangle, Flame,
  Monitor, Users, FileText, AlertOctagon, ClipboardCheck, BarChart3,
  Plug, Settings, ChevronLeft, ChevronRight, FlaskConical, Building2, BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { useRole } from '@/hooks/use-role-context';
import type { AppRole } from '@/hooks/use-user-role';

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  to: string;
  roles?: AppRole[];
  group?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', group: 'Overview' },
  { label: 'Frameworks', icon: Shield, to: '/frameworks', group: 'Compliance' },
  { label: 'Controls', icon: ListChecks, to: '/controls', group: 'Compliance' },
  { label: 'Evidence', icon: Paperclip, to: '/evidence', group: 'Compliance' },
  { label: 'Policies', icon: FileText, to: '/policies', group: 'Compliance' },
  { label: 'Tests', icon: FlaskConical, to: '/tests', roles: ['admin', 'analyst'], group: 'Compliance' },
  { label: 'Alerts', icon: AlertTriangle, to: '/alerts', roles: ['admin', 'analyst'], group: 'Operations' },
  { label: 'Incidents', icon: Flame, to: '/incidents', roles: ['admin', 'analyst'], group: 'Operations' },
  { label: 'Risk Register', icon: AlertOctagon, to: '/risk-register', group: 'Operations' },
  { label: 'Assets', icon: Monitor, to: '/assets', roles: ['admin', 'analyst'], group: 'Management' },
  { label: 'Vendors', icon: Building2, to: '/vendors', roles: ['admin', 'analyst'], group: 'Management' },
  { label: 'Personnel', icon: Users, to: '/personnel', roles: ['admin'], group: 'Management' },
  { label: 'Audit Trail', icon: ClipboardCheck, to: '/audits', group: 'Insights' },
  { label: 'Knowledge Base', icon: BookOpen, to: '/knowledge-base', group: 'Insights' },
  { label: 'Reports', icon: BarChart3, to: '/reports', group: 'Insights' },
  { label: 'Integrations', icon: Plug, to: '/integrations', roles: ['admin'], group: 'System' },
  { label: 'Settings', icon: Settings, to: '/settings', roles: ['admin'], group: 'System' },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const setOpen = useSidebarStore((s) => s.setOpen);
  const { role } = useRole();

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  // Group items
  const groups = new Map<string, typeof visibleItems>();
  visibleItems.forEach(item => {
    const g = item.group || 'Other';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(item);
  });

  return (
    <aside
      className={`flex flex-col glass-sidebar border-r border-sidebar-border h-full transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border/60">
        <div className="h-8 w-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
          <Shield className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-sm text-sidebar-accent-foreground tracking-tight truncate">
            WatchDog
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2.5 overflow-y-auto">
        {[...groups.entries()].map(([group, items]) => (
          <div key={group} className="mb-3">
            {!collapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group}
              </div>
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/12 text-sidebar-primary font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full gradient-primary" />
                    )}
                    <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-sidebar-primary' : ''}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Role badge */}
      {!collapsed && role && (
        <div className="px-4 py-3 border-t border-sidebar-border/60">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-status-passing animate-pulse-glow" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/70">
              {role}
            </span>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-11 border-t border-sidebar-border/60 text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/40 transition-all"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}