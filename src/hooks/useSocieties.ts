import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { societiesApi, CreateSocietyDto, UpdateSocietyDto, Society, MaintenanceConfig, MaintenanceConfigDto } from '../api/societiesApi';
import { PaginatedResponse, PaginationParams } from '../types/api';

export const useSocieties = (params?: PaginationParams) => {
  return useQuery<PaginatedResponse<Society>>({
    queryKey: ['societies', params],
    queryFn: () => societiesApi.getSocieties(params)
  });
};

export const useSociety = (id: string) => {
  return useQuery<Society>({
    queryKey: ['societies', id],
    queryFn: () => societiesApi.getSocietyById(id),
    enabled: !!id
  });
};

export const useCreateSociety = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Society, Error, CreateSocietyDto>({
    mutationFn: (payload) => societiesApi.createSociety(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societies'] });
    }
  });
};

export const useUpdateSociety = (id: string) => {
  const queryClient = useQueryClient();
  
  return useMutation<Society, Error, UpdateSocietyDto>({
    mutationFn: (payload) => societiesApi.updateSociety(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['societies'] });
      queryClient.invalidateQueries({ queryKey: ['societies', id] });
    }
  });
};

export const useMaintenanceConfig = (societyId: string) => {
  return useQuery<MaintenanceConfig>({
    queryKey: ['maintenance-config', societyId],
    queryFn: () => societiesApi.getMaintenanceConfig(societyId),
    enabled: !!societyId,
  });
};

export const useUpdateMaintenanceConfig = (societyId: string) => {
  const queryClient = useQueryClient();

  return useMutation<MaintenanceConfig, Error, MaintenanceConfigDto>({
    mutationFn: (payload) => societiesApi.updateMaintenanceConfig(societyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-config', societyId] });
    }
  });
};

