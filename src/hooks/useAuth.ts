/**
 * Thin hook wrappers around authApi for the direct password reset flow.
 * NOTE: Login and signup are handled by AuthProvider (src/contexts/AuthProvider.tsx).
 */
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';

/**
 * Step 1 — verify the email exists before showing the new-password form.
 * POST /auth/check-email
 */
export function useCheckEmail() {
  return useMutation({
    mutationFn: (email: string) => authApi.checkEmail(email),
  });
}

/**
 * Step 2 — reset the password directly by email (no token required).
 * POST /auth/reset-password-direct
 */
export function useResetPasswordDirect() {
  return useMutation({
    mutationFn: (payload: { email: string; newPassword: string; confirmPassword: string }) =>
      authApi.resetPasswordDirect(payload),
  });
}
