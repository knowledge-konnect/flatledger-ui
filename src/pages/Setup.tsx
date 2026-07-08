import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ArrowRight,
  Building2,
  Home,
  Calculator,
  Wrench,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useSetupProgress } from '../hooks/useSetupProgress';
import { OB_SKIPPED_KEY } from '../hooks/useSetupProgress';

export const SETUP_REDIRECTED_KEY = 'setup_redirected';

const STEP_CONFIG = [
  {
    id: 'society',
    icon: Building2,
    label: 'Society Profile',
    pendingText: 'Configure your society name, address, and contact details.',
    completedText: 'Your society profile is active and configured.',
    route: '/settings',
    color: 'indigo',
  },
  {
    id: 'maintenance-config',
    icon: Wrench,
    label: 'Maintenance Config',
    pendingText:
      'Set your default monthly maintenance charge, due date, late fee, and grace period.',
    completedText: 'Maintenance charges and billing rules are configured.',
    route: '/settings?section=maintenance-config',
    color: 'orange',
  },
  {
    id: 'flats',
    icon: Home,
    label: 'Add Flats / Units',
    pendingText:
      'Register all the flats or units in your society with member details.',
    completedText: 'Flat units are registered and ready.',
    route: '/flats',
    color: 'purple',
  },
  {
    id: 'opening-balance',
    icon: Calculator,
    label: 'Opening Balance',
    pendingText:
      'Enter your society bank balance and any outstanding dues carried over from your previous system.',
    completedText: 'Opening balances have been applied successfully.',
    route: '/settings/opening-balance',
    color: 'pink',
  },
];

export default function Setup() {
  const navigate = useNavigate();
  const { steps, isComplete, progress } = useSetupProgress();

  // Local toggle so Skip/Undo re-renders immediately without waiting for hook recompute
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  const skipOb = useCallback(() => {
    try { localStorage.setItem(OB_SKIPPED_KEY, 'true'); } catch { /* ignore */ }
    rerender();
  }, [rerender]);

  const undoSkipOb = useCallback(() => {
    try { localStorage.removeItem(OB_SKIPPED_KEY); } catch { /* ignore */ }
    rerender();
  }, [rerender]);

  // Mark that the user has visited the setup page so Dashboard won't auto-redirect again
  useEffect(() => {
    try {
      sessionStorage.setItem(SETUP_REDIRECTED_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const nextIncompleteStep = steps.find((s) => !s.completed);
  const obStep = steps.find((s) => s.id === 'opening-balance');
  const obPending = Boolean(obStep && !obStep.completed && !obStep.skipped);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <DashboardLayout title="Setup">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-lg shadow-emerald-500/30">
              {isComplete && !obPending ? (
                <Sparkles className="w-8 h-8 text-white" />
              ) : (
                <span className="text-3xl leading-none">🏢</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
              {isComplete && !obPending
                ? 'Setup Complete!'
                : obPending
                ? 'Almost There!'
                : 'Get Started with FlatLedger'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm">
              {isComplete && !obPending
                ? 'Your society is fully configured. Head to your dashboard to get started.'
                : obPending
                ? 'Your society is ready to use. Set up Opening Balance to carry over any prior dues or bank balance.'
                : 'Complete these steps to get your society fully up and running.'}
            </p>
          </div>

          {/* ── Overall Progress Bar ──────────────────────────────────────── */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {progress}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {steps.filter((s) => s.completed).length} of {steps.length} steps
              complete
            </p>
          </Card>

          <Card className="p-5 border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recommended setup path</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  For a small society, the quickest path is to set maintenance rules, add flats, and then start recording payments.
                </p>
              </div>
              <div className="rounded-full bg-white/80 dark:bg-slate-900/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {nextIncompleteStep ? `Up next: ${nextIncompleteStep.id === 'opening-balance' ? 'Opening Balance' : nextIncompleteStep.label}` : 'All set'}
              </div>
            </div>
          </Card>

          {/* ── Step Cards ────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {STEP_CONFIG.map((config, index) => {
              const stepData = steps.find((s) => s.id === config.id);
              const isDone = stepData?.completed ?? false;
              const isSkipped = stepData?.skipped ?? false;
              const isObStep = config.id === 'opening-balance';
              const isNext = nextIncompleteStep?.id === config.id;
              const Icon = config.icon;

              return (
                <Card
                  key={config.id}
                  className={`p-6 transition-all duration-200 ${
                    isDone && !isSkipped
                      ? 'border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-950/10'
                      : isSkipped
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40'
                      : isNext
                      ? 'border-emerald-300 dark:border-emerald-700 shadow-md ring-1 ring-emerald-200 dark:ring-emerald-800'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                        isDone && !isSkipped
                          ? 'bg-green-100 dark:bg-green-900/40'
                          : isSkipped
                          ? 'bg-slate-100 dark:bg-slate-800'
                          : isNext
                          ? 'bg-emerald-100 dark:bg-emerald-900/40'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {isDone && !isSkipped ? (
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Icon
                          className={`w-5 h-5 ${
                            isSkipped
                              ? 'text-slate-400 dark:text-slate-500'
                              : isNext
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Step {index + 1}
                        </span>
                        {isDone && !isSkipped && (
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                            Done
                          </span>
                        )}
                        {isSkipped && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            Skipped
                          </span>
                        )}
                        {!isDone && !isSkipped && isNext && (
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                            Up Next
                          </span>
                        )}
                        {isObStep && !isDone && !isSkipped && (
                          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 italic">
                            Optional
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                        {config.label}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isDone && !isSkipped ? config.completedText : stepData?.description ?? config.pendingText}
                      </p>
                      {/* Undo skip link */}
                      {isSkipped && (
                        <button
                          onClick={undoSkipOb}
                          className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                        >
                          Undo — I do have prior dues
                        </button>
                      )}
                    </div>

                    {/* CTA */}
                    {!isDone && !isSkipped && (
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant={isNext ? 'primary' : 'outline'}
                          onClick={() => navigate(config.route)}
                        >
                          {isNext ? 'Start' : 'Go'}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                        {isObStep && (
                          <button
                            onClick={skipOb}
                            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium whitespace-nowrap"
                          >
                            Skip — no prior dues
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ── Footer CTA ────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3 pb-10">
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                onClick={handleGoToDashboard}
                variant={isComplete && !obPending ? 'outline' : 'outline'}
                className="min-w-[200px]"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                {isComplete && !obPending ? 'Go to Dashboard' : 'Skip for Now'}
              </Button>
              {isComplete && !obPending && (
                <Button
                  size="lg"
                  variant="primary"
                  className="min-w-[200px]"
                  onClick={() => navigate('/maintenance')}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Generate First Bill
                </Button>
              )}
            </div>
            {(!isComplete || obPending) && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                You can return to this setup anytime from the Settings menu.
              </p>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
