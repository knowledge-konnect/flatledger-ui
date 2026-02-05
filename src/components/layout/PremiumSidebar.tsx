import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Building,
  Receipt,
  DollarSign,
  TrendingDown,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export function PremiumSidebar({ onCollapse }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onCollapse?.(newState);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navigationItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/flats', icon: Building, label: 'Flats' },
    { to: '/billing', icon: Receipt, label: 'Billing' },
    { to: '/payments', icon: DollarSign, label: 'Payments' },
    { to: '/expenses', icon: TrendingDown, label: 'Expenses' },
  ];

  const managementItems = [
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40',
        'bg-white dark:bg-neutral-900',
        'border-r border-neutral-200/60 dark:border-neutral-700/60',
        'flex flex-col',
        'transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo & Collapse Toggle */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-neutral-200/60 dark:border-neutral-700/60">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SL</span>
            </div>
            <span className="font-bold text-neutral-900 dark:text-white">SocietyLedger</span>
          </div>
        )}
        <button
          onClick={handleCollapse}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          {collapsed ? (
            <Menu className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'text-sm font-medium transition-all duration-200',
                'group',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    'group-hover:scale-110',
                    isActive && 'text-primary-600 dark:text-primary-400'
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {/* Section Divider */}
        {!collapsed && (
          <div className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Management
            </p>
          </div>
        )}

        {managementItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'text-sm font-medium transition-all duration-200',
                'group',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    'group-hover:scale-110',
                    isActive && 'text-primary-600 dark:text-primary-400'
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-neutral-200/60 dark:border-neutral-700/60">
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors',
            collapsed ? 'justify-center' : ''
          )}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {user.role || 'Admin'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-error-50 dark:hover:bg-error-900/30 text-neutral-400 hover:text-error-600 dark:hover:text-error-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
