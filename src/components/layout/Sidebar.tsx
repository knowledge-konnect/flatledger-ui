import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, TrendingUp, Users, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import { AlertMessages } from '../../lib/alertMessages';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Flats', href: '/flats', icon: Building2 },
  { name: 'Maintenance', href: '/maintenance', icon: CreditCard },
  { name: 'Expenses', href: '/expenses', icon: TrendingUp },
  { name: 'Reports', href: '/reports', icon: TrendingUp },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (v: boolean) => void }) {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const controlled = typeof mobileOpen !== 'undefined' && typeof setMobileOpen === 'function';
  const isMobileOpen = controlled ? mobileOpen : internalMobileOpen;
  const setIsMobileOpen = controlled ? setMobileOpen! : setInternalMobileOpen;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const currentPath = window.location.pathname;
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  return (
    <>
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        id="sidebar"
        className={cn(
          'fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-all duration-200',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!isMobileOpen}
        data-testid="sidebar-menu"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                {((name: string) => {
                  const words = name.trim().split(/\s+/);
                  return words.map(w => w[0]).slice(0, 2).join('').toUpperCase();
                })(user?.societyName || 'SL')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.societyName || 'SocietyLedger'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              data-testid="close-sidebar-btn"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
            {navigation.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'nav-item',
                    isActive && 'nav-item-active'
                  )}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 w-full transition-colors disabled:opacity-50"
              data-testid="sidebar-logout-btn"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
