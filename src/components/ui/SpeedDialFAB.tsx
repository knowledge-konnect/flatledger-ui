import { useState } from 'react';
import { Plus, X, FileText, DollarSign, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useIsMobile } from '../../hooks/useMediaQuery';

interface FABAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

interface SpeedDialFABProps {
  actions: FABAction[];
  mainIcon?: React.ElementType;
  className?: string;
}

/**
 * Speed Dial Floating Action Button
 * Expandable menu with context-aware actions
 */
export function SpeedDialFAB({ actions, mainIcon: MainIcon = Plus, className }: SpeedDialFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className={cn('fixed bottom-6 right-6 z-40', className)}>
      {/* Actions Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Actions */}
          <div className="absolute bottom-20 right-0 space-y-3 animate-slide-in-up">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 animate-slide-in-right"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span className="px-3 py-1.5 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    {action.label}
                  </span>
                  <button
                    onClick={() => {
                      action.onClick();
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-12 h-12 rounded-full shadow-lg',
                      'flex items-center justify-center',
                      'transition-all duration-200 hover:scale-110',
                      action.color || 'bg-indigo-600 hover:bg-indigo-700'
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full shadow-2xl',
          'bg-gradient-to-br from-indigo-600 to-indigo-700',
          'flex items-center justify-center',
          'transition-all duration-300',
          'hover:scale-110 hover:shadow-indigo-500/50',
          'active:scale-95',
          isOpen && 'rotate-45'
        )}
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <MainIcon className="w-7 h-7 text-white" />
        )}
      </button>
    </div>
  );
}

// Example usage component
export function DashboardFAB() {
  const actions: FABAction[] = [
    {
      icon: FileText,
      label: 'Generate Bill',
      onClick: () => {},
    },
    {
      icon: DollarSign,
      label: 'Record Payment',
      onClick: () => {},
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      icon: TrendingDown,
      label: 'Add Expense',
      onClick: () => {},
      color: 'bg-red-600 hover:bg-red-700',
    },
  ];

  return <SpeedDialFAB actions={actions} />;
}
