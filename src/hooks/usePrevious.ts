import { useEffect, useRef } from 'react';

/**
 * Returns the previous value of a state/prop
 * @param value - Current value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
