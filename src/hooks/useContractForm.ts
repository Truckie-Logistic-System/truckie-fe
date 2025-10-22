import { useState } from 'react';
import { contractService } from '@/services/contract';
import type { CreateContractRequest, Contract } from '@/services/contract/types';
import { formatToVietnamTime } from '@/utils/dateUtils';

export const useContractForm = () => {
  const [loading, setLoading] = useState(false);

  const submitContract = async (values: any, orderId: string): Promise<{ success: boolean; data?: Contract; message?: string }> => {
    setLoading(true);
    try {
      const contractData: CreateContractRequest = {
        contractName: values.contractName,
        effectiveDate: formatToVietnamTime(values.effectiveDate.toDate()),
        expirationDate: formatToVietnamTime(values.expirationDate.toDate()),
        description: values.description,
        attachFileUrl: values.attachFileUrl || '',
        orderId: orderId,
      };

      const response = await contractService.createContract(contractData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi tạo hợp đồng',
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submitContract,
  };
};
