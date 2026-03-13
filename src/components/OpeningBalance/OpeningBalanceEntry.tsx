import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useFlats } from '../../hooks/useFlats';
import { useOpeningBalanceStatus, useSubmitOpeningBalance } from '../../hooks/useOpeningBalance';
import { useAuth } from '../../contexts/AuthProvider';
import { isFinancialRole, collectUserRoles } from '../../types/roles';
import { FlatBalance, OpeningBalanceSummary } from '../../types/openingBalance.types';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { formatCurrency } from '../../lib/utils';
import OpeningBalancePreviewModal from './OpeningBalancePreviewModal';
import OpeningBalanceAlreadyApplied from './OpeningBalanceAlreadyApplied';
import OpeningBalanceSuccess from './OpeningBalanceSuccess';

export default function OpeningBalanceEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check if user holds a financial-level role (Society Admin, Admin, Treasurer)
  const isTreasurer = isFinancialRole(collectUserRoles(user));
  
  // API hooks
  const { data: statusData, isLoading: statusLoading } = useOpeningBalanceStatus();
  const { data: flatsData, isLoading: flatsLoading } = useFlats();
  const submitMutation = useSubmitOpeningBalance();
  
  // Local state
  const [societyAmount, setSocietyAmount] = useState<string>('0');
  const [flatBalances, setFlatBalances] = useState<Map<string, number>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'quick' | 'all'>('quick');
  const [selectedFlatsForEntry, setSelectedFlatsForEntry] = useState<Set<string>>(new Set());
  const [showFlatSelector, setShowFlatSelector] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');
  const [backendError, setBackendError] = useState<string>('');

  // Initialize flat balances when flats data is loaded
  useEffect(() => {
    if (flatsData && flatBalances.size === 0) {
      const initialBalances = new Map<string, number>();
      flatsData.forEach(flat => {
        initialBalances.set(flat.publicId, 0);
      });
      setFlatBalances(initialBalances);
    }
  }, [flatsData]);

  // Filter flats based on search and view mode
  const flatsWithBalances: FlatBalance[] = useMemo(() => {
    if (!flatsData) return [];
    
    let filtered = flatsData;

    // In quick mode, only show selected flats or flats with non-zero balance
    if (viewMode === 'quick') {
      filtered = flatsData.filter(flat => 
        selectedFlatsForEntry.has(flat.publicId) || 
        (flatBalances.get(flat.publicId) || 0) !== 0
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(flat =>
        flat.flatNo.toLowerCase().includes(query) ||
        flat.ownerName.toLowerCase().includes(query)
      );
    }

    return filtered.map(flat => ({
      flatPublicId: flat.publicId,
      flatNo: flat.flatNo,
      ownerName: flat.ownerName,
      openingBalance: flatBalances.get(flat.publicId) || 0,
    }));
  }, [flatsData, flatBalances, searchQuery, viewMode, selectedFlatsForEntry]);

  // Calculate summary
  const summary: OpeningBalanceSummary = useMemo(() => {
    const societyBal = parseFloat(societyAmount) || 0;
    let totalOutstanding = 0;
    let totalAdvance = 0;
    let flatsWithBal = 0;

    flatBalances.forEach((amount) => {
      if (amount > 0) {
        totalOutstanding += amount;
        flatsWithBal++;
      } else if (amount < 0) {
        totalAdvance += Math.abs(amount);
        flatsWithBal++;
      }
    });

    return {
      societyBalance: societyBal,
      totalOutstanding,
      totalAdvance,
      flatsWithBalance: flatsWithBal,
      totalFlats: flatBalances.size,
    };
  }, [societyAmount, flatBalances]);

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    let general = '';

    const societyBal = parseFloat(societyAmount);
    if (isNaN(societyBal) || societyBal < 0) {
      errors.societyAmount = 'Society amount must be a non-negative number';
    }

    const hasAnyNonZero =
      (parseFloat(societyAmount) || 0) > 0 ||
      Array.from(flatBalances.values()).some((v) => v !== 0);

    if (!hasAnyNonZero) {
      general = 'Please enter at least one opening balance.';
    }

    setValidationErrors(errors);
    setGeneralError(general);
    return Object.keys(errors).length === 0 && !general;
  };

  const handleUpdateFlatBalance = (flatPublicId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFlatBalances(prev => {
      const updated = new Map(prev);
      updated.set(flatPublicId, numValue);
      return updated;
    });
  };

  const handleAddFlatToEntry = (flatPublicId: string) => {
    setSelectedFlatsForEntry(prev => new Set([...prev, flatPublicId]));
    setShowFlatSelector(false);
    // Auto-focus the newly added flat's input after a short delay
    setTimeout(() => {
      const flatIndex = flatsWithBalances.findIndex(f => f.flatPublicId === flatPublicId);
      if (flatIndex !== -1) {
        document.getElementById(`flat-input-${flatIndex}`)?.focus();
      }
    }, 100);
  };

  const handleRemoveFlatFromEntry = (flatPublicId: string) => {
    setSelectedFlatsForEntry(prev => {
      const updated = new Set(prev);
      updated.delete(flatPublicId);
      return updated;
    });
    // Clear balance when removing
    setFlatBalances(prev => {
      const updated = new Map(prev);
      updated.set(flatPublicId, 0);
      return updated;
    });
  };

  // Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextIndex = currentIndex + 1;
      if (nextIndex < flatsWithBalances.length) {
        document.getElementById(`flat-input-${nextIndex}`)?.focus();
      }
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handlePreviewClick = () => {
    if (validate()) {
      setShowPreviewModal(true);
    }
  };

  const handleConfirmSubmit = async () => {
    const flatItems = Array.from(flatBalances.entries())
      .filter(([_, amount]) => amount !== 0)
      .map(([flatPublicId, amount]) => ({
        flatPublicId,
        amount,
      }));

    const payload = {
      transactionDate: new Date().toISOString().split('T')[0],
      society_opening_amount: parseFloat(societyAmount) || 0,
      items: flatItems,
    };

    try {
      await submitMutation.mutateAsync(payload);
      setShowPreviewModal(false);
      setBackendError('');
      setShowSuccessScreen(true);
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { status: number; data?: { message?: string } };
      };
      const status = axiosError?.response?.status;
      const message = axiosError?.response?.data?.message;

      if (status === 400 || status === 409) {
        setBackendError(
          message || 'Invalid request. Please check your data and try again.'
        );
      } else if (status === 403) {
        setBackendError(
          'Opening balance cannot be applied after payments exist.'
        );
      } else {
        setBackendError('An unexpected error occurred. Please try again.');
      }
      console.error('Failed to submit opening balance:', axiosError?.response?.data ?? error);
    }
  };

  // Loading states
  if (statusLoading || flatsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Access control
  if (!isTreasurer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Only Treasurer or Society Admin role can access Migration Setup.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Already applied state
  if (statusData?.isApplied) {
    return <OpeningBalanceAlreadyApplied status={statusData} />;
  }

  // Success screen
  if (showSuccessScreen) {
    return <OpeningBalanceSuccess />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Migration Setup
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            One-time setup to migrate existing balances from your previous system
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Opening balance is recorded as of today. Historical monthly bills are not recreated.
          </p>
        </div>

        {/* Info Banner */}
        {showInfoBanner && (
          <Card className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      What is Migration Setup?
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                      If you're migrating from another system, enter the outstanding balances for your society and each flat. 
                      This ensures accurate financial records going forward.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      <span>⚠️ ONE-TIME MIGRATION — After submission and first payment, balances cannot be edited. Use adjustments for corrections.</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowInfoBanner(false)}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100"
                >
                  {showInfoBanner ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Society Balance */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Society Opening Fund (Bank Balance)
                </h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bank Balance (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={societyAmount}
                    onChange={(e) => setSocietyAmount(e.target.value)}
                    className={`input w-full ${validationErrors.societyAmount ? 'border-red-500' : ''}`}
                    placeholder="Enter society bank balance"
                  />
                  {validationErrors.societyAmount && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.societyAmount}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    This represents your current bank balance at the time of migration.
                  </p>
                </div>
              </div>
            </Card>

            {/* Flat Balances Table */}
            <Card>
              <div className="p-6">
                {/* Header with Mode Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Member Migration Dues
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {viewMode === 'quick' 
                        ? 'Add only flats that have outstanding amounts' 
                        : 'Showing all flats'}
                    </p>
                  </div>
                  
                  {/* Mode Toggle */}
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode('quick')}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                        viewMode === 'quick'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      Quick Entry
                    </button>
                    <button
                      onClick={() => setViewMode('all')}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                        viewMode === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      All Flats
                    </button>
                  </div>
                </div>

                {/* Quick Entry Mode: Add Flat Button */}
                {viewMode === 'quick' && (
                  <div className="mb-4">
                    {!showFlatSelector && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowFlatSelector(true)}
                        className="w-full justify-center"
                        size="sm"
                      >
                        + Add Flat with Outstanding Amount
                      </Button>
                    )}

                    {showFlatSelector && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-slate-900/20 dark:bg-slate-100/10 -m-6 rounded-lg z-10" 
                             onClick={() => setShowFlatSelector(false)} />
                        <div className="relative z-20 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              Select Flat to Add
                            </span>
                            <button
                              onClick={() => setShowFlatSelector(false)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                              ✕
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Search flat number or owner..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input text-sm w-full mb-2"
                            autoFocus
                          />
                          <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded">
                            {flatsData
                              ?.filter(flat => {
                                const query = searchQuery.toLowerCase();
                                const isAlreadyAdded = selectedFlatsForEntry.has(flat.publicId) || 
                                                      (flatBalances.get(flat.publicId) || 0) !== 0;
                                return !isAlreadyAdded && (
                                  flat.flatNo.toLowerCase().includes(query) ||
                                  flat.ownerName.toLowerCase().includes(query)
                                );
                              })
                              .map(flat => (
                                <button
                                  key={flat.publicId}
                                  onClick={() => handleAddFlatToEntry(flat.publicId)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-center"
                                >
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {flat.flatNo}
                                  </span>
                                  <span className="text-slate-600 dark:text-slate-400 text-xs">
                                    {flat.ownerName}
                                  </span>
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tips */}
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded">
                  <span>💡 Positive = Outstanding • Negative = Advance • Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded text-xs">Enter</kbd> for next field</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {Array.from(flatBalances.values()).filter(v => v !== 0).length} entered
                  </span>
                </div>

                {/* Compact Table */}
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Flat
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Owner
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Amount (₹)
                        </th>
                        {viewMode === 'quick' && (
                          <th className="px-3 py-2 w-12"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {flatsWithBalances.map((flat, index) => (
                        <tr key={flat.flatPublicId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 group">
                          <td className="px-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                            {flat.flatNo}
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
                            {flat.ownerName}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              id={`flat-input-${index}`}
                              type="number"
                              step="0.01"
                              value={flat.openingBalance}
                              onChange={(e) => handleUpdateFlatBalance(flat.flatPublicId, e.target.value)}
                              onKeyDown={(e) => handleInputKeyDown(e, index)}
                              onFocus={handleInputFocus}
                              className={`input text-right w-28 text-sm py-1.5 ${
                                flat.openingBalance > 0
                                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 font-semibold'
                                  : flat.openingBalance < 0
                                  ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 font-semibold'
                                  : ''
                              }`}
                              placeholder="0.00"
                            />
                          </td>
                          {viewMode === 'quick' && (
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => handleRemoveFlatFromEntry(flat.flatPublicId)}
                                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove from list"
                              >
                                ✕
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty State */}
                {flatsWithBalances.length === 0 && (
                  <div className="text-center py-12">
                    {viewMode === 'quick' ? (
                      <div className="text-slate-500 dark:text-slate-400">
                        <p className="text-sm font-medium mb-2">No flats added yet</p>
                        <p className="text-xs">Click "Add Flat" button above to get started</p>
                      </div>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400 text-sm">
                        {searchQuery ? 'No flats match your search' : 'No flats found'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Summary
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Society Opening Fund</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(summary.societyBalance)}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400">Member Migration Dues</div>
                    <div className="text-xl font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(summary.totalOutstanding)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Total Opening Advance</div>
                    <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(summary.totalAdvance)}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="text-sm text-slate-600 dark:text-slate-400">Flats with Balance</div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {summary.flatsWithBalance} of {summary.totalFlats}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {/* Confirmation Checkbox */}
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      I confirm these balances are accurate and final.
                    </span>
                  </label>

                  {/* General Validation Error */}
                  {generalError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {generalError}
                    </p>
                  )}

                  {/* Backend Error */}
                  {backendError && (
                    <p className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded px-2.5 py-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {backendError}
                    </p>
                  )}

                  <Button
                    onClick={handlePreviewClick}
                    className="w-full"
                    disabled={submitMutation.isPending || !confirmed}
                  >
                    Preview & Submit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <OpeningBalancePreviewModal
          summary={summary}
          flatBalances={flatBalances}
          flatsData={flatsData || []}
          isSubmitting={submitMutation.isPending}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
