import { useState, useCallback } from 'react';
import { contractService } from '@/services/contract';
import type { ContractData } from '@/services/contract/contractTypes';

/**
 * Hook để quản lý staff contract operations
 */
export const useStaffContractOperations = () => {
  const [creatingContract, setCreatingContract] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [loadingContractData, setLoadingContractData] = useState(false);

  const createContractForCustomer = useCallback(async (contractData: any) => {
    setCreatingContract(true);
    try {
      const response = await contractService.createContractBothRealistic(contractData);
      return response;
    } catch (error: any) {
      console.error('[useStaffContractOperations] Error creating contract:', error);
      throw error;
    } finally {
      setCreatingContract(false);
    }
  }, []);

  const uploadContract = useCallback(async (formData: FormData) => {
    setUploadingContract(true);
    try {
      const response = await contractService.uploadContract(formData);
      return response;
    } catch (error: any) {
      console.error('[useStaffContractOperations] Error uploading contract:', error);
      throw error;
    } finally {
      setUploadingContract(false);
    }
  }, []);

  const getContractPdfData = useCallback(async (contractId: string) => {
    setLoadingContractData(true);
    try {
      const response = await contractService.getContractPdfData(contractId);
      return response;
    } catch (error: any) {
      console.error('[useStaffContractOperations] Error fetching contract PDF data:', error);
      throw error;
    } finally {
      setLoadingContractData(false);
    }
  }, []);

  return {
    creatingContract,
    uploadingContract,
    loadingContractData,
    createContractForCustomer,
    uploadContract,
    getContractPdfData,
  };
};
