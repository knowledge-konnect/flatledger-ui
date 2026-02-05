import { ReactNode, useState } from 'react';
import { PremiumSidebar } from './PremiumSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { cn } from '../../lib/utils';

interface PremiumLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * Premium Page Layout
 * Includes sidebar, mobile nav, and page header
 */
export function PremiumLayout({ children, title, subtitle, actions }: PremiumLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar */}
      <PremiumSidebar onCollapse={setSidebarCollapsed} />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          'pb-20 lg:pb-0', // Bottom padding for mobile nav
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        {/* Page Header */}
        {title && (
          <div className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-6 border-b border-neutral-200/60 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
