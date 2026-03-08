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
      navigate('/login');
    } catch {
      showToast(AlertMessages.error.logoutFailed, 'error');
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617]">
      <Sidebar mobileOpen={isSidebarOpen} setMobileOpen={setIsSidebarOpen} />

      <div className={cn('transition-all duration-200', isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0')}>
        {/* Header - Premium SaaS Style */}
        <header className="sticky top-0 z-30 min-h-16 border-b border-[#E2E8F0] dark:border-[#1E293B] bg-white/95 dark:bg-[#020617]/95 backdrop-blur-xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              data-testid="menu-toggle"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5 text-[#64748B] dark:text-[#94A3B8]" />
              ) : (
                <Menu className="w-5 h-5 text-[#64748B] dark:text-[#94A3B8]" />
              )}
            </button>

            {title && (
              <h1 className="text-base sm:text-lg font-semibold text-[#0F172A] dark:text-[#F8FAFC] hidden md:block truncate min-w-0">
                {title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              data-testid="theme-toggle"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-[#64748B]" />
              ) : (
                <Sun className="w-5 h-5 text-[#94A3B8]" />
              )}
            </button>

            <button
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              data-testid="notifications-btn"
            >
              <Bell className="w-5 h-5 text-[#64748B] dark:text-[#94A3B8]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white dark:ring-[#020617]" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative ml-1">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                data-testid="profile-menu-btn"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] dark:from-[#3B82F6] dark:to-[#2563EB] rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden lg:block text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
              </button>

              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#020617] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl shadow-xl z-40 py-2 animate-fade-in">
                    <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                        {user?.roleDisplayName || user?.role || 'Member'}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate('/settings');
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#DC2626] dark:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content - Premium SaaS Layout */}
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
