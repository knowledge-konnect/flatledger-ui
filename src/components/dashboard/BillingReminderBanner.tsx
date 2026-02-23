import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';

interface BillingReminderBannerProps {
  monthLabel: string;
  isGenerated: boolean;
  isLoading?: boolean;
  isGenerating?: boolean;
  onGenerate: () => void;
}

export default function BillingReminderBanner({
  monthLabel,
  isGenerated,
  isLoading,
  isGenerating,
  onGenerate,
}: BillingReminderBannerProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading billing status...</p>
      </div>
    );
  }

  if (isGenerated) {
    return (
      <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50/80 dark:bg-green-950/20 px-4 py-3 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-900 dark:text-green-100">
            Bills generated for {monthLabel}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-medium text-red-900 dark:text-red-100">
          Bills for {monthLabel} not generated yet.
        </p>
      </div>
      <Button
        size="sm"
        onClick={onGenerate}
        isLoading={isGenerating}
        disabled={isGenerating}
      >
        Generate Now
      </Button>
    </div>
  );
}
