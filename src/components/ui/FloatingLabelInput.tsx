import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '../../lib/utils';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/**
 * Input with floating label animation
 * Label floats up when focused or has value
 */
export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== '';
    const isFloating = isFocused || hasValue;

    return (
      <div className="relative">
        <input
          ref={ref}
          className={cn(
            'peer w-full px-4 pt-6 pb-2 rounded-lg border-2 transition-all duration-200',
            'bg-white dark:bg-slate-900',
            'text-slate-900 dark:text-white',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500/20',
            'disabled:bg-slate-50 dark:disabled:bg-slate-800/30 disabled:cursor-not-allowed',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=" "
          {...props}
        />
        <label
          className={cn(
            'absolute left-4 transition-all duration-200 pointer-events-none',
            isFloating
              ? 'top-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400'
              : 'top-1/2 -translate-y-1/2 text-base text-slate-500 dark:text-slate-400'
          )}
        >
          {label}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slide-in-up">{error}</p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';
