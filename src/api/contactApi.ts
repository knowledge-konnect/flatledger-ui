import apiClient from './client';
import { ApiResponse } from '../types/api';

export interface ContactUsRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export const contactApi = {
  /**
   * Submit a contact-us enquiry.
   * POST /contact-us
   */
  async submit(data: ContactUsRequest): Promise<void> {
    await apiClient.post<ApiResponse<null>>('/contact-us', data);
  },
};
