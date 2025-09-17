import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';
import type { Address, AddressCreateDto, AddressUpdateDto } from '@/models/Address';
import type {
    AddressResponse,
    AddressesResponse,
    PaginatedAddressesResponse
} from './types';
import type { PaginationParams } from '../api/types';

/**
 * Service for handling address-related API calls
 */
const addressService = {
    /**
     * Get all addresses
     * @returns Promise with array of addresses
     */
    getAllAddresses: async (): Promise<Address[]> => {
        try {
            const response = await httpClient.get<AddressesResponse>('/address');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching addresses:', error);
            throw handleApiError(error, 'Không thể tải danh sách địa chỉ');
        }
    },

    /**
     * Get address by ID
     * @param id Address ID
     * @returns Promise with address data
     */
    getAddressById: async (id: string): Promise<Address> => {
        try {
            const response = await httpClient.get<AddressResponse>(`/address/${id}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching address ${id}:`, error);
            throw handleApiError(error, 'Không thể tải thông tin địa chỉ');
        }
    },

    /**
     * Get addresses for a specific customer
     * @param customerId Customer ID
     * @returns Promise with array of addresses
     */
    getAddressesByCustomerId: async (customerId: string): Promise<Address[]> => {
        try {
            const response = await httpClient.get<AddressesResponse>(`/address/${customerId}/list`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching addresses for customer ${customerId}:`, error);
            throw handleApiError(error, 'Không thể tải danh sách địa chỉ của khách hàng');
        }
    },

    /**
     * Create new address
     * @param addressData Address data
     * @returns Promise with created address
     */
    createAddress: async (addressData: AddressCreateDto): Promise<Address> => {
        try {
            const response = await httpClient.post<AddressResponse>('/address', addressData);
            return response.data.data;
        } catch (error) {
            console.error('Error creating address:', error);
            throw handleApiError(error, 'Không thể tạo địa chỉ');
        }
    },

    /**
     * Update address
     * @param id Address ID
     * @param addressData Address data to update
     * @returns Promise with updated address
     */
    updateAddress: async (id: string, addressData: AddressUpdateDto): Promise<Address> => {
        try {
            const response = await httpClient.put<AddressResponse>(`/address/${id}`, addressData);
            return response.data.data;
        } catch (error) {
            console.error(`Error updating address ${id}:`, error);
            throw handleApiError(error, 'Không thể cập nhật địa chỉ');
        }
    },

    /**
     * Delete address
     * @param id Address ID
     */
    deleteAddress: async (id: string): Promise<void> => {
        try {
            await httpClient.delete(`/address/${id}`);
        } catch (error) {
            console.error(`Error deleting address ${id}:`, error);
            throw handleApiError(error, 'Không thể xóa địa chỉ');
        }
    }
};

export default addressService; 