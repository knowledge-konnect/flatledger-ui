import { NavLink } from 'react-router-dom';
import { Home, Building, DollarSign, User } from 'lucide-react';
import { cn } from '../../lib/utils';

export function MobileBottomNav() {
  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/flats', icon: Building, label: 'Flats' },
    { to: '/maintenance', icon: DollarSign, label: 'Maintenance' },
    { to: '/settings', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50" data-testid="mobile-nav">
      {/* Background */}
      <div className="absolute inset-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800" />

      {/* Navigation Items */}
      <div className="relative flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1',
                'min-w-[56px] py-2 px-2',
                'transition-colors duration-150',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5', isActive && 'text-primary-600 dark:text-primary-400')} />
                <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
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
