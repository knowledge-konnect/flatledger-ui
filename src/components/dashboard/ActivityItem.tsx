import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface ActivityItemProps {
  type: 'payment' | 'expense';
  description: string;
  amount: number;
  date: string;
}

function formatActivityDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function ActivityItem({ type, description, amount, date }: ActivityItemProps) {
  const isPayment = type === 'payment';

  return (
    <div className="flex items-center justify-between gap-4 px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150">
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          isPayment
            ? 'bg-green-50 dark:bg-green-950/30'
            : 'bg-red-50 dark:bg-red-950/30'
        }`}
      >
        {isPayment ? (
          <ArrowDownCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        ) : (
          <ArrowUpCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        )}
      </div>

      {/* Description + date */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{description}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatActivityDate(date)}</p>
      </div>

      {/* Amount */}
      <span
        className={`flex-shrink-0 text-sm font-semibold ${
          isPayment ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {isPayment ? '+' : '−'}{formatCurrency(Math.abs(amount))}
      </span>
    </div>
  );
}
