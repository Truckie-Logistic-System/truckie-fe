import { useState, useEffect, useCallback } from 'react';
import customerService from '@/services/customer/customerService';

/**
 * Hook để quản lý customer operations
 */
export const useCustomerManagement = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error('[useCustomerManagement] Error fetching customers:', err);
      setError(err?.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const getCustomerById = useCallback(async (id: string) => {
    try {
      return await customerService.getCustomerById(id);
    } catch (err: any) {
      console.error('[useCustomerManagement] Error fetching customer:', err);
      throw err;
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, data: any) => {
    try {
      const response = await customerService.updateCustomerProfile(id, data);
      await fetchCustomers();
      return response;
    } catch (err: any) {
      console.error('[useCustomerManagement] Error updating customer:', err);
      throw err;
    }
  }, [fetchCustomers]);

  const updateCustomerStatus = useCallback(async (id: string, status: string) => {
    try {
      const response = await customerService.updateCustomerStatus(id, status);
      await fetchCustomers();
      return response;
    } catch (err: any) {
      console.error('[useCustomerManagement] Error updating customer status:', err);
      throw err;
    }
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    getCustomerById,
    updateCustomer,
    updateCustomerStatus,
  };
};
