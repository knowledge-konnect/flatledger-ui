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
import { useState, useEffect } from 'react';

interface SidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export function PremiumSidebar({ onCollapse }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<{ name?: string; role?: string }>({});
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, []);

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

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        data-testid="sidebar"
        className={cn(
          'hidden lg:flex fixed left-0 top-0 bottom-0 z-40',
          'bg-white dark:bg-slate-900',
          'border-r border-slate-200 dark:border-slate-800',
          'flex-col',
          'transition-all duration-200',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Logo & Collapse Toggle */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">SocietyLedger</span>
            </div>
          )}
          <button
            onClick={handleCollapse}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            data-testid="sidebar-toggle"
          >
            {collapsed ? (
              <Menu className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-slate-500" />
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
                  'nav-item',
                  isActive && 'nav-item-active',
                  collapsed && 'justify-center px-2'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

          {/* Section Divider */}
          {!collapsed && (
            <div className="pt-6 pb-2 px-3">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Management
              </p>
            </div>
          )}

          {collapsed && <div className="my-4 border-t border-slate-200 dark:border-slate-800" />}

          {managementItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'nav-item',
                  isActive && 'nav-item-active',
                  collapsed && 'justify-center px-2'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-md',
              'hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
              collapsed && 'justify-center'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.role || 'Admin'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md hover:bg-error-50 dark:hover:bg-error-900/20 text-slate-400 hover:text-error-600 transition-colors"
                  title="Logout"
                  data-testid="logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
