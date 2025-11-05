import { useState, useEffect, useCallback } from 'react';
import orderService from '@/services/order';
import categoryService from '@/services/category';
import addressService from '@/services/address';
import orderSizeService from '@/services/order-size';
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
  const [units, setUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [addressesData, orderSizesData, categoriesData] = await Promise.all([
          addressService.getMyAddresses(),
          orderSizeService.getAllOrderSizes(),
          categoryService.getCategories(),
        ]);

        setAddresses(addressesData);
        setOrderSizes(orderSizesData);
        
        // getCategories returns GetCategoriesResponse, need to extract data
        const categoriesArray = Array.isArray(categoriesData) 
          ? categoriesData 
          : (categoriesData as any)?.data || [];
        setCategories(categoriesArray);

        // Set default units (kg, tấn, etc.)
        setUnits(['kg', 'tấn', 'tạ', 'yến']);
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
      console.log('[useOrderCreation] Creating order:', orderData);
      const response = await orderService.createOrder(orderData);
      console.log('[useOrderCreation] Order created successfully:', response);
      return response;
    } catch (err: any) {
      console.error('[useOrderCreation] Error creating order:', err);
      throw err;
    }
  }, []);

  return {
    // Data
    addresses,
    orderSizes,
    categories,
    units,
    
    // State
    loading,
    error,
    
    // Actions
    createOrder,
  };
};
