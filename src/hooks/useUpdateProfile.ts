import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { User } from '../types/auth';

export interface UpdateProfileDto {
  mobile?: string;
}

export const useUpdateProfile = () => {
  return useMutation<User, Error, UpdateProfileDto>({
    mutationFn: (payload) => authApi.updateProfile(payload),
  });
};
