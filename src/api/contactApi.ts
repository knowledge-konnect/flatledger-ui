import apiClient from './client';

export interface ContactUsRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export const contactApi = {
  async submit(data: ContactUsRequest): Promise<void> {
    await apiClient.post('/contact', data);
  },
};
