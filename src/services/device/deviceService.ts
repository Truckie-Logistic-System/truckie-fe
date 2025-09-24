import httpClient from '../api/httpClient';
import type { CreateDeviceRequest, CreateDeviceTypeRequest, UpdateDeviceRequest, UpdateDeviceTypeRequest } from '../../models';
import type { GetDevicesResponse, GetDeviceTypesResponse } from './types';

export const deviceService = {
    getDevices: async (): Promise<GetDevicesResponse> => {
        try {
            const response = await httpClient.get('/devices');
            return response.data;
        } catch (error) {
            console.error('Error in getDevices:', error);
            // Return a valid empty response structure to avoid errors
            return {
                success: false,
                message: 'Error fetching devices',
                statusCode: 500,
                data: []
            };
        }
    },

    createDevice: async (data: CreateDeviceRequest): Promise<void> => {
        return httpClient.post('/devices', data);
    },

    updateDevice: async (id: string, data: UpdateDeviceRequest): Promise<void> => {
        return httpClient.put(`/devices/${id}`, data);
    },

    deleteDevice: async (id: string): Promise<void> => {
        return httpClient.delete(`/devices/${id}`);
    },

    getDeviceTypes: async (): Promise<GetDeviceTypesResponse> => {
        try {
            const response = await httpClient.get('/device-types');
            return response.data;
        } catch (error) {
            console.error('Error in getDeviceTypes:', error);
            // Return a valid empty response structure to avoid errors
            return {
                success: false,
                message: 'Error fetching device types',
                statusCode: 500,
                data: []
            };
        }
    },

    createDeviceType: async (data: CreateDeviceTypeRequest): Promise<void> => {
        return httpClient.post('/device-types', data);
    },

    updateDeviceType: async (id: string, data: UpdateDeviceTypeRequest): Promise<void> => {
        return httpClient.put(`/device-types/${id}`, data);
    },

    deleteDeviceType: async (id: string): Promise<void> => {
        return httpClient.delete(`/device-types/${id}`);
    },
}; 