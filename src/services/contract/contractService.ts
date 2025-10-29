import httpClient from "../api/httpClient";
import { handleApiError } from "../api/errorHandler";
import type {
  SuggestAssignVehiclesResponse,
  CreateContractRequest,
  CreateContractResponse,
  GeneratePdfResponse,
} from "./types";
import type { ContractPdfResponse } from "./contractTypes";

/**
 * Service for handling contract-related API calls
 */
const contractService = {
  /**
   * Get suggested vehicle assignments for an order
   * @param orderId - The order ID to get suggestions for
   * @returns Promise with suggested vehicle assignments
   */
  getSuggestAssignVehicles: async (
    contractId: string
  ): Promise<SuggestAssignVehiclesResponse> => {
    try {
      const response = await httpClient.get<SuggestAssignVehiclesResponse>(
        `/contracts/${contractId}/suggest-assign-vehicles`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching suggest assign vehicles:", error);
      throw handleApiError(error, "Không thể tải gợi ý phân phối xe");
    }
  },

  getAllContracts: async () => {
    try {
      const response = await httpClient.get("/contracts");
      return response.data;
    } catch (error) {
      console.error("Error fetching all contracts:", error);
      throw handleApiError(error, "Không thể tải danh sách hợp đồng");
    }
  },

  /**
   * Create a new contract
   * @param contractData - The contract data to create
   * @returns Promise with created contract
   */
  createContract: async (
    contractData: CreateContractRequest
  ): Promise<CreateContractResponse> => {
    try {
      const data = {
        ...contractData,
      };
      const response = await httpClient.post<CreateContractResponse>(
        `/contracts/both`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error creating contract:", error);
      throw handleApiError(error, "Không thể tạo hợp đồng");
    }
  },

  /**
   * Create a new contract
   * @param contractData - The contract data to create
   * @returns Promise with created contract
   */
  createContractBothRealistic: async (
    contractData: CreateContractRequest
  ): Promise<CreateContractResponse> => {
    try {
      const response = await httpClient.post<CreateContractResponse>(
        `/contracts/both/for-cus`,
        contractData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating contract:", error);
      throw handleApiError(error, "Không thể tạo hợp đồng");
    }
  },

  /**
   * Generate PDF for a contract
   * @param contractId - The contract ID to generate PDF for
   * @returns Promise with PDF URL
   */
  generateContractPdf: async (
    contractId: string
  ): Promise<GeneratePdfResponse> => {
    try {
      const response = await httpClient.post<GeneratePdfResponse>(
        `/orders/${contractId}/generate-pdf`
      );
      return response.data;
    } catch (error) {
      console.error("Error generating contract PDF:", error);
      throw handleApiError(error, "Không thể tạo file PDF hợp đồng");
    }
  },

  /**
   * Get contract PDF data for preview
   * @param contractId - The contract ID to get PDF data for
   * @returns Promise with contract data for PDF generation
   */
  getContractPdfData: async (
    contractId: string
  ): Promise<ContractPdfResponse> => {
    try {
      const response = await httpClient.get<ContractPdfResponse>(
        `/orders/${contractId}/get-pdf-v2`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching contract PDF data:", error);
      throw handleApiError(error, "Không thể tải dữ liệu hợp đồng");
    }
  },
};

export default contractService;
