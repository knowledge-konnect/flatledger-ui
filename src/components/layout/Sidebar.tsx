import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Wrench, IndianRupee, BarChart3, Users, Settings, LogOut, X, ChevronDown, BarChart2, AlertTriangle, TrendingUp, PieChart, FileDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { isAdminRole, collectUserRoles, RoleDisplayName } from '../../types/roles';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import { AlertMessages } from '../../lib/alertMessages';

const reportsSubItems = [
  { name: 'Billing Summary',      href: '/reports/collection-summary', icon: BarChart2 },
  { name: 'Outstanding Dues',     href: '/reports/defaulters',          icon: AlertTriangle },
  { name: 'Income & Expenses',    href: '/reports/income-vs-expense',  icon: TrendingUp },
  { name: 'Expenses by Category', href: '/reports/expense-by-category', icon: PieChart },
  { name: 'Download Reports',     href: '/reports/download-reports',    icon: FileDown },
];

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-950/60' },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Flats', href: '/flats', icon: Building2, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-950/60' },
      { name: 'Maintenance', href: '/maintenance', icon: Wrench, iconColor: 'text-orange-500', iconBg: 'bg-orange-50 dark:bg-orange-950/60' },
      { name: 'Expenses', href: '/expenses', icon: IndianRupee, iconColor: 'text-red-500', iconBg: 'bg-red-50 dark:bg-red-950/60' },
      { name: 'Reports', href: '/reports', icon: BarChart3, iconColor: 'text-violet-500', iconBg: 'bg-violet-50 dark:bg-violet-950/60' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Users', href: '/users', icon: Users, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-950/60', adminOnly: true },
      { name: 'Settings', href: '/settings', icon: Settings, iconColor: 'text-slate-500', iconBg: 'bg-slate-100 dark:bg-slate-800/60', adminOnly: true },
    ],
  },
];

export default function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (v: boolean) => void }) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const controlled = typeof mobileOpen !== 'undefined' && typeof setMobileOpen === 'function';
  const isMobileOpen = controlled ? mobileOpen : internalMobileOpen;
  const setIsMobileOpen = controlled ? setMobileOpen! : setInternalMobileOpen;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { pathname: currentPath } = useLocation();
  const [reportsOpen, setReportsOpen] = useState(() => currentPath.startsWith('/reports'));
  const { logout, user } = useAuth();
  const { showToast } = useToast();

  // Check if user is Society Admin
  const isAdminUser = isAdminRole(collectUserRoles(user));

  const userInitials = ((name: string) => {
    const words = name.trim().split(/\s+/);
    return words.map(w => w[0]).slice(0, 2).join('').toUpperCase();
  })(user?.name || user?.email || 'U');

  const rawRole = String(user?.roleDisplayName || user?.roles?.[0] || user?.role || RoleDisplayName.VIEWER);
  const userRole = rawRole.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <>
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in transition-all duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={cn(
          'fixed top-0 left-0 bottom-0 w-64 z-50 transform transition-all duration-200',
          'bg-emerald-950 border-r border-emerald-900/60',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!isMobileOpen}
        data-testid="sidebar-menu"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 px-4 border-b border-emerald-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-emerald-900/50">
                {((name: string) => {
                  const words = name.trim().split(/\s+/);
                  return words.map(w => w[0]).slice(0, 2).join('').toUpperCase();
                })(user?.societyName || 'SL')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.societyName || 'FlatLedger'}
                </p>
                <p className="text-[11px] text-emerald-400/70 truncate font-medium">
                  Management
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-emerald-900/60 transition-colors"
              data-testid="close-sidebar-btn"
            >
              <X className="w-5 h-5 text-emerald-400/70" />
            </button>
          </div>

          {/* Navigation - Grouped */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide space-y-5">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter(item =>
                !('adminOnly' in item && item.adminOnly && !isAdminUser)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.label}>
                  <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-500/50">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      // Reports: render as collapsible parent with submenu
                      if (item.name === 'Reports') {
                        const isParentActive = currentPath.startsWith('/reports');
                        return (
                          <div key="Reports">
                            <button
                              onClick={() => setReportsOpen(v => !v)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                isParentActive
                                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/50'
                                  : 'text-emerald-100/60 hover:bg-emerald-900/70 hover:text-emerald-50'
                              )}
                              data-testid="nav-reports"
                            >
                              <item.icon className={cn(
                                'w-4 h-4 flex-shrink-0 transition-colors duration-150',
                                isParentActive ? 'text-white' : 'text-emerald-400/70'
                              )} />
                              <span className="flex-1 text-left">{item.name}</span>
                              <ChevronDown className={cn(
                                'w-4 h-4 transition-transform duration-200 flex-shrink-0',
                                isParentActive ? 'text-white/80' : 'text-emerald-400/50',
                                reportsOpen ? 'rotate-180' : ''
                              )} />
                            </button>
                            <div className={cn(
                              'overflow-hidden transition-all duration-200 ease-in-out',
                              reportsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            )}>
                              <div className="ml-3 mt-1 mb-1 space-y-0.5 border-l border-emerald-800/60 pl-3">
                                {reportsSubItems.map(child => {
                                  const isChildActive = currentPath === child.href || currentPath.startsWith(child.href + '/');
                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={() => setIsMobileOpen(false)}
                                      className={cn(
                                        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                                        isChildActive
                                          ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                                          : 'text-emerald-100/50 hover:bg-emerald-900/60 hover:text-emerald-100'
                                      )}
                                      data-testid={`nav-${child.name.toLowerCase().replace(/\s+/g, '-')}`}
                                    >
                                      <child.icon className={cn(
                                        'w-3.5 h-3.5 flex-shrink-0',
                                        isChildActive ? 'text-emerald-400' : 'text-emerald-500/50'
                                      )} />
                                      <span className="flex-1">{child.name}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Regular link item
                      const isActive = currentPath === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                            isActive
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/50'
                              : 'text-emerald-100/60 hover:bg-emerald-900/70 hover:text-emerald-50'
                          )}
                          data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <item.icon className={cn(
                            'w-4 h-4 flex-shrink-0 transition-colors duration-150',
                            isActive ? 'text-white' : 'text-emerald-400/70'
                          )} />
                          <span className="flex-1">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* User Profile Card + Logout */}
          <div className="p-3 border-t border-emerald-900/60">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-900/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || user?.email || 'User'}
                </p>
                <p className="text-[10px] text-emerald-400/60 truncate">{userRole}</p>
              </div>
              <button
                onClick={async () => {
                  setIsLoggingOut(true);
                  try {
                    await logout();
                    showToast(AlertMessages.success.logoutSuccess, 'success');
                  } catch {
                    showToast(AlertMessages.error.logoutFailed, 'error');
                    setIsLoggingOut(false);
                  }
                }}
                disabled={isLoggingOut}
                title="Logout"
                className="p-1.5 rounded-lg text-emerald-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 disabled:opacity-50 flex-shrink-0"
                data-testid="sidebar-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

