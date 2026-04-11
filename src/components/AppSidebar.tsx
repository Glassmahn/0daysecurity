import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard, Shield, ListChecks, Paperclip, AlertTriangle, Flame,
  Monitor, Users, FileText, AlertOctagon, ClipboardCheck, BarChart3,
  Plug, Settings, ChevronLeft, ChevronRight, Dog, FlaskConical, Building2,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Frameworks', icon: Shield, to: '/frameworks' },
  { label: 'Controls', icon: ListChecks, to: '/controls' },
  { label: 'Evidence', icon: Paperclip, to: '/evidence' },
  { label: 'Alerts', icon: AlertTriangle, to: '/alerts' },
  { label: 'Incidents', icon: Flame, to: '/incidents' },
  { label: 'Assets', icon: Monitor, to: '/assets' },
  { label: 'Personnel', icon: Users, to: '/personnel' },
  { label: 'Policies', icon: FileText, to: '/policies' },
  { label: 'Risk Register', icon: AlertOctagon, to: '/risk-register' },
  { label: 'Tests', icon: FlaskConical, to: '/tests' },
  { label: 'Vendors', icon: Building2, to: '/vendors' },
  { label: 'Audits', icon: ClipboardCheck, to: '/audits' },
  { label: 'Reports', icon: BarChart3, to: '/reports' },
  { label: 'Integrations', icon: Plug, to: '/integrations' },
  { label: 'Settings', icon: Settings, to: '/settings' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} min-h-screen`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-sidebar-border">
        <Dog className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-semibold text-sm text-sidebar-accent-foreground tracking-tight truncate">
            WatchDog Security
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
