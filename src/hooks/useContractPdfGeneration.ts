import { useState } from 'react';
import { contractService } from '@/services/contract';

export const useContractPdfGeneration = () => {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const generatePdf = async (contractId: string): Promise<{ success: boolean; pdfUrl?: string; message?: string }> => {
    setLoadingPdf(true);
    try {
      const response = await contractService.generateContractPdf(contractId);

      if (response.success) {
        setPdfUrl(response.data.pdfUrl);
        return {
          success: true,
          pdfUrl: response.data.pdfUrl,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Không thể tạo file PDF',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Có lỗi xảy ra khi tạo PDF',
      };
    } finally {
      setLoadingPdf(false);
    }
  };

  return {
    loadingPdf,
    pdfUrl,
    generatePdf,
  };
};
