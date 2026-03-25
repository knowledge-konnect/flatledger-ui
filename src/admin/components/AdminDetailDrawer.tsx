import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Drawer shell ─────────────────────────────────────────────────────────────

interface AdminDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconBg?: string;
  children: ReactNode;
  isLoading?: boolean;
}

export function AdminDetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconBg = 'bg-indigo-600',
  children,
  isLoading = false,
}: AdminDetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="relative flex flex-col w-full max-w-xl max-h-[88vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="relative flex-shrink-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          {/* subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative flex items-start justify-between gap-3 px-5 py-5">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ring-1 ring-white/10',
                    iconBg,
                  )}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white leading-tight truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse"
                  style={{ width: `${45 + i * 7}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="p-5">{children}</div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

export function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-1">
        {title}
      </p>
      <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ─── Individual field row ─────────────────────────────────────────────────────

export function DrawerField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-slate-900 dark:text-white font-medium text-right">
        {value ?? <span className="text-slate-300 dark:text-slate-600 font-normal">—</span>}
      </span>
    </div>
  );
}
