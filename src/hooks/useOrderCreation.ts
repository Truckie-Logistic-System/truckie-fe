import { useState, useEffect, useCallback } from 'react';
import orderService from '@/services/order';
import categoryService from '@/services/category';
import addressService from '@/services/address';
import orderSizeService from '@/services/order-size';
import customerService from '@/services/customer';
import type { OrderCreateRequest } from '@/models/Order';
import type { Category } from '@/models/Category';
import type { Address } from '@/models/Address';
import type { OrderSize } from '@/models/OrderSize';

/**
 * Hook để quản lý logic tạo đơn hàng
 * Wrap tất cả service calls liên quan đến order creation
 */
export const useOrderCreation = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orderSizes, setOrderSizes] = useState<OrderSize[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerStatus, setCustomerStatus] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel including customer profile
        const [addressesData, orderSizesData, categoriesData, customerProfile] = await Promise.all([
          addressService.getMyAddresses(),
          orderSizeService.getAllOrderSizes(),
          categoryService.getCategories(),
          customerService.getMyProfile(),
        ]);

        // Check customer status
        const profileStatus = customerProfile?.status;
        setCustomerStatus(profileStatus);

        // Only ACTIVE customers can create new orders
        if (profileStatus !== 'ACTIVE') {
          setError('Tài khoản khách hàng của bạn hiện không ở trạng thái hoạt động. Vui lòng liên hệ bộ phận hỗ trợ để được kiểm tra và kích hoạt lại.');
          setLoading(false);
          return;
        }

        setAddresses(addressesData);
        setOrderSizes(orderSizesData);
        
        // getCategories returns GetCategoriesResponse, need to extract data
        const categoriesArray = Array.isArray(categoriesData) 
          ? categoriesData 
          : (categoriesData as any)?.data || [];
        setCategories(categoriesArray);
      } catch (err: any) {
        console.error('[useOrderCreation] Error fetching initial data:', err);
        setError(err?.message || 'Không thể tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Create order
  const createOrder = useCallback(async (orderData: OrderCreateRequest) => {
    try {
      // Double-check customer status before creating order
      if (customerStatus !== 'ACTIVE') {
        throw new Error('Tài khoản khách hàng của bạn hiện không ở trạng thái hoạt động. Không thể tạo đơn hàng mới.');
      }

      const response = await orderService.createOrder(orderData);
      return response;
    } catch (err: any) {
      console.error('[useOrderCreation] Error creating order:', err);
      throw err;
    }
  }, [customerStatus]);

  // Refetch addresses
  const refetchAddresses = useCallback(async () => {
    try {
      const addressesData = await addressService.getMyAddresses();
      setAddresses(addressesData);
    } catch (err: any) {
      console.error('[useOrderCreation] Error refetching addresses:', err);
      throw err;
    }
  }, []);

  return {
    // Data
    addresses,
    orderSizes,
    categories,
    
    // State
    loading,
    error,
    customerStatus,
    
    // Actions
    createOrder,
    refetchAddresses,
  };
};
