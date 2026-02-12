import { ApiResponse } from '../types/api';
import { unwrapArrayData } from './responseUtils';
import apiClient from './client';

export interface Role {
  code: string;
  name: string;
  description: string;
}

export const rolesApi = {
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<ApiResponse<unknown>>('/roles');
    return unwrapArrayData<Role>(response.data.data, 'roles');
  },

  async getRoleByCode(code: string): Promise<Role> {
    const response = await apiClient.get<ApiResponse<Role>>(`/roles/${code}`);
    return response.data.data;
  }
};
