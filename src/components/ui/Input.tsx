import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none transition-colors">
              {icon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              'input',
              icon && 'pl-12',
              error && 'input-error',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-error-600 dark:text-error-400 font-medium animate-slide-in-up">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
