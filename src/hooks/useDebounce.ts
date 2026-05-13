import { useEffect, useState } from 'react';

/**
 * Hook: useDebounce
 * Purpose: Delays propagating a value until it has stopped changing for `delay` ms.
 * Prevents excessive API calls on fast-changing inputs like search fields.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // The cleanup function clears the previous timer on every value/delay change,
  // ensuring only the final value after the user stops typing is propagated.
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
