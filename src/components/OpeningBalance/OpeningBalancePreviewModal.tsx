import React from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import { FlatDto } from '../../api/flatsApi';
import { OpeningBalanceSummary } from '../../types/openingBalance.types';
import Button from '../ui/Button';
import Card from '../ui/Card';

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Get list of flats with non-zero balances
  const flatsWithBalances = Array.from(flatBalances.entries())
    .filter(([_, amount]) => amount !== 0)
    .map(([publicId, amount]) => {
      const flat = flatsData.find((f) => f.publicId === publicId);
      return {
        flatNo: flat?.flatNo || 'Unknown',
        ownerName: flat?.ownerName || 'Unknown',
        amount,
      };
    })
    .sort((a, b) => a.flatNo.localeCompare(b.flatNo, undefined, { numeric: true }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Review & Confirm Migration Setup
          </h2>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warning Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Important: One-Time Operation
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Once submitted, opening balances <strong>cannot be modified</strong>. Please review carefully before confirming.
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
              <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
                Society Opening Fund
              </div>
              <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                {formatCurrency(summary.societyBalance)}
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
              <div className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                Member Opening Dues
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {formatCurrency(summary.totalOutstanding)}
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                Advance Payments
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(summary.totalAdvance)}
              </div>
            </Card>
          </div>

          {/* Flat Details Table */}
          {flatsWithBalances.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Member Migration Dues ({flatsWithBalances.length})
              </h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                          Flat No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                          Owner
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {flatsWithBalances.map((flat, index) => (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {flat.flatNo}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {flat.ownerName}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold">
                            <span className={flat.amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                              {formatCurrency(Math.abs(flat.amount))}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {flat.amount > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                Outstanding
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
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

          {/* Confirmation Checkbox */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={isSubmitting}
                className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  I confirm the accuracy of these values
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  I understand that once submitted, opening balances cannot be modified. All values have been verified and are accurate.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!confirmed || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm & Submit
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
