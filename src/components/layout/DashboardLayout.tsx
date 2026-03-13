import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, LogOut, Settings, Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthProvider';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import { AlertMessages } from '../../lib/alertMessages';
import ChatBot from '../chatbot/ChatBot';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      if (typeof window !== 'undefined') {
        setIsSidebarOpen(window.innerWidth >= 1024);
      }
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

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
              aria-label="Toggle theme"
              data-testid="theme-toggle"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>

            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
              aria-label="Notifications"
              data-testid="notifications-btn"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full ring-1 ring-white dark:ring-[#0B0F19]" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                    {user?.roleDisplayName || user?.role || 'Member'}
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
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? 'Logging out…' : 'Logout'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* In-app Guidance ChatBot */}
      <ChatBot />
    </div>
  );
}
