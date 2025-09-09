import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';
import type {
    DriverModel,
    DriverRegisterRequest,
    DriverResponse,
    DriversResponse
} from './types';

/**
 * Service for handling driver-related API calls
 */
const driverService = {
    /**
     * Get all drivers
     * @returns Promise with array of drivers
     */
    getAllDrivers: async (): Promise<DriverModel[]> => {
        try {
            const response = await httpClient.get<DriversResponse>('/drivers');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching drivers:', error);
            throw handleApiError(error, 'Không thể tải danh sách tài xế');
        }
    },

    /**
     * Get driver by ID
     * @param id Driver ID
     * @returns Promise with driver data
     */
    getDriverById: async (id: string): Promise<DriverModel> => {
        try {
            const response = await httpClient.get<DriverResponse>(`/drivers/${id}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching driver ${id}:`, error);
            throw handleApiError(error, 'Không thể tải thông tin tài xế');
        }
    },

    /**
     * Update driver status
     * @param id Driver ID
     * @param status New status
     * @returns Promise with updated driver
     */
    updateDriverStatus: async (id: string, status: string): Promise<DriverModel> => {
        try {
            const response = await httpClient.patch<DriverResponse>(
                `/drivers/${id}/status`,
                null,
                { params: { status } }
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error updating driver status ${id}:`, error);
            throw handleApiError(error, 'Không thể cập nhật trạng thái tài xế');
        }
    },

    /**
     * Register new driver
     * @param driverData Driver registration data
     * @returns Promise with created driver
     */
    registerDriver: async (driverData: DriverRegisterRequest): Promise<DriverModel> => {
        try {
            const response = await httpClient.post<DriverResponse>(
                '/managers/driver/register',
                driverData
            );
            return response.data.data;
        } catch (error) {
            console.error('Error registering driver:', error);
            throw handleApiError(error, 'Không thể đăng ký tài xế');
        }
    }
};

export default driverService; 