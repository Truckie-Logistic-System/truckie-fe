import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import orderService from '@/services/order/orderService';
import { contractService } from '@/services/contract';
import type { Order } from '@/models';
import type { CreateContractRequest } from '@/services/contract/types';

/**
 * Hook để quản lý customer order detail
 * Wrap orderService và contractService calls
 */
export const useCustomerOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [priceDetails, setPriceDetails] = useState<any>(null);
  const [loadingPriceDetails, setLoadingPriceDetails] = useState<boolean>(false);

  // Fetch order detail
  const fetchOrderDetail = useCallback(async () => {
    if (!id) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // getOrderForCustomerByOrderId returns { order, contract, transactions }
      const response = await orderService.getOrderForCustomerByOrderId(id);
      setOrder(response.order); // Extract order from response
      
      // Set contract from response if exists
      if (response.contract) {
        setContract(response.contract);
        
        // Fetch price details if contract exists
        if (response.contract.id) {
          setLoadingPriceDetails(true);
          try {
            const priceResponse = await contractService.getContractPdfData(response.contract.id);
            if (priceResponse?.success) {
              setPriceDetails(priceResponse.data?.priceDetails);
            }
          } catch (priceError) {
            console.error('[useCustomerOrderDetail] Error fetching price details:', priceError);
          } finally {
            setLoadingPriceDetails(false);
          }
        }
      }
    } catch (err: any) {
      console.error('[useCustomerOrderDetail] Error fetching order detail:', err);
      setError(err?.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial fetch
  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // Delete order
  const deleteOrder = useCallback(async () => {
    if (!id) return;
    
    try {
      await orderService.deleteOrder(id);
      return true;
    } catch (err: any) {
      console.error('[useCustomerOrderDetail] Error deleting order:', err);
      throw err;
    }
  }, [id]);

  // Create contract
  const createContract = useCallback(async (contractData: CreateContractRequest) => {
    try {
      const response = await contractService.createContract(contractData);
      // Refetch order detail after creating contract
      await fetchOrderDetail();
      return response;
    } catch (err: any) {
      console.error('[useCustomerOrderDetail] Error creating contract:', err);
      throw err;
    }
  }, [fetchOrderDetail]);

  return {
    // Data
    order,
    contract,
    priceDetails,
    
    // State
    loading,
    loadingPriceDetails,
    error,
    
    // Actions
    refetch: fetchOrderDetail,
    deleteOrder,
    createContract,
  };
};
