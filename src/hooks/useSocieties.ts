import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  societiesApi,
  UpdateSocietyDto,
  Society,
  MaintenanceConfig,
  MaintenanceConfigDto,
} from '../api/societiesApi';

/**
 * Fetch the authenticated user's own society.
 * GET /societies
 */
export const useOwnSociety = () => {
  return useQuery<Society>({
    queryKey: ['society', 'own'],
    queryFn: () => societiesApi.getOwnSociety(),
  });
};

/**
 * Fetch a society by its public ID.
 * GET /societies/{publicId}
 */
export const useSociety = (publicId: string) => {
  return useQuery<Society>({
    queryKey: ['society', publicId],
    queryFn: () => societiesApi.getSocietyById(publicId),
    enabled: !!publicId,
  });
};

/**
 * Update the society's profile. Society Admin only.
 * PUT /societies/{publicId}
 */
export const useUpdateSociety = (publicId: string) => {
  const queryClient = useQueryClient();
  return useMutation<Society, Error, UpdateSocietyDto>({
    mutationFn: (payload) => societiesApi.updateSociety(publicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['society'] });
    },
  });
};

/**
 * Fetch maintenance billing config for a society.
 * GET /societies/{societyPublicId}/maintenance-config
 */
export const useMaintenanceConfig = (societyPublicId: string) => {
  return useQuery<MaintenanceConfig>({
    queryKey: ['maintenance-config', societyPublicId],
    queryFn: () => societiesApi.getMaintenanceConfig(societyPublicId),
    enabled: !!societyPublicId,
  });
};

/**
 * Create or update maintenance billing config.
 * PUT /societies/{societyPublicId}/maintenance-config
 */
export const useUpdateMaintenanceConfig = (societyPublicId: string) => {
  const queryClient = useQueryClient();
  return useMutation<MaintenanceConfig, Error, MaintenanceConfigDto>({
    mutationFn: (payload) => societiesApi.updateMaintenanceConfig(societyPublicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-config', societyPublicId] });
    },
  });
};
