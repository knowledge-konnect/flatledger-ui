import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — Merges Tailwind CSS class names, resolving conflicts intelligently.
 * Uses clsx for conditional class logic and tailwind-merge to deduplicate
 * conflicting Tailwind utilities (e.g. 'p-2 p-4' → 'p-4').
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Rupee currency (e.g. ₹1,00,000).
 * Returns an em dash for null/undefined/non-finite values to indicate missing data.
 */
export function formatCurrency(amount?: number | null): string {
  if (amount == null || !isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date string or Date object as a short Indian locale date (e.g. 14 Apr 2026).
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Formats a date string or Date object as a short Indian locale date + time (e.g. 14 Apr 2026, 02:30 PM).
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Balance sign indicator: what does positive/negative mean?
 * REQUIRED in all API responses that include balance fields.
 */
export interface BalanceSignLegend {
  positive: string; // e.g., "Member owes the society"
  negative: string; // e.g., "Society owes member (advance)"
}

/**
 * Balance display format with sign-based context
 */
export interface SignedBalance {
  amount: number;
  formatted: string; // with ₹ and color
  label: string; // "Due" or "Advance"
  color: 'red' | 'green' | 'slate'; // CSS color class prefix
  isPositive: boolean;
  isNegative: boolean;
  isZero: boolean;
}

/**
 * Formats a signed balance (positive = member owes, negative = advance).
 * Returns amount with proper label and color coding.
 */
export function formatSignedBalance(amount?: number | null): SignedBalance {
  if (amount == null || !isFinite(amount)) {
    return {
      amount: 0,
      formatted: '—',
      label: 'N/A',
      color: 'slate',
      isPositive: false,
      isNegative: false,
      isZero: true,
    };
  }

  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const isZero = amount === 0;

  return {
    amount,
    formatted: formatCurrency(amount),
    label: isPositive ? 'Due' : isNegative ? 'Advance' : 'Clear',
    color: isPositive ? 'red' : isNegative ? 'green' : 'slate',
    isPositive,
    isNegative,
    isZero,
  };
}

/**
 * Returns badge classes for signed balance display
 */
export function getBalanceBadgeClasses(color: 'red' | 'green' | 'slate'): string {
  const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold';
  const colorMap = {
    red: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  };
  return `${baseClasses} ${colorMap[color]}`;
}

/**
 * Returns text color classes for signed balance amounts
 */
export function getBalanceTextClasses(color: 'red' | 'green' | 'slate'): string {
  const colorMap = {
    red: 'text-red-600 dark:text-red-400',
    green: 'text-green-600 dark:text-green-400',
    slate: 'text-slate-600 dark:text-slate-400',
  };
  return colorMap[color];
}
