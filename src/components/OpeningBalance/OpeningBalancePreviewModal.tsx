import React from 'react';
import { X, AlertTriangle, Check, Lock, Building2, TrendingDown, TrendingUp, Users, ArrowLeft } from 'lucide-react';
import { FlatDto } from '../../api/flatsApi';
import { OpeningBalanceSummary } from '../../types/openingBalance.types';
import Button from '../ui/Button';

interface OpeningBalancePreviewModalProps {
  summary: OpeningBalanceSummary;
  flatBalances: Map<string, number>;
  flatsData: FlatDto[];
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function OpeningBalancePreviewModal({
  summary,
  flatBalances,
  flatsData,
  isSubmitting,
  onConfirm,
  onCancel,
}: OpeningBalancePreviewModalProps) {
  const [confirmed, setConfirmed] = React.useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  const flatsWithBalances = Array.from(flatBalances.entries())
    .filter(([_, amount]) => amount !== 0)
    .map(([publicId, amount]) => {
      const flat = flatsData.find((f) => f.publicId === publicId);
      return { flatNo: flat?.flatNo || 'Unknown', ownerName: flat?.ownerName || 'Unknown', amount };
    })
    .sort((a, b) => a.flatNo.localeCompare(b.flatNo, undefined, { numeric: true }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Final Review</h2>
              <p className="text-emerald-100 text-xs mt-0.5">This action is permanent and cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-white/70 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Warning strip */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-6 py-3 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Once submitted, opening balances <strong>cannot be modified</strong>. Please verify every value below.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Society Fund</span>
                </div>
                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-100 tabular-nums">
                  {formatCurrency(summary.societyBalance)}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide">Member Dues</span>
                </div>
                <div className="text-xl font-bold text-red-800 dark:text-red-100 tabular-nums">
                  {formatCurrency(summary.totalOutstanding)}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Advances</span>
                </div>
                <div className="text-xl font-bold text-green-800 dark:text-green-100 tabular-nums">
                  {formatCurrency(summary.totalAdvance)}
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Members</span>
                </div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                  {summary.flatsWithBalance}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">/ {summary.totalFlats}</span>
                </div>
              </div>
            </div>

            {/* Member details table */}
            {flatsWithBalances.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  Member Balances ({flatsWithBalances.length})
                </h3>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Flat</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Owner</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {flatsWithBalances.map((flat, index) => (
                          <tr key={index} className={`${flat.amount > 0 ? 'hover:bg-red-50/50 dark:hover:bg-red-950/10' : 'hover:bg-green-50/50 dark:hover:bg-green-950/10'}`}>
                            <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">{flat.flatNo}</td>
                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[160px]">{flat.ownerName}</td>
                            <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                              <span className={flat.amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                                {formatCurrency(Math.abs(flat.amount))}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {flat.amount > 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                                  Due
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                                  Advance
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation */}
            <label className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-4 transition-colors ${
              confirmed
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
            }`}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={isSubmitting}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  I confirm all values are correct and final
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Once submitted, opening balances are locked and cannot be changed.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Edit
            </span>
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!confirmed || isSubmitting}
            className="min-w-[160px] bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Confirm & Submit
              </span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
