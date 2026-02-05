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

export function PremiumLayout({ children, title, subtitle, actions }: PremiumLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <PremiumSidebar onCollapse={setSidebarCollapsed} />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen transition-all duration-200',
          'pb-20 lg:pb-0',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        )}
      >
        {/* Page Header */}
        {title && (
          <div className="header px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 py-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-content mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
