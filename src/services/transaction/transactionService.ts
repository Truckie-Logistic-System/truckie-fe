import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';

// Define types for staff transaction management
export interface StaffTransactionResponse {
  id: string;
  transactionType: string;
  amount: number;
  status: string;
  paymentProvider: string;
  currencyCode: string;
  gatewayOrderCode?: string;
  paymentDate?: string;
  createdAt: string;
  gatewayResponse?: string;
  contract?: {
    id: string;
    contractName: string;
    status: string;
    orderCode?: string;
    orderStatus?: string;
    customerName?: string;
    adjustedValue?: number;
    totalValue?: number;
    attachFileUrl?: string;
  };
}

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

  /**
   * Get all transactions for staff
   * @returns Promise with transactions list
   */
  getAllTransactionsForStaff: async (): Promise<StaffTransactionResponse[]> => {
    try {
      const response = await httpClient.get('/transactions/staff/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw handleApiError(error, 'Không thể tải danh sách giao dịch');
    }
  },

  /**
   * Get transaction detail for staff
   * @param transactionId - Transaction ID
   * @returns Promise with transaction details
   */
  getTransactionDetailForStaff: async (transactionId: string): Promise<StaffTransactionResponse> => {
    try {
      const response = await httpClient.get(`/transactions/staff/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      throw handleApiError(error, 'Không thể tải chi tiết giao dịch');
    }
  },
};

export default transactionService;
