import Card, { CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { formatCurrency } from '../../lib/utils';

interface BillingStatusCardProps {
  monthLabel: string;
  isGenerated: boolean;
  generatedCount: number;
  monthlyCharge?: number;
  isLoading?: boolean;
}

export default function BillingStatusCard({
  monthLabel,
  isGenerated,
  generatedCount,
  monthlyCharge,
  isLoading,
}: BillingStatusCardProps) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 space-y-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Billing Status</h3>

        {isLoading ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Month:</span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{monthLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Status:</span>
              <Badge variant={isGenerated ? 'success' : 'error'}>
                {isGenerated ? 'Generated' : 'Not Generated'}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Bills Created:</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{generatedCount}</span>
            </div>
            {isGenerated && monthlyCharge !== undefined && monthlyCharge > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">Charge/Flat:</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyCharge)}</span>
              </div>
            )}
            {isGenerated && monthlyCharge !== undefined && monthlyCharge > 0 && generatedCount > 0 && (
              <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Billed:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(monthlyCharge * generatedCount)}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
