import { useState } from 'react';
import { logger } from '../lib/logger';

export interface WizardStep {
  id: number;
  title: string;
  description: string;
}

const STORAGE_KEY = 'onboardingWizard_completed';

/**
 * Hook to manage onboarding wizard state
 */
export function useOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showWizard, setShowWizard] = useState(!isCompleted);

  const steps: WizardStep[] = [
    {
      id: 1,
      title: 'Welcome to FlatLedger',
      description: 'Let\'s set up your society management system in a few simple steps',
    },
    {
      id: 2,
      title: 'Review Your Flats',
      description: 'You have registered your flat units. Next, we\'ll set up financial data',
    },
    {
      id: 3,
      title: 'Migrating from Another System?',
      description: 'If you have existing balances, we\'ll help you import them',
    },
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeWizard = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsCompleted(true);
      setShowWizard(false);
    } catch (error) {
      logger.error('Failed to complete wizard', error);
    }
  };

  const resetWizard = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setCurrentStep(1);
      setIsCompleted(false);
      setShowWizard(true);
    } catch (error) {
      logger.error('Failed to reset wizard', error);
    }
  };

  return {
    currentStep,
    steps,
    nextStep,
    prevStep,
    completeWizard,
    resetWizard,
    isCompleted,
    showWizard,
    setShowWizard,
    totalSteps: steps.length,
  };
}
