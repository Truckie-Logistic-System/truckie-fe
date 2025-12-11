import httpClient from '../api/httpClient';
import type {
    GetVehiclesResponse,
    GetVehicleResponse,
    CreateVehicleResponse,
    UpdateVehicleResponse,
    GetVehicleMaintenancesResponse,
    GetVehicleMaintenanceDetailResponse,
    CreateVehicleMaintenanceResponse,
    UpdateVehicleMaintenanceResponse
} from './types';
import type {
    CreateVehicleRequest,
    UpdateVehicleRequest,
    CreateVehicleMaintenanceRequest,
    UpdateVehicleMaintenanceRequest
} from '../../models';
import axios from 'axios';

const vehicleService = {
    /**
     * Get all vehicles
     */
    getVehicles: async () => {
        try {
            const response = await httpClient.get<GetVehiclesResponse>('/vehicles');
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không có dữ liệu
                return {
                    success: true,
                    message: 'Không có phương tiện nào',
                    statusCode: 200,
                    data: []
                };
            }
            console.error('Error fetching vehicles:', error);
            throw error;
        }
    },

    /**
     * Get vehicle by ID
     */
    getVehicleById: async (id: string) => {
        try {
            const response = await httpClient.get<GetVehicleResponse>(`/vehicles/${id}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không tìm thấy phương tiện
                return {
                    success: false,
                    message: 'Không tìm thấy phương tiện',
                    statusCode: 404,
                    data: null
                };
            }
            console.error(`Error fetching vehicle with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Create a new vehicle
     */
    createVehicle: async (vehicleData: CreateVehicleRequest) => {
        try {
            const response = await httpClient.post<CreateVehicleResponse>('/vehicles', vehicleData);
            return response.data;
        } catch (error) {
            console.error('Error creating vehicle:', error);
            throw error;
        }
    },

    /**
     * Update an existing vehicle
     */
    updateVehicle: async (id: string, vehicleData: Omit<UpdateVehicleRequest, 'id'>) => {
        try {
            // Không bao gồm id trong body request vì id đã có trong URL
            const response = await httpClient.put<UpdateVehicleResponse>(`/vehicles/${id}`, vehicleData);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không tìm thấy phương tiện để cập nhật
                return {
                    success: false,
                    message: 'Không tìm thấy phương tiện để cập nhật',
                    statusCode: 404,
                    data: null
                };
            }
            console.error(`Error updating vehicle with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a vehicle
     */
    deleteVehicle: async (id: string) => {
        try {
            const response = await httpClient.delete(`/vehicles/${id}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không tìm thấy phương tiện để xóa
                return {
                    success: false,
                    message: 'Không tìm thấy phương tiện để xóa',
                    statusCode: 404
                };
            }
            console.error(`Error deleting vehicle with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get all vehicle types
     */
    getVehicleTypes: async () => {
        try {
            const response = await httpClient.get('/vehicle-types');
            // Đảm bảo dữ liệu trả về có cấu trúc đúng
            if (response.data.success && Array.isArray(response.data.data)) {
                // Xử lý dữ liệu để đảm bảo vehicleCount là số
                const processedData = response.data.data.map((type: any) => ({
                    ...type,
                    vehicleCount: typeof type.vehicleCount === 'number' ? type.vehicleCount : 0
                }));

                return {
                    ...response.data,
                    data: processedData
                };
            }

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không có dữ liệu
                return {
                    success: true,
                    message: 'Không có loại phương tiện nào',
                    statusCode: 200,
                    data: []
                };
            }
            console.error('Error fetching vehicle types:', error);
            throw error;
        }
    },

    /**
     * Create a new vehicle type
     */
    createVehicleType: async (vehicleTypeData: any) => {
        try {
            const response = await httpClient.post('/vehicle-types', vehicleTypeData);
            return response.data;
        } catch (error) {
            console.error('Error creating vehicle type:', error);
            throw error;
        }
    },

    /**
     * Update an existing vehicle type
     */
    updateVehicleType: async (id: string, vehicleTypeData: any) => {
        try {
            const response = await httpClient.put(`/vehicle-types/${id}`, vehicleTypeData);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không tìm thấy loại phương tiện để cập nhật
                return {
                    success: false,
                    message: 'Không tìm thấy loại phương tiện để cập nhật',
                    statusCode: 404,
                    data: null
                };
            }
            console.error(`Error updating vehicle type with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a vehicle type
     */
    deleteVehicleType: async (id: string) => {
        try {
            const response = await httpClient.delete(`/vehicle-types/${id}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không tìm thấy loại phương tiện để xóa
                return {
                    success: false,
                    message: 'Không tìm thấy loại phương tiện để xóa',
                    statusCode: 404
                };
            }
            console.error(`Error deleting vehicle type with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get all vehicle maintenances
     */
    getVehicleMaintenances: async () => {
        try {
            const response = await httpClient.get<GetVehicleMaintenancesResponse>('/vehicle-service-records');
            // Ensure data is always an array
            if (response.data.success) {
                if (!Array.isArray(response.data.data)) {
                    console.warn('Vehicle maintenances response data is not an array, returning empty array');
                    return {
                        ...response.data,
                        data: []
                    };
                }

                // Map the data to ensure it has the expected structure
                const mappedData = response.data.data.map((item: any) => {
                    // Nếu item đã có vehicleId và không có vehicleEntity, giữ nguyên
                    if (item.vehicleId && !item.vehicleEntity) {
                        return item;
                    }

                    // Nếu có vehicleEntity, thêm vehicleId
                    if (item.vehicleEntity) {
                        return {
                            ...item,
                            vehicleId: item.vehicleEntity.id,
                            vehicle: item.vehicleEntity
                        };
                    }

                    return item;
                });

                return {
                    ...response.data,
                    data: mappedData
                };
            }

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                // 404 không phải lỗi mà là không có dữ liệu
                return {
                    success: true,
                    message: 'Không có lịch bảo trì nào',
                    statusCode: 200,
                    data: []
                };
            }
            console.error('Error fetching vehicle maintenances:', error);
            throw error;
        }
    },

    /**
     * Get vehicle maintenance by ID
     */
    getVehicleMaintenanceById: async (id: string) => {
        try {
            const response = await httpClient.get<GetVehicleMaintenanceDetailResponse>(`/vehicle-service-records/${id}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Không tìm thấy lịch bảo trì',
                    statusCode: 404,
                    data: null
                };
            }
            console.error(`Error fetching vehicle maintenance with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Create a new vehicle maintenance
     */
    createVehicleMaintenance: async (maintenanceData: CreateVehicleMaintenanceRequest) => {
        try {
            const response = await httpClient.post<CreateVehicleMaintenanceResponse>('/vehicle-service-records', maintenanceData);
            return response.data;
        } catch (error) {
            console.error('Error creating vehicle maintenance:', error);
            throw error;
        }
    },

    /**
     * Update vehicle maintenance
     */
    updateVehicleMaintenance: async (id: string, maintenanceData: UpdateVehicleMaintenanceRequest) => {
        try {
            const response = await httpClient.put<UpdateVehicleMaintenanceResponse>(`/vehicle-service-records/${id}`, maintenanceData);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Không tìm thấy lịch bảo trì để cập nhật',
                    statusCode: 404,
                    data: null
                };
            }
            console.error(`Error updating vehicle maintenance with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a vehicle maintenance
     */
    deleteVehicleMaintenance: async (id: string) => {
        try {
            const response = await httpClient.delete(`/vehicle-service-records/${id}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return {
                    success: false,
                    message: 'Không tìm thấy lịch bảo trì để xóa',
                    statusCode: 404
                };
            }
            console.error(`Error deleting vehicle maintenance with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Get vehicle maintenances paginated (sorted by createdAt desc)
     */
    getVehicleMaintenancesPaginated: async (page: number = 0, size: number = 10) => {
        try {
            const response = await httpClient.get(`/vehicle-service-records/paginated?page=${page}&size=${size}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return {
                    success: true,
                    message: 'Không có dữ liệu',
                    statusCode: 200,
                    data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 }
                };
            }
            console.error('Error fetching paginated vehicle maintenances:', error);
            throw error;
        }
    },

    /**
     * Get service types from config
     */
    getServiceTypes: async () => {
        try {
            const response = await httpClient.get<{ success: boolean; data: string[] }>('/vehicle-service-records/service-types');
            return response.data;
        } catch (error) {
            console.error('Error fetching service types:', error);
            return {
                success: true,
                data: []
            };
        }
    },

    /**
     * Complete a maintenance record
     */
    completeMaintenance: async (id: string) => {
        try {
            const response = await httpClient.post(`/vehicle-service-records/${id}/complete`);
            return response.data;
        } catch (error) {
            console.error(`Error completing maintenance ${id}:`, error);
            throw error;
        }
    },

    /**
     * Cancel a maintenance record
     */
    cancelMaintenance: async (id: string) => {
        try {
            const response = await httpClient.post(`/vehicle-service-records/${id}/cancel`);
            return response.data;
        } catch (error) {
            console.error(`Error cancelling maintenance ${id}:`, error);
            throw error;
        }
    },

    /**
     * Trigger manual expiry check
     */
    triggerExpiryCheck: async () => {
        try {
            const response = await httpClient.post('/vehicle-service-records/check-expiry');
            return response.data;
        } catch (error) {
            console.error('Error triggering expiry check:', error);
            throw error;
        }
    },

    /**
     * Get services due soon (within warning days)
     */
    getServicesDueSoon: async (warningDays: number = 30) => {
        try {
            const response = await httpClient.get(`/vehicle-service-records/due-soon?warningDays=${warningDays}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching services due soon:', error);
            throw error;
        }
    },

    /**
     * Get overdue services
     */
    getOverdueServices: async () => {
        try {
            const response = await httpClient.get('/vehicle-service-records/overdue');
            return response.data;
        } catch (error) {
            console.error('Error fetching overdue services:', error);
            throw error;
        }
    }
};

export default vehicleService;