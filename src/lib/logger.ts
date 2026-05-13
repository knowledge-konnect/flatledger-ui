/**
 * Conditional logger — all methods are silenced in production builds.
 * Use window.__DEBUG = true in DevTools to re-enable at runtime.
 *
 * Usage:
 *   logger.log('Message', data)
 *   logger.error('Error message', error)
 *   logger.warn('Warning message', info)
 */

const isDevEnabled = (): boolean => {
  if (import.meta.env.DEV) return true;
  if (typeof window !== 'undefined' && (window as any).__DEBUG === true) return true;
  return false;
};

const log = (message: string, data?: any): void => {
  if (!isDevEnabled()) return;
  data !== undefined
    ? console.log(`[DEBUG] ${message}`, data)
    : console.log(`[DEBUG] ${message}`);
};

const error = (message: string, data?: any): void => {
  if (!isDevEnabled()) return;
  data !== undefined
    ? console.error(`[ERROR] ${message}`, data)
    : console.error(`[ERROR] ${message}`);
};

const warn = (message: string, data?: any): void => {
  if (!isDevEnabled()) return;
  data !== undefined
    ? console.warn(`[WARN] ${message}`, data)
    : console.warn(`[WARN] ${message}`);
};

const info = (message: string, data?: any): void => {
  if (!isDevEnabled()) return;
  data !== undefined
    ? console.info(`[INFO] ${message}`, data)
    : console.info(`[INFO] ${message}`);
};

export const logger = { log, error, warn, info };
