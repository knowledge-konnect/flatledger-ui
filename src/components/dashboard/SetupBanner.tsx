import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSetupProgress, OB_SKIPPED_KEY } from '../../hooks/useSetupProgress';

const BANNER_DISMISSED_KEY = 'setupBanner_dismissed';
const OB_NUDGE_DISMISSED_KEY = 'obNudge_dismissed';

/**
 * Slim, dismissible setup progress banner shown on the Dashboard when setup
 * is not yet complete. Replaces OpeningBalanceAlert + SetupProgressWidget +
 * OnboardingWizard on the dashboard surface.
 *
 * Also renders a separate one-line OB nudge when required steps are complete
 * but Opening Balance has not been applied or explicitly skipped yet.
 */
export default function SetupBanner() {
  const navigate = useNavigate();
  const { progress, isComplete, isLoading, nextStep, steps } = useSetupProgress();

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(BANNER_DISMISSED_KEY) === 'true'; } catch { return false; }
  });

  const [obNudgeDismissed, setObNudgeDismissed] = useState(() => {
    try { return localStorage.getItem(OB_NUDGE_DISMISSED_KEY) === 'true'; } catch { return false; }
  });

  if (isLoading) return null;

  const obStep = steps.find((s) => s.id === 'opening-balance');
  const showObNudge = isComplete && obStep && !obStep.completed && !obNudgeDismissed;

  const completedCount = steps.filter((s) => s.completed).length;

  // SVG circle maths (r=12, circumference = 2π×12 ≈ 75.4)
  const CIRCUMFERENCE = 75.4;
  const strokeDash = (progress / 100) * CIRCUMFERENCE;

  const handleDismiss = () => {
    try { localStorage.setItem(BANNER_DISMISSED_KEY, 'true'); } catch { /* ignore */ }
    setDismissed(true);
  };

  const handleDismissObNudge = () => {
    try { localStorage.setItem(OB_NUDGE_DISMISSED_KEY, 'true'); } catch { /* ignore */ }
    setObNudgeDismissed(true);
  };

  const handleSkipOb = () => {
    try { localStorage.setItem(OB_SKIPPED_KEY, 'true'); } catch { /* ignore */ }
    handleDismissObNudge();
  };

  return (
    <div className="space-y-2">
      {/* ── Main setup progress banner (hidden once required steps done) ── */}
      {!isComplete && !dismissed && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">

          {/* Circular progress indicator */}
          <div className="flex-shrink-0 relative w-9 h-9">
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="12" fill="none" strokeWidth="3.5"
                className="stroke-emerald-100 dark:stroke-emerald-900" />
              <circle cx="16" cy="16" r="12" fill="none" strokeWidth="3.5"
                strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                strokeLinecap="round"
                className="stroke-emerald-600 dark:stroke-emerald-400 transition-all duration-500" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
              {progress}%
            </span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Setup {completedCount}/{steps.length} complete
            </span>
            {nextStep && (
              <span className="text-sm text-emerald-700 dark:text-emerald-300 ml-2 hidden sm:inline">
                — Next: <span className="font-medium">{nextStep.label}</span>
              </span>
            )}
          </div>

          {/* Continue CTA */}
          <button
            onClick={() => navigate('/setup')}
            className="flex-shrink-0 flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors whitespace-nowrap"
          >
            Continue Setup
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Dismiss */}
          <button onClick={handleDismiss} aria-label="Dismiss setup banner"
            className="flex-shrink-0 text-emerald-300 dark:text-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Optional OB nudge (shown after required steps done, OB not resolved) ── */}
      {showObNudge && (
        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
          <span className="text-base leading-none flex-shrink-0">💰</span>
          <p className="flex-1 text-xs text-amber-800 dark:text-amber-200 min-w-0">
            <span className="font-semibold">Opening Balance optional:</span>{' '}
            If migrating from another system, set prior dues &amp; bank balance.{' '}
            <button
              onClick={() => navigate('/settings/opening-balance')}
              className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-100 whitespace-nowrap"
            >
              Set up now
            </button>
            {' · '}
            <button
              onClick={handleSkipOb}
              className="underline hover:text-amber-900 dark:hover:text-amber-100 whitespace-nowrap"
            >
              Skip — no prior dues
            </button>
          </p>
          <button onClick={handleDismissObNudge} aria-label="Dismiss"
            className="flex-shrink-0 text-amber-300 dark:text-amber-700 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
