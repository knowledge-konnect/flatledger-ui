import { Info } from 'lucide-react';

interface BalanceLegendProps {
  /**
   * The legend text from the API response.
   * Example: "Positive = member owes the society; Negative = society owes member (advance)."
   */
  legend?: string;
  variant?: 'inline' | 'card' | 'info-banner';
  className?: string;
}

/**
 * Displays the balance sign legend from the API response.
 * Shows users what positive and negative balances mean.
 */
export function BalanceLegend({
  legend,
  variant = 'info-banner',
  className = '',
}: BalanceLegendProps) {
  if (!legend) return null;

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-slate-500 dark:text-slate-400 ${className}`}>
        <span className="font-semibold">Legend:</span> {legend}
      </p>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-3 ${className}`}>
        <div className="flex gap-2.5 text-sm">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-0.5">Balance Legend</p>
            <p className="text-blue-800 dark:text-blue-200">{legend}</p>
          </div>
        </div>
      </div>
    );
  }

  // default: info-banner
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-xs ${className}`}>
      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <span className="text-blue-900 dark:text-blue-100">
        <strong>Balance Legend:</strong> {legend}
      </span>
    </div>
  );
}
