import httpClient from './api/httpClient';

export interface StipulationResponse {
  id: string;
  content: string;
}

export const stipulationService = {
  /**
   * Get current stipulation settings (public endpoint)
   * No authentication required
   */
  getCurrentStipulation: async (): Promise<StipulationResponse> => {
    const response = await httpClient.get('/public/stipulations/current');
    return response.data.data;
  },

  /**
   * Update stipulation settings (admin only)
   */
  updateStipulation: async (content: string): Promise<StipulationResponse> => {
    const response = await httpClient.put('/stipulation-settings', { content });
    return response.data.data;
  },

  /**
   * Get stipulation for admin (authenticated)
   */
  getStipulationForAdmin: async (): Promise<StipulationResponse> => {
    const response = await httpClient.get('/stipulation-settings');
    return response.data.data;
  }
};
