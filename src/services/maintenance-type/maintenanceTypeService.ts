import httpClient from '../api/httpClient';
import axios from 'axios';
import type {
    GetMaintenanceTypesResponse,
    GetMaintenanceTypeResponse,
    CreateMaintenanceTypeRequest,
    UpdateMaintenanceTypeRequest,
} from './types';
import type { MaintenanceTypeEntity } from '../../models';

const BASE_URL = '/maintenance-types';

export const maintenanceTypeService = {
    getMaintenanceTypes: async (): Promise<GetMaintenanceTypesResponse> => {
        try {
            const response = await httpClient.get<GetMaintenanceTypesResponse>(BASE_URL);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không có dữ liệu
                return {
                    success: false,
                    message: 'Không tìm thấy dữ liệu loại bảo dưỡng',
                    statusCode: 404,
                    data: []
                };
            }
            console.error('Error fetching maintenance types:', error);
            throw error;
        }
    },

    getMaintenanceType: async (id: string): Promise<GetMaintenanceTypeResponse> => {
        try {
            const response = await httpClient.get<MaintenanceTypeEntity>(`${BASE_URL}/${id}`);
            // Wrap the direct response into our expected format
            return {
                success: true,
                message: 'Lấy thông tin loại bảo dưỡng thành công',
                statusCode: 200,
                data: response.data
            };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không tìm thấy loại bảo dưỡng
                return {
                    success: false,
                    message: 'Không tìm thấy loại bảo dưỡng',
                    statusCode: 404,
                    data: null
                };
            }
            console.error(`Error fetching maintenance type with ID ${id}:`, error);
            throw error;
        }
    },

    createMaintenanceType: async (data: CreateMaintenanceTypeRequest): Promise<GetMaintenanceTypeResponse> => {
        try {
            const response = await httpClient.post<MaintenanceTypeEntity>(BASE_URL, data);
            // Wrap the direct response into our expected format
            return {
                success: true,
                message: 'Tạo loại bảo dưỡng thành công',
                statusCode: 201,
                data: response.data
            };
        } catch (error) {
            console.error('Error creating maintenance type:', error);
            throw error;
        }
    },

    updateMaintenanceType: async (id: string, data: UpdateMaintenanceTypeRequest): Promise<GetMaintenanceTypeResponse> => {
        try {
            const response = await httpClient.put<MaintenanceTypeEntity>(`${BASE_URL}/${id}`, data);
            // Wrap the direct response into our expected format
            return {
                success: true,
                message: 'Cập nhật loại bảo dưỡng thành công',
                statusCode: 200,
                data: response.data
            };
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không tìm thấy loại bảo dưỡng để cập nhật
                return {
                    success: false,
                    message: 'Không tìm thấy loại bảo dưỡng để cập nhật',
                    statusCode: 404,
                    data: null
                };
            }
            console.error(`Error updating maintenance type with ID ${id}:`, error);
            throw error;
        }
    },

    deleteMaintenanceType: async (id: string): Promise<void> => {
        try {
            await httpClient.delete(`${BASE_URL}/${id}`);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                console.warn(`Maintenance type with ID ${id} not found for deletion`);
                return;
            }
            console.error(`Error deleting maintenance type with ID ${id}:`, error);
            throw error;
        }
    },
}; 