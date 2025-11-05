import { useState, useCallback } from 'react';
import orderService from '@/services/order/orderService';

/**
 * Hook để quản lý contract operations (sign, pay)
 */
export const useContractOperations = () => {
  const [signingContract, setSigningContract] = useState(false);
  const [payingDeposit, setPayingDeposit] = useState(false);
  const [payingFullAmount, setPayingFullAmount] = useState(false);

  const signContract = useCallback(async (contractId: string) => {
    setSigningContract(true);
    try {
      await orderService.signContract(contractId);
      return true;
    } catch (error: any) {
      console.error('[useContractOperations] Error signing contract:', error);
      throw error;
    } finally {
      setSigningContract(false);
    }
  }, []);

  const payDeposit = useCallback(async (contractId: string) => {
    setPayingDeposit(true);
    try {
      const response = await orderService.payDeposit(contractId);
      return response;
    } catch (error: any) {
      console.error('[useContractOperations] Error paying deposit:', error);
      throw error;
    } finally {
      setPayingDeposit(false);
    }
  }, []);

  const payFullAmount = useCallback(async (contractId: string) => {
    setPayingFullAmount(true);
    try {
      const response = await orderService.payFullAmount(contractId);
      return response;
    } catch (error: any) {
      console.error('[useContractOperations] Error paying full amount:', error);
      throw error;
    } finally {
      setPayingFullAmount(false);
    }
  }, []);

  return {
    signingContract,
    payingDeposit,
    payingFullAmount,
    signContract,
    payDeposit,
    payFullAmount,
  };
};
