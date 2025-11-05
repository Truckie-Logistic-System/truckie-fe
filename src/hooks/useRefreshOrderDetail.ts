import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import orderService from '@/services/order/orderService';
import { message } from 'antd';

type UserRole = 'customer' | 'staff';

/**
 * Hook để refetch order detail data
 * Được dùng khi cần update order/contract data mà không reload page
 * @param userRole - 'customer' hoặc 'staff' để gọi API phù hợp
 * @param onSuccess - Callback khi refetch thành công
 */
export const useRefreshOrderDetail = (
  userRole: UserRole = 'customer',
  onSuccess?: (data: any) => void
) => {
  const { id } = useParams<{ id: string }>();

  const refetch = useCallback(async () => {
    if (!id) {
      console.warn('[useRefreshOrderDetail] No order ID provided');
      return null;
    }

    try {
      console.log('[useRefreshOrderDetail] Fetching order detail:', id, 'role:', userRole);
      
      let data;
      if (userRole === 'staff') {
        data = await orderService.getOrderForStaffByOrderId(id);
      } else {
        data = await orderService.getOrderForCustomerByOrderId(id);
      }
      
      console.log('[useRefreshOrderDetail] ✅ Order detail refreshed');
      onSuccess?.(data);
      return data;
    } catch (error: any) {
      console.error('[useRefreshOrderDetail] ❌ Error fetching order detail:', error?.message);
      message.error('Không thể cập nhật dữ liệu đơn hàng');
      throw error;
    }
  }, [id, userRole, onSuccess]);

  return { refetch };
};
