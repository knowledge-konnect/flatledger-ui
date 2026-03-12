import { Lock, Calendar, User, Building2, ArrowLeft, CheckCircle2, TrendingDown, TrendingUp, ShieldCheck, FileBarChart2, AlertCircle } from 'lucide-react';
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const whyPoints = [
    { icon: ShieldCheck, text: 'Data integrity and audit compliance' },
    { icon: FileBarChart2, text: 'Accurate historical financial reporting' },
    { icon: Lock, text: 'Prevention of unauthorized modifications' },
    { icon: AlertCircle, text: 'Clear audit trail of initial balances' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back nav */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 shadow-lg">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="bg-white/20 rounded-full p-4 flex-shrink-0">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-100">One-time setup · Locked</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                Opening Balance Applied
              </h1>
              <p className="text-emerald-100 text-sm">
                Your society's financials are initialised and locked for integrity.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 text-emerald-100 text-xs sm:text-right">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{status.appliedAt ? formatDate(status.appliedAt) : 'N/A'}</span>
              </div>
              {status.appliedBy && (
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{status.appliedBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Society Fund</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {appliedSummary ? formatCurrency(appliedSummary.societyOpeningAmount) : <span className="text-slate-300 dark:text-slate-600">—</span>}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Initial bank balance</p>
          </Card>

          <Card className="p-5 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Member Dues</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
              {appliedSummary ? formatCurrency(appliedSummary.totalMemberDues) : <span className="text-slate-300 dark:text-slate-600">—</span>}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Dues from flats</p>
          </Card>

          <Card className="p-5 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Advance</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {appliedSummary ? formatCurrency(appliedSummary.totalMemberAdvance) : <span className="text-slate-300 dark:text-slate-600">—</span>}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Prepaid by flats</p>
          </Card>
        </div>

        {/* Why can't I modify */}
        <Card className="p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Why can't I modify opening balances?
            </h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Opening balances are a <span className="font-medium text-slate-700 dark:text-slate-300">one-time migration</span> from your previous system. Once applied, they become part of your immutable financial record.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {whyPoints.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
                <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-400">{text}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            If you believe there's an error, please contact your system administrator or support team.
          </p>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-4">
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/reports')}>
            View Reports
          </Button>
        </div>

      </div>
    </div>
  );
}
