import { type LucideIcon } from 'lucide-react';

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
  sub?: string;
  progress?: number;
  progressLabel?: string;
  loading?: boolean;
  onClick?: () => void;
}

const colorMap: Record<KpiColorVariant, { bg: string; icon: string; bar: string; border: string }> = {
  green:   { bg: 'bg-[#DCFCE7] dark:bg-green-950/30',   icon: 'text-[#16A34A] dark:text-green-400',   bar: 'bg-[#22C55E]', border: 'border-[#22C55E]/30' },
  red:     { bg: 'bg-[#FEE2E2] dark:bg-red-950/30',     icon: 'text-[#DC2626] dark:text-red-400',     bar: 'bg-[#EF4444]', border: 'border-[#EF4444]/30' },
  amber:   { bg: 'bg-[#FEF9C3] dark:bg-amber-950/30',   icon: 'text-[#B45309] dark:text-amber-400',   bar: 'bg-[#F59E0B]', border: 'border-[#F59E0B]/30' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950/30',  icon: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500', border: 'border-orange-500/30' },
  blue:    { bg: 'bg-primary/10 dark:bg-primary/20',     icon: 'text-primary dark:text-primary-300',  bar: 'bg-primary', border: 'border-primary/30' },
  indigo:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30',   icon: 'text-emerald-600 dark:text-emerald-400',  bar: 'bg-emerald-500', border: 'border-emerald-500/30' },
  emerald: { bg: 'bg-[#DCFCE7] dark:bg-emerald-950/30', icon: 'text-[#059669] dark:text-emerald-400', bar: 'bg-[#10B981]', border: 'border-[#10B981]/30' },
};

export function KpiCard({ label, value, icon: Icon, color, sub, progress, progressLabel, loading = false, onClick }: KpiCardProps) {
  const c = colorMap[color];
  const pct = Math.min(100, Math.max(0, progress ?? 0));

  if (loading) {
    return (
      <div className="rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 animate-pulse" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <div className="h-3 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="h-7 w-24 rounded-lg bg-slate-100 dark:bg-slate-800" />
            <div className="h-2.5 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 p-4 transition-all duration-200 hover:-translate-y-0.5 select-none ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#374151] dark:text-slate-300 uppercase tracking-widest mb-1.5">
            {label}
          </p>
          <p className="text-2xl font-bold text-[#0F172A] dark:text-white truncate leading-tight">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs font-medium text-[#475569] dark:text-slate-300 leading-snug">{sub}</p>
          )}
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${c.icon}`} />
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Collection</span>
            <span className={`text-[10px] font-semibold ${c.icon}`}>{progressLabel ?? `${pct.toFixed(1)}%`}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${c.bar} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
