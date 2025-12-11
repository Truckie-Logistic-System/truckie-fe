import httpClient from '../api/httpClient';
import axios from 'axios';

// Service types are now read-only strings from backend config
export type ServiceType = string;

export interface GetServiceTypesResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: ServiceType[];
}

const BASE_URL = '/vehicle-service-records/service-types';

export const maintenanceTypeService = {
    // Only get operation is available - service types are managed in backend config
    getMaintenanceTypes: async (): Promise<GetServiceTypesResponse> => {
        try {
            const response = await httpClient.get<GetServiceTypesResponse>(BASE_URL);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // Return empty array if no service types configured
                return {
                    success: true,
                    message: 'Không có loại dịch vụ nào được cấu hình',
                    statusCode: 200,
                    data: []
                };
            }
            console.error('Error fetching service types:', error);
            throw error;
        }
    },

    // CRUD operations are no longer supported - service types are config-based
    createMaintenanceType: async () => {
        throw new Error('Tạo loại dịch vụ không được hỗ trợ. Các loại dịch vụ được quản lý trong cấu hình hệ thống.');
    },

    updateMaintenanceType: async () => {
        throw new Error('Cập nhật loại dịch vụ không được hỗ trợ. Các loại dịch vụ được quản lý trong cấu hình hệ thống.');
    },

    deleteMaintenanceType: async () => {
        throw new Error('Xóa loại dịch vụ không được hỗ trợ. Các loại dịch vụ được quản lý trong cấu hình hệ thống.');
    },
};