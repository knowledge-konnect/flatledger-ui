import { ReactNode, forwardRef, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

/**
 * Premium Glassmorphism Card Component
 * Features: Backdrop blur, gradient border, hover effects
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'backdrop-blur-xl bg-white/80 dark:bg-slate-900/80',
          'border border-white/20 dark:border-slate-700/30',
          'rounded-2xl shadow-2xl',
          'transition-all duration-300',
          hover && 'hover:shadow-indigo-500/10 hover:border-indigo-300/50 dark:hover:border-indigo-600/50 hover:-translate-y-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
