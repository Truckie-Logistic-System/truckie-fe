import { useCallback } from 'react';
import { contractService } from '@/services/contract';
import { message } from 'antd';

/**
 * Hook để refetch contracts list
 * Được dùng khi cần update contracts data mà không reload page
 * @param orderId - Order ID để fetch contracts
 * @param onSuccess - Callback khi refetch thành công
 */
export const useRefreshContracts = (
  orderId?: string,
  onSuccess?: (data: any) => void
) => {
  const refetch = useCallback(async () => {
    if (!orderId) {
      console.warn('[useRefreshContracts] No order ID provided');
      return null;
    }

    try {
      console.log('[useRefreshContracts] Fetching contracts for order:', orderId);
      
      const response = await contractService.getContractsByOrderId(orderId);
      
      if (response?.data?.success) {
        console.log('[useRefreshContracts] ✅ Contracts refreshed');
        onSuccess?.(response.data.data);
        return response.data.data;
      } else {
        throw new Error(response?.data?.message || 'Failed to fetch contracts');
      }
    } catch (error: any) {
      console.error('[useRefreshContracts] ❌ Error fetching contracts:', error?.message);
      message.error('Không thể cập nhật dữ liệu hợp đồng');
      throw error;
    }
  }, [orderId, onSuccess]);

  return { refetch };
};
