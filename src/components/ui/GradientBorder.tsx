import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface GradientBorderProps {
  children: ReactNode;
  className?: string;
  gradient?: 'primary' | 'success' | 'warning' | 'danger';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const gradients = {
  primary: 'from-indigo-500 via-purple-500 to-pink-500',
  success: 'from-green-500 via-emerald-500 to-teal-500',
  warning: 'from-orange-500 via-amber-500 to-yellow-500',
  danger: 'from-red-500 via-rose-500 to-pink-500',
};

const roundedSizes = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
};

/**
 * Animated Gradient Border Component
 * Creates a premium animated gradient border effect
 */
export function GradientBorder({
  children,
  className,
  gradient = 'primary',
  rounded = 'xl',
}: GradientBorderProps) {
  return (
    <div className={cn('relative group', className)}>
      {/* Animated gradient border */}
      <div
        className={cn(
          'absolute -inset-0.5 bg-gradient-to-r opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient',
          gradients[gradient],
          roundedSizes[rounded]
        )}
      />
      {/* Content */}
      <div className={cn('relative bg-white dark:bg-slate-900', roundedSizes[rounded])}>
        {children}
      </div>
    </div>
  );
}
