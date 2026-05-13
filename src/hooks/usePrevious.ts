import { useEffect, useRef } from 'react';

/**
 * Hook: usePrevious
 * Purpose: Captures the value from the previous render cycle.
 * Useful for comparing old vs. new values in effects or for animating transitions.
 *
 * @param value - Current value to track
 * @returns The value from the previous render (undefined on first render)
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  // Update the ref after render so the returned value is always one cycle behind
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
