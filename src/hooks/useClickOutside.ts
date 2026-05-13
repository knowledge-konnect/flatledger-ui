import { useEffect, RefObject } from 'react';

/**
 * Hook: useClickOutside
 * Purpose: Fires a callback when the user clicks or taps outside the referenced
 * element. Commonly used to close dropdowns, modals, and popovers.
 *
 * @param ref - React ref to the element to monitor
 * @param handler - Callback invoked when a click outside is detected
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      // Ignore clicks that originate inside the referenced element
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Re-register if ref or handler identity changes
}
