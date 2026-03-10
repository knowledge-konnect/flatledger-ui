import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSetupProgress } from '../../hooks/useSetupProgress';

const BANNER_DISMISSED_KEY = 'setupBanner_dismissed';

/**
 * Slim, dismissible setup progress banner shown on the Dashboard when setup
 * is not yet complete. Replaces OpeningBalanceAlert + SetupProgressWidget +
 * OnboardingWizard on the dashboard surface.
 */
export default function SetupBanner() {
  const navigate = useNavigate();
  const { progress, isComplete, isLoading, nextStep, steps } = useSetupProgress();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Hide while loading (prevents flash), when complete, or explicitly dismissed
  if (isLoading || isComplete || dismissed) return null;

  const completedCount = steps.filter((s) => s.completed).length;

  // SVG circle maths (r=12, circumference = 2π×12 ≈ 75.4)
  const CIRCUMFERENCE = 75.4;
  const strokeDash = (progress / 100) * CIRCUMFERENCE;

  const handleDismiss = () => {
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">

      {/* Circular progress indicator */}
      <div className="flex-shrink-0 relative w-9 h-9">
        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 32 32">
          {/* Track */}
          <circle
            cx="16" cy="16" r="12"
            fill="none"
            strokeWidth="3.5"
            className="stroke-indigo-100 dark:stroke-indigo-900"
          />
          {/* Progress arc */}
          <circle
            cx="16" cy="16" r="12"
            fill="none"
            strokeWidth="3.5"
            strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            className="stroke-indigo-600 dark:stroke-indigo-400 transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
          {progress}%
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
          Setup {completedCount}/{steps.length} complete
        </span>
        {nextStep && (
          <span className="text-sm text-indigo-700 dark:text-indigo-300 ml-2 hidden sm:inline">
            — Next: <span className="font-medium">{nextStep.label}</span>
          </span>
        )}
      </div>

      {/* Continue CTA */}
      <button
        onClick={() => navigate('/setup')}
        className="flex-shrink-0 flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors whitespace-nowrap"
      >
        Continue Setup
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss setup banner"
        className="flex-shrink-0 text-indigo-300 dark:text-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
