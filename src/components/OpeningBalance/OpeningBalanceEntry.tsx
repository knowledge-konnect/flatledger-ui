import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, ChevronRight, Search, X, Building2, Users, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useFlats } from '../../hooks/useFlats';
import { useOpeningBalanceStatus, useSubmitOpeningBalance } from '../../hooks/useOpeningBalance';
import { useAuth } from '../../contexts/AuthProvider';
import { isAdminRole, collectUserRoles } from '../../types/roles';
import { FlatBalance, OpeningBalanceSummary } from '../../types/openingBalance.types';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { formatCurrency } from '../../lib/utils';
import OpeningBalancePreviewModal from './OpeningBalancePreviewModal';
import OpeningBalanceAlreadyApplied from './OpeningBalanceAlreadyApplied';
import OpeningBalanceSuccess from './OpeningBalanceSuccess';
import { logger } from '../../lib/logger';

export default function OpeningBalanceEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check if user is Society Admin
  const isTreasurer = isAdminRole(collectUserRoles(user));
  
  // API hooks
  const { data: statusData, isLoading: statusLoading } = useOpeningBalanceStatus();
  const { data: flatsData, isLoading: flatsLoading } = useFlats();
  const submitMutation = useSubmitOpeningBalance();
  
  // Local state
  const [societyAmount, setSocietyAmount] = useState<string>('0');
  const [flatBalances, setFlatBalances] = useState<Map<string, number>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'quick' | 'all'>('quick');
  const [selectedFlatsForEntry, setSelectedFlatsForEntry] = useState<Set<string>>(new Set());
  const [showFlatSelector, setShowFlatSelector] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');
  const [backendError, setBackendError] = useState<string>('');
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftResolved, setDraftResolved] = useState(false);
  const draftKey = 'opening_balance_draft';

  // Check for existing draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        JSON.parse(savedDraft);
        setHasDraft(true);
        setShowRestorePrompt(true);
      } catch (e) {
        localStorage.removeItem(draftKey);
        setDraftResolved(true);
      }
    } else {
      setDraftResolved(true);
    }
  }, []);

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

  // Auto-save draft only when there is meaningful data
  useEffect(() => {
    if (!draftResolved) return;
    const hasMeaningfulData =
      (parseFloat(societyAmount) || 0) > 0 ||
      Array.from(flatBalances.values()).some(v => v !== 0);
    if (hasMeaningfulData) {
      const draft = {
        societyAmount,
        flatBalances: Array.from(flatBalances.entries()),
        selectedFlatsForEntry: Array.from(selectedFlatsForEntry),
        viewMode,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } else {
      // Remove stale blank draft so the prompt doesn't reappear
      localStorage.removeItem(draftKey);
    }
  }, [societyAmount, flatBalances, selectedFlatsForEntry, viewMode, draftResolved]);

  // Restore draft from localStorage
  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved);
        setSocietyAmount(draft.societyAmount);
        setFlatBalances(new Map(draft.flatBalances));
        setSelectedFlatsForEntry(new Set(draft.selectedFlatsForEntry));
        setViewMode(draft.viewMode);
      }
    } catch (e) {
      logger.error('Failed to restore draft', e);
    }
    setDraftResolved(true);
    setShowRestorePrompt(false);
    setHasDraft(false);
  };

  // Clear draft (user chooses to start fresh)
  const handleClearDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftResolved(true);
    setShowRestorePrompt(false);
    setHasDraft(false);
  };

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

  const isDirty = useMemo(() => {
    return (parseFloat(societyAmount) || 0) > 0 || Array.from(flatBalances.values()).some(v => v !== 0);
  }, [societyAmount, flatBalances]);

  useEffect(() => {
    if (!isDirty || showSuccessScreen || statusData?.isApplied) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, showSuccessScreen, statusData?.isApplied]);

  const handleExit = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved opening balance changes. Leave this page?');
      if (!confirmed) return;
    }
    navigate(-1);
  };

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
    setSearchQuery('');
    // Auto-focus the newly added flat's input after React re-renders
    setTimeout(() => {
      document.getElementById(`flat-input-${flatPublicId}`)?.focus();
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
      const nextFlat = flatsWithBalances[currentIndex + 1];
      if (nextFlat) {
        document.getElementById(`flat-input-${nextFlat.flatPublicId}`)?.focus();
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
      logger.error('Failed to submit opening balance', { status: axiosError?.response?.status });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* -- Draft restore dialog -- */}
      {showRestorePrompt && hasDraft && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Unsaved draft found</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
              You have a draft from a previous session. Would you like to continue where you left off?
            </p>
            <div className="flex gap-3">
              <Button onClick={handleRestoreDraft} className="flex-1">Continue draft</Button>
              <Button variant="outline" onClick={handleClearDraft} className="flex-1">Start fresh</Button>
            </div>
          </div>
        </div>
      )}

      {/* -- Page header -- */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={handleExit}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">Migration Setup</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Set opening balances for your society before going live</p>
          </div>
          {/* Step pills */}
          <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
            {[
              { n: 1, done: parseFloat(societyAmount) > 0, color: 'emerald' },
              { n: 2, done: Array.from(flatBalances.values()).some(v => v !== 0), color: 'emerald' },
              { n: 3, done: parseFloat(societyAmount) > 0 || Array.from(flatBalances.values()).some(v => v !== 0), color: 'emerald' },
            ].map((s, i, arr) => (
              <span key={s.n} className="flex items-center gap-1.5">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all ${
                  s.done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900'
                }`}>
                  {s.done ? <CheckCircle2 className="w-3 h-3" /> : s.n}
                </span>
                {i < arr.length - 1 && <span className="w-4 h-px bg-slate-300 dark:bg-slate-600" />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* -- Body -- */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* -- Left column: steps -- */}
          <div className="lg:col-span-2 space-y-5">

            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
                  parseFloat(societyAmount) > 0
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {parseFloat(societyAmount) > 0 ? '✓' : '1'}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Society Bank Balance</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Current bank balance at the time of migration</p>
                </div>
              </div>
              <div className="p-5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Amount (₹)
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={societyAmount}
                      onChange={(e) => setSocietyAmount(e.target.value)}
                      className={`input w-full pl-8 text-xl py-3 font-bold tabular-nums ${
                        validationErrors.societyAmount
                          ? 'border-2 border-red-500 focus:ring-red-200'
                          : parseFloat(societyAmount) > 0
                          ? 'border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                          : ''
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {parseFloat(societyAmount) > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      <CheckCircle2 className="w-4 h-4" /> Recorded
                    </span>
                  )}
                </div>
                {validationErrors.societyAmount && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {validationErrors.societyAmount}
                  </p>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
                    Array.from(flatBalances.values()).some(v => v !== 0)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {Array.from(flatBalances.values()).some(v => v !== 0) ? '✓' : '2'}
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Member Opening Balances</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Outstanding dues and advance payments per member</p>
                  </div>
                </div>
                {/* Mode toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 shrink-0">
                  {(['quick', 'all'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all capitalize ${
                        viewMode === mode
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 space-y-4">

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {Array.from(flatBalances.values()).filter(v => v !== 0).length} of {summary.totalFlats} members configured
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">
                      {summary.totalFlats > 0
                        ? Math.round((Array.from(flatBalances.values()).filter(v => v !== 0).length / summary.totalFlats) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: summary.totalFlats > 0
                          ? `${(Array.from(flatBalances.values()).filter(v => v !== 0).length / summary.totalFlats) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>

                {/* Balance legend */}
                <div className="flex flex-wrap gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-400 flex-shrink-0" />
                    Positive = member owes society
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-green-400 flex-shrink-0" />
                    Negative = advance paid
                  </span>
                  <kbd className="text-slate-400 dark:text-slate-500">Enter ↵ to move to next row</kbd>
                </div>

                {/* Quick mode: add button / selector */}
                {viewMode === 'quick' && (
                  <>
                    <button
                      onClick={() => { setShowFlatSelector(true); setSearchQuery(''); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400 transition-all"
                    >
                      + Add member with balance
                    </button>

                    {showFlatSelector && (
                      <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] p-4 sm:p-6"
                        onClick={() => { setShowFlatSelector(false); setSearchQuery(''); }}
                      >
                        <div
                          className="mx-auto mt-16 w-full max-w-lg rounded-xl border-2 border-emerald-400 dark:border-emerald-600 overflow-hidden shadow-2xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800">
                            <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Select a member</span>
                            <button
                              onClick={() => { setShowFlatSelector(false); setSearchQuery(''); }}
                              className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-3 bg-white dark:bg-slate-800">
                            <div className="relative mb-2">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Search flat no. or owner..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input text-sm w-full pl-9"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 rounded-lg border border-slate-100 dark:border-slate-700">
                              {flatsData
                                ?.filter(flat => {
                                  const q = searchQuery.toLowerCase();
                                  const alreadyAdded = selectedFlatsForEntry.has(flat.publicId) || (flatBalances.get(flat.publicId) || 0) !== 0;
                                  return !alreadyAdded && (flat.flatNo.toLowerCase().includes(q) || flat.ownerName.toLowerCase().includes(q));
                                })
                                .map(flat => (
                                  <button
                                    key={flat.publicId}
                                    onClick={() => handleAddFlatToEntry(flat.publicId)}
                                    className="w-full px-3 py-2.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-between transition-colors group"
                                  >
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{flat.flatNo}</div>
                                      <div className="text-xs text-slate-500">{flat.ownerName}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                  </button>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* All mode search */}
                {viewMode === 'all' && (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by flat number or owner name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input text-sm w-full pl-9"
                    />
                  </div>
                )}

                {/* Members list */}
                {flatsWithBalances.length > 0 ? (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800 text-left">
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-24">Flat</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Owner</th>
                            <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right">Balance (₹)</th>
                            {viewMode === 'quick' && <th className="w-10" />}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {flatsWithBalances.map((flat, index) => (
                            <tr key={flat.flatPublicId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">{flat.flatNo}</td>
                              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-xs">{flat.ownerName}</td>
                              <td className="px-4 py-2.5 text-right">
                                <input
                                  id={`flat-input-${flat.flatPublicId}`}
                                  type="number"
                                  step="0.01"
                                  value={flat.openingBalance}
                                  onChange={(e) => handleUpdateFlatBalance(flat.flatPublicId, e.target.value)}
                                  onKeyDown={(e) => handleInputKeyDown(e, index)}
                                  onFocus={handleInputFocus}
                                  className={`input text-right w-32 py-1.5 font-semibold text-sm border-2 transition-colors ${
                                    flat.openingBalance > 0
                                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                                      : flat.openingBalance < 0
                                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                                      : 'border-slate-200 dark:border-slate-700'
                                  }`}
                                  placeholder="0"
                                />
                              </td>
                              {viewMode === 'quick' && (
                                <td className="px-2 py-2.5 text-center">
                                  <button
                                    onClick={() => handleRemoveFlatFromEntry(flat.flatPublicId)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-all"
                                    title="Remove"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-2">
                      {flatsWithBalances.map((flat, index) => (
                        <div key={flat.flatPublicId} className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{flat.flatNo}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{flat.ownerName}</div>
                            </div>
                            {viewMode === 'quick' && (
                              <button
                                onClick={() => handleRemoveFlatFromEntry(flat.flatPublicId)}
                                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <input
                            id={`flat-input-${flat.flatPublicId}`}
                            type="number"
                            step="0.01"
                            value={flat.openingBalance}
                            onChange={(e) => handleUpdateFlatBalance(flat.flatPublicId, e.target.value)}
                            onKeyDown={(e) => handleInputKeyDown(e, index)}
                            onFocus={handleInputFocus}
                            className={`input w-full py-2 font-semibold text-sm border-2 transition-colors ${
                              flat.openingBalance > 0
                                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                                : flat.openingBalance < 0
                                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                            placeholder="Enter balance"
                          />
                          <div className="text-xs mt-1.5">
                            {flat.openingBalance > 0 && <span className="text-red-600 dark:text-red-400">Outstanding due</span>}
                            {flat.openingBalance < 0 && <span className="text-green-600 dark:text-green-400">Advance paid</span>}
                            {flat.openingBalance === 0 && <span className="text-slate-400">No balance</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-10 bg-slate-50 dark:bg-slate-800/30">
                    <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {searchQuery ? 'No matching members' : viewMode === 'quick' ? 'No members added yet' : 'No members found'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {searchQuery ? 'Try a different search term' : viewMode === 'quick' ? 'Use the button above to add members' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className={`rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${
              parseFloat(societyAmount) > 0 || Array.from(flatBalances.values()).some(v => v !== 0)
                ? 'border-emerald-300 dark:border-emerald-700'
                : 'border-slate-200 dark:border-slate-800 opacity-60'
            }`}>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 px-5 py-4 flex items-center gap-3 border-b border-emerald-200 dark:border-emerald-800">
                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
                  parseFloat(societyAmount) > 0 || Array.from(flatBalances.values()).some(v => v !== 0)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                }`}>3</span>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Review & Submit</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Complete steps 1 &amp; 2 to enable submission</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5">
                {!(parseFloat(societyAmount) > 0 || Array.from(flatBalances.values()).some(v => v !== 0)) ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">Enter at least one balance above to continue.</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Check the summary panel, then click <strong className="text-slate-900 dark:text-slate-100">Preview & Submit</strong> to review before confirming. <span className="text-amber-600 dark:text-amber-400 font-medium">This action is permanent.</span>
                    </p>
                    {generalError && (
                      <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {generalError}
                      </div>
                    )}
                    <Button
                      onClick={handlePreviewClick}
                      disabled={submitMutation.isPending}
                      className="w-full sm:w-auto px-8 py-2.5 font-semibold"
                    >
                      {submitMutation.isPending ? 'Submitting…' : 'Preview & Submit →'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* -- Right column: summary sidebar -- */}
          <div className="lg:col-span-1">
            <div className="sticky top-[73px] space-y-3">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Live Summary</h2>
                </div>
                <div className="p-4 space-y-3">
                  {/* Society */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Society Fund</div>
                      <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200 tabular-nums truncate">
                        {formatCurrency(summary.societyBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Dues */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-red-700 dark:text-red-400 font-medium">Member Dues</div>
                      <div className="text-lg font-bold text-red-800 dark:text-red-200 tabular-nums truncate">
                        {formatCurrency(summary.totalOutstanding)}
                      </div>
                      <div className="text-xs text-red-500 dark:text-red-500">
                        {(() => { const c = Array.from(flatBalances.values()).filter(v => v > 0).length; return `${c} ${c === 1 ? 'member' : 'members'}`; })()}
                      </div>
                    </div>
                  </div>

                  {/* Advance */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-green-700 dark:text-green-400 font-medium">Advances</div>
                      <div className="text-lg font-bold text-green-800 dark:text-green-200 tabular-nums truncate">
                        {formatCurrency(summary.totalAdvance)}
                      </div>
                    </div>
                  </div>

                  {/* Count */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configured</div>
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {summary.flatsWithBalance}
                        <span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1">/ {summary.totalFlats}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backend error + Cancel */}
              <div className="space-y-2">
                {backendError && (
                  <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {backendError}
                  </div>
                )}
                <button
                  onClick={handleExit}
                  className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors"
                >
                  ← Cancel and go back
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* -- Preview modal -- */}
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
