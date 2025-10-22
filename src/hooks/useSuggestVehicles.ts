import { useState } from 'react';
import { contractService } from '@/services/contract';
import type { SuggestAssignVehicle } from '@/services/contract/types';

export const useSuggestVehicles = () => {
  const [loading, setLoading] = useState(false);
  const [suggestData, setSuggestData] = useState<SuggestAssignVehicle[]>([]);

  const fetchSuggestions = async (orderId: string): Promise<{ success: boolean; message?: string }> => {
    setLoading(true);
    try {
      const response = await contractService.getSuggestAssignVehicles(orderId);
      if (response.success) {
        setSuggestData(response.data);
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể tải dữ liệu gợi ý',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi tải gợi ý phân phối xe',
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    suggestData,
    setSuggestData,
    fetchSuggestions,
  };
};
