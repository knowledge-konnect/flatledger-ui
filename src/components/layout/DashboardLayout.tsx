import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, LogOut, Settings, Menu, X, AlertTriangle } from 'lucide-react';
import Sidebar from './Sidebar';
// import NotificationPanel from '../notifications/NotificationPanel'; // Hidden for MVP
// import { useNotificationCount } from '../../hooks/useNotificationCount'; // Hidden for MVP
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthProvider';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import { AlertMessages } from '../../lib/alertMessages';
import { getPrimaryRoleLabel } from '../../types/roles';
import { useCurrentSubscription } from '../../hooks/useCurrentSubscription';

const DISMISS_KEY = 'sub_expiry_banner_dismissed';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

/**
 * Component: DashboardLayout
 * Purpose: Shared layout wrapper for all authenticated pages. Renders the
 * collapsible sidebar, sticky top navbar (with theme toggle, notifications,
 * and profile menu), and the main content area.
 *
 * Props:
 *   children: Page content to render inside the main area
 *   title: Optional page title shown in the navbar breadcrumb
 */
export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  // const unreadCount = useNotificationCount(); // Hidden for MVP
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  // const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false); // Hidden for MVP
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Subscription expiry banner state
  const subscription = useCurrentSubscription();
  const [sevenDayDismissed, setSevenDayDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === 'true'
  );

  // Compute days until expiry from subscription data
  const expiryDateStr = subscription.currentPeriodEnd ?? subscription.trialEnd;
  const daysUntilExpiry: number | null = (() => {
    if (!expiryDateStr) return null;
    const expiryMs = new Date(expiryDateStr).setHours(0, 0, 0, 0);
    const todayMs = new Date().setHours(0, 0, 0, 0);
    return Math.floor((expiryMs - todayMs) / (1000 * 60 * 60 * 24));
  })();
  // Read window width eagerly so the sidebar is already open on desktop before
  // first paint, preventing a 256 px layout shift (CLS) on large screens.
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    if (subscription.loading) return;

    const blockedBySubscription = subscription.status === 'expired' || subscription.status === 'cancelled';
    const isAllowedRoute = location.pathname.startsWith('/subscription/manage') || location.pathname.startsWith('/subscription/renew');

    if (blockedBySubscription && !isAllowedRoute) {
      navigate('/subscription/manage', { replace: true });
    }
  }, [subscription.loading, subscription.status, location.pathname, navigate]);

  // Keep sidebar in sync when user resizes the window.
  const handleResize = useCallback(() => {
    setIsSidebarOpen(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showToast(AlertMessages.success.logoutSuccess, 'success');
    } catch {
      showToast(AlertMessages.error.logoutFailed, 'error');
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07090F]">
      <Sidebar mobileOpen={isSidebarOpen} setMobileOpen={setIsSidebarOpen} />

      <div className={cn('transition-all duration-200', isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0')}>
        {/* Header - Premium SaaS Navbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-[#E2E8F0] dark:border-slate-800/60 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
              aria-label="Toggle sidebar"
              data-testid="menu-toggle"
            >
              {isSidebarOpen ? (
                <X className="w-[18px] h-[18px]" />
              ) : (
                <Menu className="w-[18px] h-[18px]" />
              )}
            </button>

            {title && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <h1 className="text-[15px] font-semibold text-[#0F172A] dark:text-white truncate">
                  {title}
                </h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
              aria-label={t('common.toggleTheme')}
              data-testid="theme-toggle"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {/* Notifications - Hidden for MVP */}
            {/* <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationPanelOpen(!isNotificationPanelOpen);
                  setIsProfileMenuOpen(false); // Close profile menu when opening notifications
                }}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                aria-label="Notifications"
                data-testid="notifications-btn"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0B0F19]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              <NotificationPanel 
                isOpen={isNotificationPanelOpen} 
                onClose={() => setIsNotificationPanelOpen(false)} 
              />
            </div> */}

            {/* Divider - Hidden with notifications */}
            {/* <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" /> */}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Profile menu"
                data-testid="profile-menu-btn"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow-sm flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white leading-tight">
                    {user?.name?.split(' ')[0] || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {getPrimaryRoleLabel(user)}
                  </p>
                </div>
              </button>

              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-xl shadow-xl z-40 py-1.5 animate-slide-up">
                    <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-slate-800">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                        {user?.email || user?.roleDisplayName || 'Member'}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate('/settings');
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        {t('nav.settings')}
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? t('nav.loggingOut') : t('nav.logout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Subscription Expiry Banner (hidden on subscription pages to avoid duplicate messaging) */}
        {!location.pathname.startsWith('/subscription/manage') && !location.pathname.startsWith('/subscription/renew') && daysUntilExpiry !== null && daysUntilExpiry <= 7 && (() => {
          if (daysUntilExpiry <= 0) {
            // Expired — not dismissible
            return (
              <div className="px-4 sm:px-6 py-3 bg-red-600 text-white border-b border-red-700/60">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold truncate">Your subscription has expired. Renew now to restore access.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/subscription/manage')}
                    className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-white text-red-700 text-xs font-bold hover:bg-red-50 transition-colors"
                  >
                    Renew Now
                  </button>
                </div>
              </div>
            );
          }
          if (daysUntilExpiry === 1) {
            // 1 day — not dismissible
            return (
              <div className="px-4 sm:px-6 py-3 bg-orange-500 text-white border-b border-orange-600/60">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-semibold truncate">Your subscription expires tomorrow. Renew now.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/subscription/manage')}
                    className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-white text-orange-700 text-xs font-bold hover:bg-orange-50 transition-colors"
                  >
                    Renew Now
                  </button>
                </div>
              </div>
            );
          }
          // 2–7 days — dismissible per session
          if (sevenDayDismissed) return null;
          return (
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-amber-400 text-amber-950 text-sm font-medium">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Your subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}. Renew now to avoid interruption.
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to="/subscription/manage"
                  className="px-3 py-1 rounded-md bg-amber-900 text-white text-xs font-semibold hover:bg-amber-800 transition-colors"
                >
                  Renew Now
                </Link>
                <button
                  onClick={() => {
                    sessionStorage.setItem(DISMISS_KEY, 'true');
                    setSevenDayDismissed(true);
                  }}
                  className="p-1 rounded hover:bg-amber-500/40 transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Main Content */}
        <main className="p-4 sm:p-6 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* In-app Guidance ChatBot hidden for now */}
    </div>
  );
}
