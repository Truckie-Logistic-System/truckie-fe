import httpClient from "../api/httpClient";
import { handleApiError } from "../api/errorHandler";
import type {
  SuggestAssignVehiclesResponse,
  CreateContractRequest,
  CreateContractResponse,
  GeneratePdfResponse,
} from "./types";
import { at } from "lodash";

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
    orderId: string
  ): Promise<SuggestAssignVehiclesResponse> => {
    try {
      const response = await httpClient.get<SuggestAssignVehiclesResponse>(
        `/contracts/${orderId}/suggest-assign-vehicles`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching suggest assign vehicles:", error);
      throw handleApiError(error, "Không thể tải gợi ý phân phối xe");
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
      const staffId = localStorage.getItem("userId") || "unknown";
      const data = {
        ...contractData,
        attachFileUrl: "string",
        staffId,
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
};

export default contractService;
