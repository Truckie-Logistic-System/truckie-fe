import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';
import type { OrderSize, OrderSizeCreateDto, OrderSizeUpdateDto } from '@/models/OrderSize';
import type {
    OrderSizeResponse,
    OrderSizesResponse,
    PaginatedOrderSizesResponse
} from './types';
import type { PaginationParams } from '../api/types';

/**
 * Service for handling order size-related API calls
 */
const orderSizeService = {
    /**
     * Get all order sizes
     * @returns Promise with array of order sizes
     */
    getAllOrderSizes: async (): Promise<OrderSize[]> => {
        try {
            const response = await httpClient.get<OrderSizesResponse>('/order-sizes');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching order sizes:', error);
            throw handleApiError(error, 'Không thể tải danh sách kích thước đơn hàng');
        }
    },

    /**
     * Get order size by ID
     * @param id Order size ID
     * @returns Promise with order size data
     */
    getOrderSizeById: async (id: string): Promise<OrderSize> => {
        try {
            const response = await httpClient.get<OrderSizeResponse>(`/order-sizes/${id}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching order size ${id}:`, error);
            throw handleApiError(error, 'Không thể tải thông tin kích thước đơn hàng');
        }
    },

    /**
     * Create new order size
     * @param orderSizeData Order size data
     * @returns Promise with created order size
     */
    createOrderSize: async (orderSizeData: OrderSizeCreateDto): Promise<OrderSize> => {
        try {
            const response = await httpClient.post<OrderSizeResponse>('/order-sizes', orderSizeData);
            return response.data.data;
        } catch (error) {
            console.error('Error creating order size:', error);
            throw handleApiError(error, 'Không thể tạo kích thước đơn hàng');
        }
    },

    /**
     * Update order size
     * @param id Order size ID
     * @param orderSizeData Order size data to update
     * @returns Promise with updated order size
     */
    updateOrderSize: async (id: string, orderSizeData: OrderSizeUpdateDto): Promise<OrderSize> => {
        try {
            const response = await httpClient.put<OrderSizeResponse>(`/order-sizes/${id}`, orderSizeData);
            return response.data.data;
        } catch (error) {
            console.error(`Error updating order size ${id}:`, error);
            throw handleApiError(error, 'Không thể cập nhật kích thước đơn hàng');
        }
    },

    /**
     * Delete order size
     * @param id Order size ID
     */
    deleteOrderSize: async (id: string): Promise<void> => {
        try {
            await httpClient.delete(`/order-sizes/${id}`);
        } catch (error) {
            console.error(`Error deleting order size ${id}:`, error);
            throw handleApiError(error, 'Không thể xóa kích thước đơn hàng');
        }
    }
};

export default orderSizeService; 