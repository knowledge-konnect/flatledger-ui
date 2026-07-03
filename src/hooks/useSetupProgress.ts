import { useMemo } from 'react';
import { useOpeningBalanceStatus } from './useOpeningBalance';
import { useFlats } from './useFlats';
import { useMaintenanceConfig } from './useSocieties';
import { useAuth } from '../contexts/AuthProvider';

export const OB_SKIPPED_KEY = 'ob_skipped';

export interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
  skipped?: boolean;
  description: string;
}

export interface SetupProgress {
  steps: SetupStep[];
  progress: number;
  isComplete: boolean;
  isOpeningBalancePending: boolean;
  isLoading: boolean;
  nextStep: SetupStep | null;
}

/**
 * Hook: useSetupProgress
 * Purpose: Derives the society's onboarding completion state by combining
 * data from three independent queries (opening balance, flats, maintenance config).
 * Used by the Dashboard to decide whether to show the setup banner or redirect
 * new users to the /setup page.
 *
 * All data is memoized — the progress object only recomputes when one of the
 * three underlying queries resolves or changes.
 */
export function useSetupProgress(): SetupProgress {
  const { user } = useAuth();
  const societyId = user?.societyPublicId || user?.societyId || '';
  const { data: obStatus, isLoading: obLoading } = useOpeningBalanceStatus();
  const { data: flats, isLoading: flatsLoading } = useFlats();
  const { data: maintenanceConfig, isLoading: maintenanceConfigLoading } = useMaintenanceConfig(societyId);

  const progress = useMemo(() => {
    if (obLoading || flatsLoading || maintenanceConfigLoading) {
      return {
        steps: [],
        progress: 0,
        isComplete: false,
        isOpeningBalancePending: false,
        isLoading: true,
        nextStep: null,
      };
    }

    const flatsCount = Array.isArray(flats) ? flats.length : 0;
    const obApplied = obStatus?.isApplied || false;
    const maintenanceConfigured = (maintenanceConfig?.defaultMonthlyCharge ?? 0) > 0;

    let obSkipped = false;
    try {
      obSkipped = !obApplied && localStorage.getItem(OB_SKIPPED_KEY) === 'true';
    } catch {
      // ignore — localStorage unavailable (SSR / private browsing edge case)
    }

    const steps: SetupStep[] = [
      {
        id: 'society',
        label: 'Society Created',
        // Society step is always complete — the user cannot reach this hook without a society.
        completed: true,
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
        completed: obApplied || obSkipped,
        skipped: obSkipped && !obApplied,
        description: obApplied
          ? 'Applied successfully'
          : obSkipped
          ? 'Skipped — no prior dues'
          : 'Optional — skip if no prior dues',
      },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const progressPercentage = Math.round((completedCount / steps.length) * 100);
    const nextIncompleteStep = steps.find((s) => !s.completed) || null;

    // Setup is complete when the three required steps are done.
    // Opening balance (step 4) is optional — it does not block completion.
    const requiredSteps = steps.filter((s) => s.id !== 'opening-balance');
    const requiredComplete = requiredSteps.every((s) => s.completed);
    const obPending = !obApplied && !obSkipped;

    return {
      steps,
      progress: progressPercentage,
      isComplete: requiredComplete,
      isOpeningBalancePending: obPending,
      isLoading: false,
      nextStep: nextIncompleteStep,
    };
  }, [obStatus, flats, obLoading, flatsLoading, maintenanceConfig, maintenanceConfigLoading]);

  return progress;
}
