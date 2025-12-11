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
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error fetching all contracts:", error);
      throw handleApiError(error, "Không thể tải danh sách hợp đồng");
    }
  },

  getContractById: async (contractId: string) => {
    try {
      const response = await httpClient.get(`/contracts/${contractId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error fetching contract:", error);
      throw handleApiError(error, "Không thể tải thông tin hợp đồng");
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
      // Fetch base contract data
      const response = await httpClient.get<ContractPdfResponse>(
        `/orders/${contractId}/get-pdf-v2`
      );

      // Fetch optimal and realistic assign results
      try {
        const assignResponse = await httpClient.get(
          `/contracts/${contractId}/get-both-optimal-and-realistic-assign-vehicles`
        );

        if (assignResponse.data?.success && assignResponse.data?.data) {
          // Note: Assignment results are now handled directly in the backend API response
          // The assignResult property contains the vehicle assignment data
        }
      } catch (assignError) {
        console.warn(
          "Could not fetch optimal/realistic assign results, using legacy data:",
          assignError
        );
        // Fallback: use existing assignResult if available
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching contract PDF data:", error);
      throw handleApiError(error, "Không thể tải dữ liệu hợp đồng");
    }
  },

  /**
   * Get contracts by order ID
   * @param orderId - The order ID to get contracts for
   * @returns Promise with contracts data
   */
  getContractsByOrderId: async (orderId: string) => {
    try {
      const response = await httpClient.get(`/contracts/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching contracts for order ${orderId}:`, error);
      throw handleApiError(error, "Không thể tải danh sách hợp đồng");
    }
  },

  /**
   * Upload contract file
   * @param formData - FormData containing contract file
   * @returns Promise with upload response
   */
  uploadContract: async (formData: FormData) => {
    try {
      const response = await httpClient.post(
        "/contracts/upload-contract",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading contract:", error);
      throw handleApiError(error, "Không thể tải lên hợp đồng");
    }
  },

  /**
   * Generate contract PDF on server-side and save to Cloudinary
   * This avoids frontend PDF generation issues with page breaks/truncation
   * @param data - Contract metadata for PDF generation
   * @returns Promise with contract response including PDF URL
   */
  generateAndSaveContractPdf: async (data: {
    contractId: string;
    contractName: string;
    effectiveDate: string;
    expirationDate: string;
    adjustedValue: number;
    description: string;
  }) => {
    try {
      const response = await httpClient.post(
        "/contracts/generate-and-save-pdf",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error generating contract PDF:", error);
      throw handleApiError(error, "Không thể tạo file PDF hợp đồng");
    }
  },

  /**
   * Get all contracts with full details for staff management
   * Returns order info, staff info, computed values
   */
  getAllContractsForStaff: async () => {
    try {
      const response = await httpClient.get("/contracts/staff/list");
      return response.data.data || response.data || [];
    } catch (error) {
      console.error("Error fetching staff contracts:", error);
      // Return empty array instead of throwing to avoid crashing the page
      return [];
    }
  },

  /**
   * Get contract detail with full information for staff
   * Includes order info, staff info, transactions, computed values
   */
  getContractDetailForStaff: async (contractId: string) => {
    try {
      const response = await httpClient.get(`/contracts/staff/${contractId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error fetching staff contract detail:", error);
      throw handleApiError(error, "Không thể tải chi tiết hợp đồng");
    }
  },
};

export default contractService;
