import { useState } from 'react';
import orderService from '@/services/order/orderService';

export const useOrderVehicleAssignment = () => {
  const [loading, setLoading] = useState(false);

  const assignVehicle = async (orderId: string): Promise<{ success: boolean; message?: string }> => {
    if (!orderId) {
      return {
        success: false,
        message: 'Không tìm thấy ID của đơn hàng',
      };
    }

    try {
      setLoading(true);
      await orderService.updateVehicleAssignmentForOrderDetail(orderId);
      return {
        success: true,
        message: 'Đã phân công xe thành công',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Không thể phân công xe cho đơn hàng',
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    assignVehicle,
  };
};
