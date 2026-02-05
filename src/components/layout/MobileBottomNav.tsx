import { NavLink } from 'react-router-dom';
import { Home, Building, Receipt, DollarSign, User } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Mobile Bottom Navigation
 * Only visible on mobile devices (< 1024px)
 */
export function MobileBottomNav() {
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/flats', icon: Building, label: 'Flats' },
    { to: '/billing', icon: Receipt, label: 'Bills' },
    { to: '/payments', icon: DollarSign, label: 'Payments' },
    { to: '/settings', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      {/* Background with blur */}
      <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-200/60 dark:border-neutral-700/60" />

      {/* Navigation Items */}
      <div className="relative flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1',
                'min-w-[60px] py-2 px-3 rounded-xl',
                'transition-all duration-200',
                'active:scale-95',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon
                    className={cn(
                      'w-6 h-6 transition-all duration-200',
                      isActive && 'scale-110'
                    )}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-600 dark:bg-primary-400" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-all duration-200',
                    isActive && 'font-semibold'
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
