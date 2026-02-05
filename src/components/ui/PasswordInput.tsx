import { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { calculatePasswordStrength } from '../../lib/validation';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  showStrength?: boolean;
  className?: string;
}

/**
 * Password input with visibility toggle and strength indicator
 */
export function PasswordInput({
  value,
  onChange,
  label = 'Password',
  error,
  showStrength = true,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = showStrength ? calculatePasswordStrength(value) : null;

  const strengthColors = {
    weak: 'bg-red-500',
    fair: 'bg-orange-500',
    good: 'bg-yellow-500',
    strong: 'bg-green-500',
    'very-strong': 'bg-emerald-500',
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full px-4 py-2.5 pr-12 rounded-lg border-2 transition-all duration-200',
            'bg-white dark:bg-slate-900',
            'text-slate-900 dark:text-white',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20'
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Strength Indicator */}
      {showStrength && value && strength && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  level <= Math.ceil(strength.score / 1.4)
                    ? strengthColors[strength.label]
                    : 'bg-slate-200 dark:bg-slate-700'
                )}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                'font-medium capitalize',
                strength.label === 'weak' && 'text-red-600 dark:text-red-400',
                strength.label === 'fair' && 'text-orange-600 dark:text-orange-400',
                strength.label === 'good' && 'text-yellow-600 dark:text-yellow-400',
                strength.label === 'strong' && 'text-green-600 dark:text-green-400',
                strength.label === 'very-strong' && 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {strength.label.replace('-', ' ')}
            </span>
          </div>
          {strength.suggestions.length > 0 && (
            <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              {strength.suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <X className="w-3 h-3 text-red-500" />
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slide-in-up">{error}</p>
      )}
    </div>
  );
}
