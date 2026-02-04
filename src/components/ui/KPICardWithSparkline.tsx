import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SparklineData {
  value: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  sparklineData?: SparklineData[];
  icon?: React.ElementType;
  trend?: 'up' | 'down';
  className?: string;
}

/**
 * KPI Card with Mini Sparkline Chart
 * Shows key metrics with trend visualization
 */
export function KPICardWithSparkline({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  sparklineData = [],
  icon: Icon,
  trend,
  className,
}: KPICardProps) {
  const isPositive = change ? change > 0 : trend === 'up';
  const isNegative = change ? change < 0 : trend === 'down';

  // Calculate sparkline path
  const sparklinePath = () => {
    if (sparklineData.length === 0) return '';

    const width = 100;
    const height = 40;
    const padding = 2;

    const values = sparklineData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = sparklineData.map((d, i) => {
      const x = (i / (sparklineData.length - 1)) * width;
      const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800',
        'p-6 border border-slate-200 dark:border-slate-700',
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        'group',
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          </div>
          {Icon && (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Change indicator */}
        {(change !== undefined || trend) && (
          <div className="flex items-center gap-2 mb-3">
            {isPositive && <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />}
            {isNegative && <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />}
            {change !== undefined && (
              <span
                className={cn(
                  'text-sm font-semibold',
                  isPositive && 'text-green-600 dark:text-green-400',
                  isNegative && 'text-red-600 dark:text-red-400',
                  !isPositive && !isNegative && 'text-slate-600 dark:text-slate-400'
                )}
              >
                {change > 0 && '+'}
                {change}%
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">{changeLabel}</span>
          </div>
        )}

        {/* Sparkline */}
        {sparklineData.length > 0 && (
          <div className="mt-4">
            <svg width="100" height="40" className="w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area under line */}
              <path
                d={`${sparklinePath()} L 100,40 L 0,40 Z`}
                fill={`url(#gradient-${title})`}
                className="transition-all duration-500"
              />
              {/* Line */}
              <path
                d={sparklinePath()}
                stroke="rgb(99, 102, 241)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
