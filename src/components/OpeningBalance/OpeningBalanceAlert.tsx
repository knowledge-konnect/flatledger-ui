import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOpeningBalanceStatus } from '../../hooks/useOpeningBalance';
import { useAlertDismissal } from '../../hooks/useAlertDismissal';
import { useAuth } from '../../contexts/AuthProvider';
import { isFinancialRole, collectUserRoles } from '../../types/roles';
import Button from '../ui/Button';
import Card from '../ui/Card';

const ALERT_KEY = 'openingBalanceAlert';

export default function OpeningBalanceAlert() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: status, isLoading } = useOpeningBalanceStatus();
  const { isDismissed, dismiss } = useAlertDismissal(ALERT_KEY);

  // Only show to financial-role users (Society Admin, Admin, Treasurer)
  const isTreasurer = isFinancialRole(collectUserRoles(user));

  // Don't show if:
  // - Loading
  // - Not treasurer/admin
  // - Already applied
  // - Alert dismissed
  if (isLoading || !isTreasurer || status?.isApplied || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    dismiss();
  };

  const handleSetup = () => {
    navigate('/settings/opening-balance');
  };

  return (
    <Card className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="bg-amber-500 rounded-full p-2.5 flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                Set Up Opening Balance
              </h3>
              <button
                onClick={handleDismiss}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-amber-800 dark:text-amber-200 mb-4">
              Complete your migration by entering opening balances from your previous system. 
              This ensures accurate financial tracking going forward.
            </p>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleSetup}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Set Up Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <button
                onClick={handleDismiss}
                className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
              >
                Remind me later
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
