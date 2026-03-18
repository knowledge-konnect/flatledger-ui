import { cn } from '../../lib/utils';

type StatusVariant =
  | 'active'
  | 'cancelled'
  | 'trial'
  | 'expired'
  | 'deleted'
  | 'enabled'
  | 'disabled'
  | string;

const variantClasses: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  enabled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  trial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  deleted: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  disabled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  verified: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

interface AdminStatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export function AdminStatusBadge({
  status,
  label,
  className,
}: AdminStatusBadgeProps) {
  const key = status.toLowerCase();
  const classes = variantClasses[key] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        classes,
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}
