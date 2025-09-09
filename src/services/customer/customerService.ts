import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';
import type { Customer, CustomerCreateDto, CustomerUpdateDto } from '@/models/Customer';
import type {
    CustomerResponse,
    CustomersResponse
} from './types';

/**
 * Service for handling customer-related API calls
 */
const customerService = {
    /**
     * Get customer profile by user ID
     * @param userId User ID
     * @returns Promise with customer data
     */
    getCustomerProfile: async (userId: string): Promise<Customer> => {
        try {
            const response = await httpClient.get<CustomerResponse>(`/customers/${userId}/user`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching customer profile:', error);
            throw handleApiError(error, 'Không thể tải thông tin khách hàng');
        }
    },

    /**
     * Update customer profile
     * @param customerId Customer ID
     * @param updateData Customer data to update
     * @returns Promise with updated customer
     */
    updateCustomerProfile: async (customerId: string, updateData: CustomerUpdateDto): Promise<Customer> => {
        try {
            const response = await httpClient.put<CustomerResponse>(`/customers/${customerId}`, updateData);
            return response.data.data;
        } catch (error) {
            console.error('Error updating customer profile:', error);
            throw handleApiError(error, 'Không thể cập nhật thông tin khách hàng');
        }
    },

    /**
     * Get all customers
     * @returns Promise with array of customers
     */
    getAllCustomers: async (): Promise<Customer[]> => {
        try {
            const response = await httpClient.get<CustomersResponse>('/customers');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching customers:', error);
            throw handleApiError(error, 'Không thể tải danh sách khách hàng');
        }
    },

    /**
     * Get customer by ID
     * @param id Customer ID
     * @returns Promise with customer data
     */
    getCustomerById: async (id: string): Promise<Customer> => {
        try {
            const response = await httpClient.get<CustomerResponse>(`/customers/${id}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching customer ${id}:`, error);
            throw handleApiError(error, 'Không thể tải thông tin khách hàng');
        }
    }
};

export default customerService; 