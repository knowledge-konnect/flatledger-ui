import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, rightIcon, type = 'text', id, ...props }, ref) => {
    const inputId = id || props.name || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'input',
              icon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'input-error',
              className
            )}
            data-testid={props['data-testid'] || `input-${props.name || 'field'}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
        {helperText && !error && <p className="helper-text">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
