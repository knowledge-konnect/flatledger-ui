/**
 * Conditional logger for development/debugging
 * Respects DEBUG environment variable and window.__DEBUG flag
 * 
 * Usage:
 *   logger.log('Message', data)
 *   logger.error('Error message', error)
 *   logger.warn('Warning message', info)
 * 
 * Enable logging by:
 *   - Setting DEBUG environment variable: DEBUG=true
 *   - Setting window flag in browser console: window.__DEBUG = true
 */

const isDebugEnabled = (): boolean => {
  // Check environment variable
  if (typeof process !== 'undefined' && process.env.DEBUG === 'true') {
    return true;
  }

  // Check window flag (for browser console control)
  if (typeof window !== 'undefined' && (window as any).__DEBUG === true) {
    return true;
  }

  return false;
};

const log = (message: string, data?: any): void => {
  if (isDebugEnabled()) {
    if (data !== undefined) {
      console.log(`[DEBUG] ${message}`, data);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }
};

const error = (message: string, data?: any): void => {
  if (isDebugEnabled()) {
    if (data !== undefined) {
      console.error(`[ERROR] ${message}`, data);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }
};

const warn = (message: string, data?: any): void => {
  if (isDebugEnabled()) {
    if (data !== undefined) {
      console.warn(`[WARN] ${message}`, data);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }
};

const info = (message: string, data?: any): void => {
  if (isDebugEnabled()) {
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
