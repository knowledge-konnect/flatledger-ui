import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import {
    clampDate,
    clampYearMonth,
    getCurrentDateString,
    getCurrentYearMonth,
    toDateString,
    toYearMonth,
} from '../lib/periodFilters';
import { useOwnSociety } from './useSocieties';

export function useSocietyPeriodBounds() {
  const { user } = useAuth();
  const { data: society } = useOwnSociety();

  const minDate = useMemo(() => {
    const raw = society?.onboardingDate ?? user?.createdAt;
    if (!raw) return undefined;
    const dateStr = toDateString(raw);
    // Guard against sentinel values like "0001-01-01" that come from unset DateOnly fields
    if (!dateStr || dateStr < '2000-01-01') return undefined;
    return dateStr;
  }, [society?.onboardingDate, user?.createdAt]);

  const minMonth = useMemo(() => {
    if (!minDate) return undefined;
    return toYearMonth(minDate);
  }, [minDate]);

  const maxDate = getCurrentDateString();
  const maxMonth = getCurrentYearMonth();

  return {
    minDate,
    minMonth,
    maxDate,
    maxMonth,
    clampDate: (value: string) => clampDate(value, minDate, maxDate),
    clampMonth: (value: string) => clampYearMonth(value, minMonth, maxMonth),
  };
}
