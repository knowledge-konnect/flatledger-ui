import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export const useChangePassword = () => {
  return useMutation<void, Error, ChangePasswordDto>({
    mutationFn: (payload) =>
      authApi.changePassword(payload.currentPassword, payload.newPassword, payload.confirmPassword),
  });
};
