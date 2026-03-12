import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function OpeningBalanceSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = React.useState(5);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 text-center">
        {/* Success Icon */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          Opening Balance Applied Successfully!
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
          Your opening balances have been recorded and are now reflected in the system.
        </p>

        {/* Features List */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            What happens next?
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-slate-100">Society Opening Fund:</strong> Your bank balance is now set and will be tracked going forward
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-slate-100">Member Migration Dues:</strong> Outstanding and advance payments are recorded for each flat
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-slate-100">Financial Reports:</strong> All reports will now include opening balances in calculations
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-slate-100">Immutable Record:</strong> Opening balances are locked and cannot be changed
              </span>
            </li>
          </ul>
        </div>

        {/* Auto-redirect Message */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <span>Redirecting to dashboard in {countdown} seconds...</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={() => navigate('/dashboard')}
            size="lg"
            className="min-w-[180px]"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/financials')}
            size="lg"
          >
            View Financials
          </Button>
        </div>
      </Card>
    </div>
  );
}
