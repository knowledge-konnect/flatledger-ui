import { ChevronRight } from 'lucide-react';

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
  color: KpiColorVariant;
  sub?: string;
  progress?: number;
  progressLabel?: string;
  loading?: boolean;
  onClick?: () => void;
}

const colorMap: Record<KpiColorVariant, { bg: string; icon: string; bar: string; border: string; borderL: string; watermark: string }> = {
  green:   { bg: 'bg-[#DCFCE7] dark:bg-green-950/30',    icon: 'text-[#16A34A] dark:text-green-400',    bar: 'bg-[#22C55E]',   border: 'border-[#22C55E]/30',   borderL: 'border-l-[#22C55E]',   watermark: 'text-green-100 dark:text-green-900/40' },
  red:     { bg: 'bg-[#FEE2E2] dark:bg-red-950/30',      icon: 'text-[#DC2626] dark:text-red-400',      bar: 'bg-[#EF4444]',   border: 'border-[#EF4444]/30',   borderL: 'border-l-[#EF4444]',   watermark: 'text-red-100 dark:text-red-900/40' },
  amber:   { bg: 'bg-[#FEF9C3] dark:bg-amber-950/30',    icon: 'text-[#B45309] dark:text-amber-400',    bar: 'bg-[#F59E0B]',   border: 'border-[#F59E0B]/30',   borderL: 'border-l-[#F59E0B]',   watermark: 'text-amber-100 dark:text-amber-900/40' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950/30',   icon: 'text-orange-600 dark:text-orange-400',  bar: 'bg-orange-500',  border: 'border-orange-500/30',  borderL: 'border-l-orange-500',  watermark: 'text-orange-100 dark:text-orange-900/40' },
  blue:    { bg: 'bg-primary/10 dark:bg-primary/20',      icon: 'text-primary dark:text-primary-300',   bar: 'bg-primary',     border: 'border-primary/30',     borderL: 'border-l-primary',     watermark: 'text-blue-100 dark:text-blue-900/40' },
  indigo:  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500', border: 'border-emerald-500/30', borderL: 'border-l-emerald-500', watermark: 'text-emerald-100 dark:text-emerald-900/40' },
  emerald: { bg: 'bg-[#DCFCE7] dark:bg-emerald-950/30',  icon: 'text-[#059669] dark:text-emerald-400',  bar: 'bg-[#10B981]',   border: 'border-[#10B981]/30',   borderL: 'border-l-[#10B981]',   watermark: 'text-emerald-100 dark:text-emerald-900/40' },
};

export function KpiCard({ label, value, color, sub, progress, progressLabel, loading = false, onClick }: KpiCardProps) {
  const c = colorMap[color];
  const pct = Math.min(100, Math.max(0, progress ?? 0));

  if (loading) {
    return (
      <div className="rounded-[10px] border border-l-4 border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-4 pb-3 animate-pulse" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div className="h-2.5 w-28 rounded-lg bg-slate-100 dark:bg-slate-800 mb-3" />
        <div className="h-7 w-32 rounded-lg bg-slate-100 dark:bg-slate-800 mb-1.5" />
        <div className="h-2.5 w-20 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden bg-white dark:bg-slate-900 rounded-[10px] border border-[#E2E8F0] dark:border-slate-800 border-l-4 ${c.borderL} px-4 pt-4 pb-3 transition-all duration-200 hover:-translate-y-0.5 select-none flex flex-col ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}
      onClick={onClick}
    >
      {/* Top row: label only */}
      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-snug">
        {label}
      </p>

      {/* Value + sub */}
      <div className="mt-2">
        <p className="text-[22px] font-bold text-[#0F172A] dark:text-white truncate leading-tight">
          {value}
        </p>
        {sub && (
          <p className={`mt-0.5 text-xs font-semibold leading-snug ${c.icon}`}>{sub}</p>
        )}
      </div>

      {/* Bottom: progress bar OR view hint */}
      {progress !== undefined ? (
        <div className="mt-3 pt-2 border-t border-[#F1F5F9] dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Collection</span>
            <span className={`text-[10px] font-semibold ${c.icon}`}>{progressLabel ?? `${pct.toFixed(1)}%`}</span>
          </div>
          <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${c.bar} transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : onClick ? (
        <div className="mt-3 pt-2 border-t border-[#F1F5F9] dark:border-slate-800 h-[22px] flex items-center gap-0.5">
          <span className={`text-[11px] font-semibold ${c.icon} opacity-0 group-hover:opacity-100 transition-opacity duration-150`}>View details</span>
          <ChevronRight className={`w-3 h-3 ${c.icon} opacity-0 group-hover:opacity-100 transition-opacity duration-150`} />
        </div>
      ) : (
        <div className="mt-3 pt-2 border-t border-[#F1F5F9] dark:border-slate-800 h-[22px]" />
      )}
    </div>
  );
}
