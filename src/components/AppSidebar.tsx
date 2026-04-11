import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard, Shield, ListChecks, Paperclip, AlertTriangle, Flame,
  Monitor, Users, FileText, AlertOctagon, ClipboardCheck, BarChart3,
  Plug, Settings, ChevronLeft, ChevronRight, Dog, FlaskConical, Building2, BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import { useSidebarStore } from '@/hooks/use-sidebar-store';
import { useRole } from '@/hooks/use-role-context';
import type { AppRole } from '@/hooks/use-user-role';

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  to: string;
  /** Roles that can see this nav item. Undefined = all roles. */
  roles?: AppRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Frameworks', icon: Shield, to: '/frameworks' },
  { label: 'Controls', icon: ListChecks, to: '/controls' },
  { label: 'Evidence', icon: Paperclip, to: '/evidence' },
  { label: 'Alerts', icon: AlertTriangle, to: '/alerts', roles: ['admin', 'analyst'] },
  { label: 'Incidents', icon: Flame, to: '/incidents', roles: ['admin', 'analyst'] },
  { label: 'Assets', icon: Monitor, to: '/assets', roles: ['admin', 'analyst'] },
  { label: 'Personnel', icon: Users, to: '/personnel', roles: ['admin'] },
  { label: 'Policies', icon: FileText, to: '/policies' },
  { label: 'Risk Register', icon: AlertOctagon, to: '/risk-register' },
  { label: 'Tests', icon: FlaskConical, to: '/tests', roles: ['admin', 'analyst'] },
  { label: 'Vendors', icon: Building2, to: '/vendors', roles: ['admin', 'analyst'] },
  { label: 'Audit Trail', icon: ClipboardCheck, to: '/audits' },
  { label: 'Knowledge Base', icon: BookOpen, to: '/knowledge-base' },
  { label: 'Reports', icon: BarChart3, to: '/reports' },
  { label: 'Integrations', icon: Plug, to: '/integrations', roles: ['admin'] },
  { label: 'Settings', icon: Settings, to: '/settings', roles: ['admin'] },
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

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-sidebar-border h-full transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border">
        <Dog className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-bold text-sm text-sidebar-accent-foreground tracking-tight truncate">
            WatchDog Security
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary font-medium shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      {!collapsed && role && (
        <div className="px-4 py-2 border-t border-sidebar-border">
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-primary/15 text-primary">
            {role}
          </span>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/40 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
