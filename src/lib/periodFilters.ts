const pad2 = (n: number) => String(n).padStart(2, '0');

export const getCurrentDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
};

export const getCurrentYearMonth = () => getCurrentDateString().slice(0, 7);

/**
 * Converts a date string or Date object to a YYYY-MM-DD string.
 * ISO strings from the server (e.g. "2026-05-01T00:00:00Z") are parsed as UTC
 * to avoid off-by-one-day errors in timezones ahead of UTC (e.g. IST UTC+5:30).
 */
export const toDateString = (input: string | Date): string | undefined => {
  if (typeof input === 'string') {
    // If it looks like a date-only string (YYYY-MM-DD), use it directly — no parsing needed.
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    // For ISO datetime strings, extract the date portion directly to avoid timezone shifts.
    const isoMatch = input.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
  }
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;
  // Fall back to UTC components to stay consistent with server-side UTC dates.
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

export const toYearMonth = (input: string | Date): string | undefined => {
  const dateStr = toDateString(input);
  if (!dateStr) return undefined;
  return dateStr.slice(0, 7);
};

export const clampDate = (value: string, minDate?: string, maxDate = getCurrentDateString()) => {
  if (!value) return value;
  if (minDate && value < minDate) return minDate;
  if (value > maxDate) return maxDate;
  return value;
};

export const clampYearMonth = (value: string, minMonth?: string, maxMonth = getCurrentYearMonth()) => {
  if (!value) return value;
  if (minMonth && value < minMonth) return minMonth;
  if (value > maxMonth) return maxMonth;
  return value;
};

/**
 * Builds a list of month options from the current month back to minMonth (or monthsBack months,
 * whichever is further back). This ensures societies can always see all months since onboarding.
 *
 * @param minMonth  Earliest allowed month in YYYY-MM format (typically the society's onboarding month).
 * @param monthsBack  Minimum number of months to show even if minMonth is not set (default 6).
 *                    When minMonth is set, the list extends back to minMonth regardless of this value.
 */
export const getMonthOptions = (minMonth?: string, monthsBack = 6) => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  // Calculate how many months back we need to go to reach minMonth.
  let effectiveMonthsBack = monthsBack;
  if (minMonth) {
    const [minY, minM] = minMonth.split('-').map(Number);
    const monthsDiff =
      (now.getFullYear() - minY) * 12 + (now.getMonth() + 1 - minM);
    // Add 1 to include the minMonth itself; cap at 60 months (5 years) to avoid huge lists.
    // Do NOT fall back to monthsBack here — when minMonth is known we respect it strictly.
    effectiveMonthsBack = Math.min(monthsDiff + 1, 60);
  }

  for (let i = 0; i < effectiveMonthsBack; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

    if (minMonth && value < minMonth) {
      break; // Stop once we've gone past the onboarding month
    }

    options.push({
      value,
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  }

  return options;
};
