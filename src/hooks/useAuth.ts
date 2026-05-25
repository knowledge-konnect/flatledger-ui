/**
 * Thin hook wrappers around authApi for password reset.
 * NOTE: Login and signup are handled by AuthProvider (src/contexts/AuthProvider.tsx).
 */
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';

/**
 * Request a password reset email (same response whether email exists or not).
 * POST /auth/forgot-password
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

/**
 * Reset password using the token from the email link.
 * POST /auth/reset-password
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { token: string; newPassword: string; confirmPassword: string }) =>
      authApi.resetPassword(payload),
  });
}
