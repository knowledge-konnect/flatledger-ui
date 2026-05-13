import { useState } from 'react';

/**
 * Hook: useLocalStorage
 * Purpose: Keeps a piece of state in sync with localStorage so it persists
 * across page reloads. Falls back to initialValue if the key is missing or
 * if localStorage is unavailable (e.g. private browsing with strict settings).
 *
 * @param key - localStorage key
 * @param initialValue - Initial value if key doesn't exist
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      // localStorage may be unavailable in some browser environments
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      // Silently ignore write failures (e.g. storage quota exceeded)
    }
  };

  return [storedValue, setValue] as const;
}
