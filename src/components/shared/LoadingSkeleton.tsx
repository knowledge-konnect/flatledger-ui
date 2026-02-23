import { cn } from '../../lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  variant?: 'text' | 'card' | 'avatar' | 'button';
}

export function LoadingSkeleton({ className, lines = 1, variant = 'text' }: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={cn('rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 space-y-4', className)}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-5/6" />
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return <div className={cn('w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse', className)} />;
  }

  if (variant === 'button') {
    return <div className={cn('h-10 w-24 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse', className)} />;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"
          style={{ width: i === lines - 1 ? '80%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/3" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/5" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/6" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-64" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-96" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <LoadingSkeleton key={i} variant="card" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="h-96 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-96 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    </div>
  );
}
