import httpClient from '../api/httpClient';

export interface FuelType {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface CreateFuelTypeRequest {
  name: string;
  description?: string;
}

export interface UpdateFuelTypeRequest {
  id: string;
  name: string;
  description?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data: T;
}

const fuelTypeService = {
  /**
   * Get all fuel types (sorted by createdAt DESC)
   */
  getAllFuelTypes: async (): Promise<FuelType[]> => {
    try {
      const response = await httpClient.get<ApiResponse<FuelType[]>>('/fuel-types');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching fuel types:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách loại nhiên liệu');
    }
  },

  /**
   * Get fuel type by ID
   */
  getFuelTypeById: async (id: string): Promise<FuelType> => {
    try {
      const response = await httpClient.get<ApiResponse<FuelType>>(`/fuel-types/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching fuel type:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin loại nhiên liệu');
    }
  },

  /**
   * Search fuel types by name
   */
  searchFuelTypesByName: async (name: string): Promise<FuelType[]> => {
    try {
      const response = await httpClient.get<ApiResponse<FuelType[]>>('/fuel-types/search', {
        params: { name }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error searching fuel types:', error);
      throw new Error(error.response?.data?.message || 'Không thể tìm kiếm loại nhiên liệu');
    }
  },

  /**
   * Create a new fuel type
   */
  createFuelType: async (request: CreateFuelTypeRequest): Promise<FuelType> => {
    try {
      const response = await httpClient.post<ApiResponse<FuelType>>('/fuel-types', request);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating fuel type:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo loại nhiên liệu');
    }
  },

  /**
   * Update an existing fuel type
   */
  updateFuelType: async (request: UpdateFuelTypeRequest): Promise<FuelType> => {
    try {
      const response = await httpClient.put<ApiResponse<FuelType>>('/fuel-types', request);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating fuel type:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật loại nhiên liệu');
    }
  },

  /**
   * Delete a fuel type
   */
  deleteFuelType: async (id: string): Promise<void> => {
    try {
      await httpClient.delete(`/fuel-types/${id}`);
    } catch (error: any) {
      console.error('Error deleting fuel type:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa loại nhiên liệu');
    }
  },
};

export default fuelTypeService;
