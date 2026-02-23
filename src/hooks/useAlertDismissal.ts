import { useState } from 'react';

/**
 * Hook to manage dismissible alerts with localStorage
 */
export function useAlertDismissal(key: string) {
  const storageKey = `alert_dismissed_${key}`;
  
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, 'true');
      setIsDismissed(true);
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const undoDismiss = () => {
    try {
      localStorage.removeItem(storageKey);
      setIsDismissed(false);
    } catch (error) {
      console.error('Failed to undo dismiss:', error);
    }
  };

  return { isDismissed, dismiss, undoDismiss };
}
