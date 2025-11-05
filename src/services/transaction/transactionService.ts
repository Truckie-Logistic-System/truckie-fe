import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';

/**
 * Service for handling transaction-related API calls
 */
const transactionService = {
  /**
   * Call PayOS webhook for payment processing
   * @param orderCode - Order code for the transaction
   * @param status - Payment status
   * @returns Promise with webhook response
   */
  callPayOSWebhook: async (orderCode: number, status: string) => {
    try {
      const response = await httpClient.post('/transactions/pay-os/webhook', {
        data: {
          orderCode,
          status,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error calling PayOS webhook:', error);
      throw handleApiError(error, 'Không thể xử lý thanh toán');
    }
  },
};

export default transactionService;
