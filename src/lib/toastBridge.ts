/**
 * Thin bridge between the Toast React context and the Axios client interceptor.
 *
 * This module intentionally has ZERO imports so it can never throw during
 * module evaluation. This prevents the cascade where client.ts throwing
 * (e.g. VITE_APP_API_URL missing) would corrupt the ToastContext creation
 * and produce "useToast must be used within ToastProvider".
 *
 * Usage:
 *  - ToastProvider calls setGlobalToastFn(showToast) on mount / null on unmount
 *  - Axios interceptors call getGlobalToastFn()?.('message', 'error')
 */

type ShowToastFn = (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void;

let _fn: ShowToastFn | null = null;

export function setGlobalToastFn(fn: ShowToastFn | null): void {
  _fn = fn;
}

export function getGlobalToastFn(): ShowToastFn | null {
  return _fn;
}
