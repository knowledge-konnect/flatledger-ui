import Card, { CardContent } from '../ui/Card';
import Badge from '../ui/Badge';

interface BillingStatusCardProps {
  monthLabel: string;
  isGenerated: boolean;
  generatedCount: number;
  isLoading?: boolean;
}

export default function BillingStatusCard({
  monthLabel,
  isGenerated,
  generatedCount,
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
