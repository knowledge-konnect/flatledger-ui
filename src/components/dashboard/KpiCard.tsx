import { type LucideIcon } from 'lucide-react';
import Card from '../ui/Card';

export type KpiColorVariant =
  | 'green'
  | 'red'
  | 'amber'
  | 'orange'
  | 'blue'
  | 'indigo'
  | 'emerald';

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: KpiColorVariant;
  /** Optional small note beneath the value */
  sub?: string;
  loading?: boolean;
}

const colorMap: Record<KpiColorVariant, { bg: string; icon: string; accent: string }> = {
  green:   { bg: 'bg-green-50 dark:bg-green-950/20',   icon: 'text-green-600 dark:text-green-400',   accent: 'border-l-green-500' },
  red:     { bg: 'bg-red-50 dark:bg-red-950/20',       icon: 'text-red-600 dark:text-red-400',       accent: 'border-l-red-500' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/20',   icon: 'text-amber-600 dark:text-amber-400',   accent: 'border-l-amber-500' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950/20', icon: 'text-orange-600 dark:text-orange-400', accent: 'border-l-orange-500' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950/20',     icon: 'text-blue-600 dark:text-blue-400',     accent: 'border-l-blue-500' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-950/20', icon: 'text-indigo-600 dark:text-indigo-400', accent: 'border-l-indigo-500' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20',icon: 'text-emerald-600 dark:text-emerald-400',accent: 'border-l-emerald-500' },
};

export function KpiCard({ label, value, icon: Icon, color, sub, loading = false }: KpiCardProps) {
  const c = colorMap[color];

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-2.5 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`
        relative overflow-hidden rounded-xl border-l-4 ${c.accent}
        shadow-sm hover:shadow-lg hover:-translate-y-0.5
        transition-all duration-200 cursor-default select-none
        p-5
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate mb-2">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white truncate transition-all duration-500">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{sub}</p>
          )}
        </div>
        <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </Card>
  );
}
