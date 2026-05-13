import { AlertCircle, TrendingDown, Check } from 'lucide-react';
import { formatSignedBalance, getBalanceBadgeClasses, getBalanceTextClasses } from '../../lib/utils';

interface SignedBalanceDisplayProps {
  amount?: number | null;
  /**
   * Display size: compact (inline), normal (table), large (card/summary)
   */
  size?: 'compact' | 'normal' | 'large';
  /**
   * Show inline label (Due/Advance)?
   */
  showLabel?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Displays a signed balance with proper color coding and label.
 * Positive = red (due), Negative = green (advance), Zero = slate (clear)
 */
export function SignedBalanceDisplay({
  amount,
  size = 'normal',
  showLabel = true,
  className = '',
}: SignedBalanceDisplayProps) {
  const balance = formatSignedBalance(amount);

  if (size === 'compact') {
    return (
      <span className={`${getBalanceTextClasses(balance.color)} font-medium text-sm ${className}`}>
        {balance.formatted}
        {showLabel && balance.label !== 'N/A' && ` (${balance.label})`}
      </span>
    );
  }

  if (size === 'large') {
    return (
      <div className={className}>
        <div className={`text-2xl font-bold ${getBalanceTextClasses(balance.color)}`}>
          {balance.formatted}
        </div>
        {showLabel && balance.label !== 'N/A' && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {balance.label}
          </div>
        )}
      </div>
    );
  }

  // default: normal
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`text-sm font-semibold ${getBalanceTextClasses(balance.color)}`}>
        {balance.formatted}
      </span>
      {showLabel && balance.label !== 'N/A' && (
        <span className={getBalanceBadgeClasses(balance.color)}>
          {balance.isPositive && <AlertCircle className="w-3 h-3" />}
          {balance.isNegative && <Check className="w-3 h-3" />}
          {balance.isZero && <TrendingDown className="w-3 h-3" />}
          {balance.label}
        </span>
      )}
    </div>
  );
}
