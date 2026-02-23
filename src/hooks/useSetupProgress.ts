import { useMemo } from 'react';
import { useOpeningBalanceStatus } from './useOpeningBalance';
import { useFlats } from './useFlats';

export interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
  description: string;
}

export interface SetupProgress {
  steps: SetupStep[];
  progress: number;
  isComplete: boolean;
  nextStep: SetupStep | null;
}

/**
 * Hook to calculate setup progress for the onboarding flow
 */
export function useSetupProgress(): SetupProgress {
  const { data: obStatus, isLoading: obLoading } = useOpeningBalanceStatus();
  const { data: flats, isLoading: flatsLoading } = useFlats();

  const progress = useMemo(() => {
    if (obLoading || flatsLoading) {
      return {
        steps: [],
        progress: 0,
        isComplete: false,
        nextStep: null,
      };
    }

    const flatsCount = Array.isArray(flats) ? flats.length : 0;
    const obApplied = obStatus?.isApplied || false;

    const steps: SetupStep[] = [
      {
        id: 'society',
        label: 'Society Created',
        completed: true, // Always true if user is logged in
        description: 'Your society account is active',
      },
      {
        id: 'flats',
        label: 'Flats Added',
        completed: flatsCount > 0,
        description: `${flatsCount} ${flatsCount === 1 ? 'flat' : 'flats'} registered`,
      },
      {
        id: 'opening-balance',
        label: 'Opening Balance',
        completed: obApplied,
        description: obApplied ? 'Applied successfully' : 'Pending setup',
      },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const progressPercentage = Math.round((completedCount / steps.length) * 100);
    const nextIncompleteStep = steps.find((s) => !s.completed) || null;

    return {
      steps,
      progress: progressPercentage,
      isComplete: completedCount === steps.length,
      nextStep: nextIncompleteStep,
    };
  }, [obStatus, flats, obLoading, flatsLoading]);

  return progress;
}
