import { CheckCircle, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSetupProgress } from '../../hooks/useSetupProgress';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function SetupProgressWidget() {
  const navigate = useNavigate();
  const { progress, isComplete, nextStep } = useSetupProgress();

  const steps = [
    { 
      id: 'society', 
      label: 'Society Profile', 
      route: '/settings/society',
      status: progress >= 34
    },
    { 
      id: 'flats', 
      label: 'Add Flats', 
      route: '/flats',
      status: progress >= 67
    },
    { 
      id: 'opening-balance', 
      label: 'Opening Balance', 
      route: '/settings/opening-balance',
      status: progress === 100
    },
  ];

  const handleContinue = () => {
    const nextStepData = nextStep;
    if (nextStepData) {
      const step = steps.find((s) => s.id === nextStepData.id);
      if (step) {
        navigate(step.route);
      }
    }
  };

  const progressPercentage = progress;

  // Don't show if setup is complete
  if (isComplete) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50 via-purple-50 to-pink-50 dark:from-emerald-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-emerald-200 dark:border-emerald-800">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Setup Progress
            </h3>
          </div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {Math.round(progressPercentage)}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2 mb-3">
          {steps.map((step) => {
            const isNextStep = nextStep && step.id === nextStep.id;
            return (
              <div
                key={step.id}
                className="flex items-center gap-2"
              >
                {step.status ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                )}
                <span
                  className={`text-xs font-medium ${
                    step.status
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {isNextStep && !step.status && (
                  <span className="ml-auto text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                    Next
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        {nextStep && (
          <Button
            onClick={handleContinue}
            className="w-full"
            size="sm"
          >
            Continue Setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </Card>
  );
}
