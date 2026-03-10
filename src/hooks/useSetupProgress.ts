import { useMemo } from 'react';
import { useOpeningBalanceStatus } from './useOpeningBalance';
import { useFlats } from './useFlats';
import { useMaintenanceConfig } from './useSocieties';
import { useAuth } from '../contexts/AuthProvider';

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
  isLoading: boolean;
  nextStep: SetupStep | null;
}

/**
 * Hook to calculate setup progress for the onboarding flow
 */
export function useSetupProgress(): SetupProgress {
  const { user } = useAuth();
  const societyId = user?.societyPublicId || '';
  const { data: obStatus, isLoading: obLoading } = useOpeningBalanceStatus();
  const { data: flats, isLoading: flatsLoading } = useFlats();
  const { data: maintenanceConfig, isLoading: maintenanceConfigLoading } = useMaintenanceConfig(societyId);

  const progress = useMemo(() => {
    if (obLoading || flatsLoading || maintenanceConfigLoading) {
      return {
        steps: [],
        progress: 0,
        isComplete: false,
        isLoading: true,
        nextStep: null,
      };
    }

    const flatsCount = Array.isArray(flats) ? flats.length : 0;
    const obApplied = obStatus?.isApplied || false;
    const maintenanceConfigured = (maintenanceConfig?.defaultMonthlyCharge ?? 0) > 0;

    const steps: SetupStep[] = [
      {
        id: 'society',
        label: 'Society Created',
        completed: true, // Always true if user is logged in
        description: 'Your society account is active',
      },
      {
        id: 'maintenance-config',
        label: 'Maintenance Config',
        completed: maintenanceConfigured,
        description: maintenanceConfigured ? 'Monthly charges configured' : 'Set default monthly charge',
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
      isLoading: false,
      nextStep: nextIncompleteStep,
    };
  }, [obStatus, flats, obLoading, flatsLoading, maintenanceConfig, maintenanceConfigLoading]);

  return progress;
}
