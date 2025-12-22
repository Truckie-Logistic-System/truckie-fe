import httpClient from "./api/httpClient";
import type {
  SizeRule,
  SizeRuleRequest,
  UpdateSizeRuleRequest,
} from "@/models/SizeRule";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetSizeRulesParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  vehicleTypeId?: string;
}

export const sizeRuleService = {
  /**
   * Get all size rules with pagination
   */
  getSizeRules: async (
    params?: GetSizeRulesParams
  ): Promise<PaginatedResponse<SizeRule>> => {
    const response = await httpClient.get("/size-rules", { params });
    return response.data;
  },

  /**
   * Get single size rule by ID
   */
  getSizeRuleById: async (id: string): Promise<SizeRule> => {
    const response = await httpClient.get(`/size-rules/${id}`);
    return response.data.data;
  },

  /**
   * Create new size rule (Admin only)
   */
  createSizeRule: async (data: SizeRuleRequest): Promise<SizeRule> => {
    const response = await httpClient.post("/size-rules", data);
    return response.data.data;
  },

  /**
   * Update existing size rule (Admin only)
   */
  updateSizeRule: async (
    id: string,
    data: UpdateSizeRuleRequest
  ): Promise<SizeRule> => {
    const response = await httpClient.put(`/size-rules/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete size rule (Admin only)
   */
  deleteSizeRule: async (id: string): Promise<void> => {
    await httpClient.delete(`/size-rules/${id}`);
  },

  /**
   * Get all categories for dropdown
   */
  getCategories: async (): Promise<any[]> => {
    const response = await httpClient.get("/categories");
    return response.data.data || response.data;
  },

  /**
   * Get all vehicle types for dropdown
   */
  getVehicleTypes: async (): Promise<any[]> => {
    const response = await httpClient.get("/vehicle-types");
    return response.data.data || response.data;
  },
};
