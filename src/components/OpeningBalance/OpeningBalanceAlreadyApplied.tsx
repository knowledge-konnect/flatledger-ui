import { Lock, Calendar, User, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OpeningBalanceStatus } from '../../types/openingBalance.types';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface AppliedSummary {
  societyOpeningAmount: number;
  totalMemberDues: number;
  totalMemberAdvance: number;
}

function loadAppliedSummary(): AppliedSummary | null {
  try {
    const raw = localStorage.getItem('ob_applied_summary');
    if (!raw) return null;
    return JSON.parse(raw) as AppliedSummary;
  } catch {
    return null;
  }
}

interface OpeningBalanceAlreadyAppliedProps {
  status: OpeningBalanceStatus;
}

export default function OpeningBalanceAlreadyApplied({ status }: OpeningBalanceAlreadyAppliedProps) {
  const navigate = useNavigate();
  const appliedSummary = loadAppliedSummary();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Opening Balance Status
          </h1>
        </div>

        {/* Lock Banner */}
        <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-500 rounded-full p-3">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                  Opening Balance Already Applied
                </h2>
                <p className="text-indigo-800 dark:text-indigo-200 mb-4">
                  Your society's opening balances have been set and are locked. This is a one-time operation that cannot be modified to maintain data integrity.
                </p>
                <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                  <Calendar className="w-4 h-4" />
                  <span>Applied on {status.appliedAt ? formatDate(status.appliedAt) : 'N/A'}</span>
                </div>
                {status.appliedBy && (
                  <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                    <User className="w-4 h-4" />
                    <span>By {status.appliedBy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Society Opening Fund
              </h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {appliedSummary ? formatCurrency(appliedSummary.societyOpeningAmount) : <span className="text-slate-400 dark:text-slate-500 text-xl">—</span>}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Initial bank balance
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Member Opening Dues
              </h3>
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {appliedSummary ? formatCurrency(appliedSummary.totalMemberDues) : <span className="text-slate-400 dark:text-slate-500 text-xl">—</span>}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Dues from flats
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Total Advance
              </h3>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {appliedSummary ? formatCurrency(appliedSummary.totalMemberAdvance) : <span className="text-slate-400 dark:text-slate-500 text-xl">—</span>}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Prepaid by flats
            </p>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Why can't I modify opening balances?
          </h3>
          <div className="space-y-3 text-slate-600 dark:text-slate-400">
            <p>
              Opening balances are designed to be a <strong>one-time migration</strong> from your previous system. 
              Once applied, they become part of your immutable financial record.
            </p>
            <p>
              This ensures:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Data integrity and audit compliance</li>
              <li>Accurate historical financial reporting</li>
              <li>Prevention of accidental or unauthorized modifications</li>
              <li>Clear audit trail of initial balances</li>
            </ul>
            <p className="pt-3 text-sm">
              If you believe there's an error in the opening balances, please contact your system administrator or support team.
            </p>
          </div>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/financials')}>
            View Financial Reports
          </Button>
        </div>
      </div>
    </div>
  );
}
