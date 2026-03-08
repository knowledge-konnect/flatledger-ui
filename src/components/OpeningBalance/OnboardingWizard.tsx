import { X, ArrowLeft, ArrowRight, CheckCircle, Building2, Home, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingWizard } from '../../hooks/useOnboardingWizard';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const {
    showWizard,
    currentStep,
    totalSteps,
    completeWizard,
    nextStep: goToNextStep,
    prevStep: goToPrevStep,
  } = useOnboardingWizard();

  if (!showWizard) {
    return null;
  }

  const handleClose = () => {
    completeWizard();
  };

  const handleNext = () => {
    if (currentStep === totalSteps) {
      completeWizard();
    } else {
      goToNextStep();
    }
  };

  const handleGetStarted = () => {
    completeWizard();
    navigate('/settings/opening-balance');
  };

  const steps = [
    {
      id: 1,
      icon: Building2,
      title: 'Welcome to Migration Setup',
      description: 'This is a one-time setup to migrate your existing financial data into FlatLedger.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            If you're transitioning from another system or starting fresh with existing balances, 
            this wizard will help you set up your opening balances correctly.
          </p>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  Important: One-Time Operation
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Once submitted, opening balances cannot be modified. Make sure you have accurate data before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      icon: Home,
      title: 'What You\'ll Need',
      description: 'Gather the following information before starting:',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Society Bank Balance
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Current balance in your society's bank account
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Outstanding Dues
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Amount owed by each flat (enter as positive values)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Advance Payments
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Amount paid in advance by flats (enter as negative values)
                </p>
              </div>
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <p className="text-sm text-indigo-900 dark:text-indigo-100">
              💡 <strong>Tip:</strong> Have your previous system's reports or Excel sheets ready for reference.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      icon: Calculator,
      title: 'Ready to Begin?',
      description: 'You can start the setup process now or come back later.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            The setup process will take approximately <strong>10-15 minutes</strong> depending on the number of flats in your society.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                ✅ Start Now
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200">
                If you have all the required information ready, you can complete the setup immediately.
              </p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                ⏰ Come Back Later
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You can always access this from Settings → Opening Balance whenever you're ready.
              </p>
            </Card>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps.find((step) => step.id === currentStep) || steps[0];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg p-3">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {currentStepData.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {currentStepData.description}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={goToPrevStep}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Skip for Now
            </Button>
            {currentStep === totalSteps ? (
              <Button
                onClick={handleGetStarted}
                className="min-w-[140px]"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="min-w-[140px]"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
