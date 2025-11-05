import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import orderService from '@/services/order/orderService';
import { contractService } from '@/services/contract';
import type { CreateContractRequest } from '@/services/contract/types';

/**
 * Hook để quản lý staff order detail
 */
export const useStaffOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [priceDetails, setPriceDetails] = useState<any>(null);
  const [loadingPriceDetails, setLoadingPriceDetails] = useState<boolean>(false);

  const fetchOrderDetail = useCallback(async () => {
    if (!id) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const orderData = await orderService.getOrderForStaffByOrderId(id);
      console.log('[useStaffOrderDetail] Received order data:', orderData);
      console.log('[useStaffOrderDetail] Order details:', orderData?.order?.orderDetails);
      setOrder(orderData);

      // Fetch contract if exists
      try {
        const contractResponse = await orderService.checkContractByOrderId(id);
        if (contractResponse?.success && contractResponse?.data) {
          setContract(contractResponse.data);
          
          if (contractResponse.data.id) {
            setLoadingPriceDetails(true);
            try {
              const priceResponse = await contractService.getContractPdfData(contractResponse.data.id);
              if (priceResponse?.success) {
                setPriceDetails(priceResponse.data?.priceDetails);
              }
            } catch (priceError) {
              console.error('[useStaffOrderDetail] Error fetching price details:', priceError);
            } finally {
              setLoadingPriceDetails(false);
            }
          }
        }
      } catch (contractError) {
        console.log('[useStaffOrderDetail] No contract found');
      }
    } catch (err: any) {
      console.error('[useStaffOrderDetail] Error fetching order detail:', err);
      setError(err?.message || 'Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const updateOrder = useCallback(async (orderData: any) => {
    if (!id) return;
    try {
      const response = await orderService.updateOrder(id, orderData);
      await fetchOrderDetail();
      return response;
    } catch (err: any) {
      console.error('[useStaffOrderDetail] Error updating order:', err);
      throw err;
    }
  }, [id, fetchOrderDetail]);

  const deleteOrder = useCallback(async () => {
    if (!id) return;
    try {
      await orderService.deleteOrder(id);
      return true;
    } catch (err: any) {
      console.error('[useStaffOrderDetail] Error deleting order:', err);
      throw err;
    }
  }, [id]);

  const createContract = useCallback(async (contractData: CreateContractRequest) => {
    try {
      const response = await contractService.createContract(contractData);
      await fetchOrderDetail();
      return response;
    } catch (err: any) {
      console.error('[useStaffOrderDetail] Error creating contract:', err);
      throw err;
    }
  }, [fetchOrderDetail]);

  return {
    order,
    contract,
    priceDetails,
    loading,
    loadingPriceDetails,
    error,
    refetch: fetchOrderDetail,
    updateOrder,
    deleteOrder,
    createContract,
  };
};
