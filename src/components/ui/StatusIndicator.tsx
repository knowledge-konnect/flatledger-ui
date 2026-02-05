import { cn } from '../../lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-slate-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
};

const sizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function StatusIndicator({
  status,
  size = 'md',
  showPulse = true,
  className,
}: StatusIndicatorProps) {
  return (
    <span className={cn('relative flex', className)}>
      <span
        className={cn(
          'rounded-full',
          statusColors[status],
          sizes[size],
          showPulse && status === 'online' && 'animate-pulse'
        )}
      />
      {showPulse && status === 'online' && (
        <span
          className={cn(
            'absolute inline-flex rounded-full opacity-75 animate-ping',
            statusColors[status],
            sizes[size]
          )}
        />
      )}
    </span>
  );
}
