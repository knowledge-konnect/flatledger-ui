import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  ArrowRight,
  Building2,
  Home,
  Calculator,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useSetupProgress } from '../hooks/useSetupProgress';

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

  // Mark that the user has visited the setup page so Dashboard won't auto-redirect again
  useEffect(() => {
    try {
      localStorage.setItem(SETUP_REDIRECTED_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const nextIncompleteStep = steps.find((s) => !s.completed);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <DashboardLayout title="Setup">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              {isComplete ? (
                <Sparkles className="w-8 h-8 text-white" />
              ) : (
                <span className="text-3xl leading-none">🏢</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isComplete ? 'Setup Complete!' : 'Get Started with SocietyLedger'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto text-sm">
              {isComplete
                ? 'Your society is fully configured. Head to your dashboard to get started.'
                : 'Complete these 3 steps to get your society fully up and running.'}
            </p>
          </div>

          {/* ── Overall Progress Bar ──────────────────────────────────────── */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {progress}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {steps.filter((s) => s.completed).length} of {steps.length} steps
              complete
            </p>
          </Card>

          {/* ── Step Cards ────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {STEP_CONFIG.map((config, index) => {
              const stepData = steps.find((s) => s.id === config.id);
              const isDone = stepData?.completed ?? false;
              const isNext = nextIncompleteStep?.id === config.id;
              const Icon = config.icon;

              return (
                <Card
                  key={config.id}
                  className={`p-6 transition-all duration-200 ${
                    isDone
                      ? 'border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-950/10'
                      : isNext
                      ? 'border-indigo-300 dark:border-indigo-700 shadow-md ring-1 ring-indigo-200 dark:ring-indigo-800'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                        isDone
                          ? 'bg-green-100 dark:bg-green-900/40'
                          : isNext
                          ? 'bg-indigo-100 dark:bg-indigo-900/40'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Icon
                          className={`w-5 h-5 ${
                            isNext
                              ? 'text-indigo-600 dark:text-indigo-400'
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
                        {isDone && (
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                            Done
                          </span>
                        )}
                        {!isDone && isNext && (
                          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                            Up Next
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                        {config.label}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isDone ? config.completedText : config.pendingText}
                      </p>
                    </div>

                    {/* CTA */}
                    {!isDone && (
                      <Button
                        size="sm"
                        variant={isNext ? 'primary' : 'outline'}
                        onClick={() => navigate(config.route)}
                        className="flex-shrink-0"
                      >
                        {isNext ? 'Start' : 'Go'}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* ── Footer CTA ────────────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3 pb-10">
            <Button
              size="lg"
              onClick={handleGoToDashboard}
              variant={isComplete ? 'primary' : 'outline'}
              className="min-w-[200px]"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              {isComplete ? 'Go to Dashboard' : 'Skip for Now'}
            </Button>
            {!isComplete && (
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
