import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, TrendingUp, Users, Settings, LogOut, X, Calculator } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { useOpeningBalanceStatus } from '../../hooks/useOpeningBalance';
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
  { name: 'Opening Balance', href: '/settings/opening-balance', icon: Calculator, treasurerOnly: true },
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
  const { data: obStatus } = useOpeningBalanceStatus();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Check if user is Treasurer or Society Admin
  const isTreasurer = user?.roles?.some((role) => 
    role.name?.toLowerCase() === 'treasurer' || role.name?.toLowerCase() === 'society admin'
  );

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
          'fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-[#020617] border-r border-[#E2E8F0] dark:border-[#1E293B] z-50 transform transition-all duration-200',
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
                  {user?.societyName || 'SocietyLedger'}
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

          {/* Navigation - Premium SaaS Style */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
            {navigation.map((item) => {
              // Skip Treasurer-only items if user is not Treasurer
              if (item.treasurerOnly && !isTreasurer) {
                return null;
              }

              const isActive = currentPath === item.href;
              const showBadge = item.name === 'Opening Balance' && !obStatus?.isApplied;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                    isActive
                      ? 'bg-[#2563EB]/10 dark:bg-[#3B82F6]/10 text-[#2563EB] dark:text-[#3B82F6]'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                  )}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {showBadge && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-amber-500 dark:bg-amber-600 rounded-full">
                      New
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-[#E2E8F0] dark:border-[#1E293B]">
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#DC2626] dark:text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-all duration-150 disabled:opacity-50"
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
