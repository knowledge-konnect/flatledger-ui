import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Wrench, IndianRupee, BarChart3, Users, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { isFinancialRole, collectUserRoles, RoleDisplayName } from '../../types/roles';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import { AlertMessages } from '../../lib/alertMessages';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, iconColor: 'text-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-950/60' },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Flats', href: '/flats', icon: Building2, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-50 dark:bg-indigo-950/60' },
      { name: 'Maintenance', href: '/maintenance', icon: Wrench, iconColor: 'text-orange-500', iconBg: 'bg-orange-50 dark:bg-orange-950/60' },
      { name: 'Expenses', href: '/expenses', icon: IndianRupee, iconColor: 'text-red-500', iconBg: 'bg-red-50 dark:bg-red-950/60' },
      { name: 'Reports', href: '/reports', icon: BarChart3, iconColor: 'text-violet-500', iconBg: 'bg-violet-50 dark:bg-violet-950/60' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { name: 'Users', href: '/users', icon: Users, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-950/60' },
      { name: 'Settings', href: '/settings', icon: Settings, iconColor: 'text-slate-500', iconBg: 'bg-slate-100 dark:bg-slate-800/60' },
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
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Check if user holds a financial-level role (Society Admin, Admin or Treasurer)
  const isAdminUser = isFinancialRole(collectUserRoles(user));

  const userInitials = ((name: string) => {
    const words = name.trim().split(/\s+/);
    return words.map(w => w[0]).slice(0, 2).join('').toUpperCase();
  })(user?.name || user?.email || 'U');

  const rawRole = user?.roleDisplayName || user?.roles?.[0] || user?.role || RoleDisplayName.VIEWER;
  const userRole = rawRole.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <>
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in transition-all duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={cn(
          'fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-[#020617] border-r border-[#E2E8F0] dark:border-[#1E293B] z-50 transform transition-all duration-200',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!isMobileOpen}
        data-testid="sidebar-menu"
      >
        <div className="h-full flex flex-col">
          {/* Header - Premium Branding */}
          <div className="h-16 px-4 border-b border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] dark:from-[#3B82F6] dark:to-[#2563EB] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                {((name: string) => {
                  const words = name.trim().split(/\s+/);
                  return words.map(w => w[0]).slice(0, 2).join('').toUpperCase();
                })(user?.societyName || 'SL')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {user?.societyName || 'FlatLedger'}
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">
                  Management
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              data-testid="close-sidebar-btn"
            >
              <X className="w-5 h-5 text-[#64748B] dark:text-[#94A3B8]" />
            </button>
          </div>

          {/* Navigation - Grouped */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide space-y-4">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter(item =>
                !('adminOnly' in item && item.adminOnly && !isAdminUser)
              );
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.label}>
                  <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] dark:text-[#475569]">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const isActive = currentPath === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            'flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                            isActive
                              ? 'bg-[#2563EB]/10 dark:bg-[#3B82F6]/10 text-[#2563EB] dark:text-[#3B82F6] border-l-2 border-[#2563EB] dark:border-[#3B82F6] pl-[10px]'
                              : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-[#0F172A] dark:hover:text-[#F8FAFC] border-l-2 border-transparent hover:translate-x-0.5'
                          )}
                          data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span className={cn(
                            'flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 transition-colors duration-150',
                            item.iconBg
                          )}>
                            <item.icon className={cn('w-4 h-4', item.iconColor)} />
                          </span>
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
          <div className="p-3 border-t border-[#E2E8F0] dark:border-[#1E293B]">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] dark:from-[#3B82F6] dark:to-[#2563EB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F1F5F9] truncate">
                  {user?.name || user?.email || 'User'}
                </p>
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">{userRole}</p>
              </div>
              <button
                onClick={async () => {
                  setIsLoggingOut(true);
                  try {
                    await logout();
                    showToast(AlertMessages.success.logoutSuccess, 'success');
                    setTimeout(() => {
                      navigate('/login');
                    }, 100);
                  } catch {
                    showToast(AlertMessages.error.logoutFailed, 'error');
                    setIsLoggingOut(false);
                  }
                }}
                disabled={isLoggingOut}
                title="Logout"
                className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#DC2626] dark:hover:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150 disabled:opacity-50 flex-shrink-0"
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
