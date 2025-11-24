import httpClient from '../api/httpClient';

/**
 * Service for customer-specific issue operations
 * Handles order rejection issues and return shipping payments
 */

export interface ReturnShippingIssue {
  issueId: string;
  issueCode: string;
  description?: string;
  status: string; // OPEN, IN_PROGRESS, RESOLVED
  reportedAt: string;
  resolvedAt?: string;
  
  // Customer information
  customerInfo?: {
    customerId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    company?: string;
  };
  
  // Return shipping fee
  calculatedFee?: number;
  adjustedFee?: number;
  finalFee?: number;
  
  // Transaction (deprecated - use transactions array)
  returnTransaction?: {
    id: string;
    amount: number;
    status: string;
    currencyCode: string;
    paymentProvider: string;
    gatewayResponse?: string;
    gatewayOrderCode?: number;
    paymentDate?: string;
  };
  
  // All transactions (includes PENDING, FAILED, PAID)
  transactions?: Array<{
    id: string;
    amount: number;
    status: string;
    currencyCode: string;
    paymentProvider: string;
    gatewayResponse?: string;
    gatewayOrderCode?: number;
    paymentDate?: string;
  }>;
  
  // Payment deadline
  paymentDeadline?: string;
  
  // Affected packages
  affectedOrderDetails: Array<{
    trackingCode: string;
    description?: string;
    weightBaseUnit?: number;
    unit?: string;
  }>;
  
  // Issue images (photos when driver confirms return delivery)
  issueImages?: string[];
  
  // Return delivery images (deprecated - use issueImages)
  returnDeliveryImages?: string[];
}

const customerIssueService = {
  /**
   * Get all ORDER_REJECTION issues for customer's orders
   * @returns Promise with list of return shipping issues
   */
  getMyReturnShippingIssues: async (): Promise<ReturnShippingIssue[]> => {
    try {
      const response = await httpClient.get('/issues/customer/order-rejections');
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching customer return shipping issues:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách sự cố trả hàng');
    }
  },
  
  /**
   * Get ORDER_REJECTION issues for a specific order
   * @param orderId Order ID
   * @returns Promise with list of return shipping issues for this order
   */
  getReturnShippingIssuesByOrder: async (orderId: string): Promise<ReturnShippingIssue[]> => {
    try {
      const response = await httpClient.get(`/issues/customer/order/${orderId}/order-rejections`);
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching order return shipping issues:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin sự cố');
    }
  },
  
  /**
   * Get detailed information for a specific ORDER_REJECTION issue
   * @param issueId Issue ID
   * @returns Promise with issue detail
   */
  getReturnShippingIssueDetail: async (issueId: string): Promise<ReturnShippingIssue> => {
    try {
      const response = await httpClient.get(`/issues/order-rejection/${issueId}/detail`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching return shipping issue detail:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải chi tiết sự cố');
    }
  },
  
  /**
   * Create payment link for return shipping fee
   * Calls backend to create transaction and get PayOS payment link
   * @param issueId Issue ID
   * @returns Promise with payment link response
   */
  createReturnPaymentLink: async (issueId: string): Promise<{
    transactionId: string;
    amount: number;
    checkoutUrl: string;
    qrCode?: string;
  }> => {
    try {
      // Call backend to create payment transaction via PayOS controller (like deposit)
      // Backend will handle getting contract ID and amount from issue
      const response = await httpClient.post(
        `/transactions/pay-os/issue/${issueId}/return-payment`,
        {}
      );
      
      const transactionData = response.data.data;
      
      // Parse gateway response to get checkout URL
      let checkoutUrl = '';
      let qrCode = '';
      
      if (transactionData.gatewayResponse) {
        try {
          const gatewayData = JSON.parse(transactionData.gatewayResponse);
          checkoutUrl = gatewayData.checkoutUrl || gatewayData.paymentLinkUrl || '';
          qrCode = gatewayData.qrCode || '';
        } catch (parseError) {
          console.error('Error parsing gatewayResponse:', parseError);
        }
      }
      
      return {
        transactionId: transactionData.id,
        amount: transactionData.amount,
        checkoutUrl: checkoutUrl,
        qrCode: qrCode,
      };
    } catch (error: any) {
      console.error('Error creating return payment link:', error);
      throw new Error(error.response?.data?.message || error.message || 'Không thể tạo link thanh toán');
    }
  },
  
  /**
   * Reject return payment (customer doesn't want to pay)
   * This will keep journey INACTIVE and items will be cancelled
   * @param issueId Issue ID
   * @returns Promise<void>
   */
  rejectReturnPayment: async (issueId: string): Promise<void> => {
    try {
      await httpClient.post(`/issues/${issueId}/reject-return-payment`);
    } catch (error: any) {
      console.error('Error rejecting return payment:', error);
      throw new Error(error.response?.data?.message || 'Không thể từ chối thanh toán');
    }
  },
};

export default customerIssueService;
