import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, CreateUserDto, UpdateUserDto, User, CreateUserResponse } from '../api/usersApi';
import { PaginationParams } from '../types/api';

/**
 * Hook: useUsers
 * Purpose: Fetches all users belonging to the current society.
 * The params argument is accepted for API compatibility but currently unused
 * since the backend returns all users in a single response.
 */
export const useUsers = (params?: PaginationParams) => {
  return useQuery<User[]>({
    queryKey: ['users', params],
    queryFn: () => usersApi.getUsers()
  });
};

/**
 * Hook: useUser
 * Purpose: Fetches a single user by ID. Disabled when no ID is provided.
 */
export const useUser = (id: string) => {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: () => usersApi.getUserById(id),
    enabled: !!id
  });
};

/**
 * Hook: useCreateUser
 * Purpose: Creates a new user and refreshes the users list on success.
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation<CreateUserResponse, Error, CreateUserDto>({
    mutationFn: (payload) => usersApi.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

/**
 * Hook: useUpdateUser
 * Purpose: Updates a user's details and optimistically updates the cached
 * individual user entry to avoid a redundant refetch.
 */
export const useUpdateUser = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<User, Error, UpdateUserDto>({
    mutationFn: (payload) => usersApi.updateUser(id, payload),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Update the individual user cache entry directly to avoid a redundant fetch
      queryClient.setQueryData(['users', id], updatedUser);
    }
  });
};

/**
 * Hook: useDeleteUser
 * Purpose: Deletes a user and refreshes the users list.
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: (userId) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};
