/**
 * Conditional logger for development/debugging
 *
 * - log / info: only fire in development builds (or when window.__DEBUG is set)
 * - error / warn: always fire in dev; stripped in production by the esbuild build config
 *
 * Usage:
 *   logger.log('Message', data)
 *   logger.error('Error message', error)  // never pass raw API response data here
 *   logger.warn('Warning message', info)
 */

const isDevEnabled = (): boolean => {
  if (import.meta.env.DEV) return true;

  // Allow runtime override in browser DevTools: window.__DEBUG = true
  if (typeof window !== 'undefined' && (window as any).__DEBUG === true) {
    return true;
  }

  return false;
};

const log = (message: string, data?: any): void => {
  if (isDevEnabled()) {
    if (data !== undefined) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

const error = (message: string, data?: any): void => {
  if (data !== undefined) {
    console.error(`[ERROR] ${message}`, data);
  } else {
    console.error(`[ERROR] ${message}`);
  }
};

const warn = (message: string, data?: any): void => {
  if (data !== undefined) {
    console.warn(`[WARN] ${message}`, data);
  } else {
    console.warn(`[WARN] ${message}`);
  }
};

const info = (message: string, data?: any): void => {
  if (isDevEnabled()) {
    if (data !== undefined) {
      console.info(`[INFO] ${message}`, data);
    } else {
      console.info(`[INFO] ${message}`);
    }
  }
};

export const logger = {
  log,
  error,
  warn,
  info,
};
