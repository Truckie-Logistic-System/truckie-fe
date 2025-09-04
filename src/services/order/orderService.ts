import httpClient from '../api/httpClient';
import type { Order, OrderDetail } from '@/models/Order';
import type {
    OrderCreateDto,
    OrderUpdateDto,
    OrderResponse,
    OrdersResponse,
    PaginatedOrdersResponse,
    OrderTrackingApiResponse,
    OrderDetailsResponse
} from './types';
import type { PaginationParams } from '../api/types';

/**
 * Service for handling order-related API calls
 */
const orderService = {
    /**
     * Get all orders
     * @returns Promise with array of orders
     */
    getAllOrders: async (): Promise<Order[]> => {
        try {
            const response = await httpClient.get<OrdersResponse>('/orders/get-all');
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách đơn hàng');
        }
    },

    /**
     * Get paginated orders
     * @param params Pagination parameters
     * @returns Promise with paginated orders response
     */
    getPaginatedOrders: async (params: PaginationParams): Promise<PaginatedOrdersResponse> => {
        try {
            const response = await httpClient.get<PaginatedOrdersResponse>('/orders/paginated', {
                params
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching paginated orders:', error);
            throw new Error(error.response?.data?.message || 'Không thể tải danh sách đơn hàng');
        }
    },

    /**
     * Get order by ID
     * @param id Order ID
     * @returns Promise with order data
     */
    getOrderById: async (id: string): Promise<Order> => {
        try {
            const response = await httpClient.get<OrderResponse>(`/orders/${id}`);
            return response.data.data;
        } catch (error: any) {
            console.error(`Error fetching order ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể tải thông tin đơn hàng');
        }
    },

    /**
     * Get order details by order ID
     * @param orderId Order ID
     * @returns Promise with order details array
     */
    getOrderDetailsByOrderId: async (orderId: string): Promise<OrderDetail[]> => {
        try {
            const response = await httpClient.get<OrderDetailsResponse>(`/order-detail/order/${orderId}`);
            return response.data.data;
        } catch (error: any) {
            console.error(`Error fetching order details for order ${orderId}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
        }
    },

    /**
     * Create new order
     * @param orderData Order data
     * @returns Promise with created order
     */
    createOrder: async (orderData: OrderCreateDto): Promise<Order> => {
        try {
            const response = await httpClient.post<OrderResponse>('/orders', orderData);
            return response.data.data;
        } catch (error: any) {
            console.error('Error creating order:', error);
            throw new Error(error.response?.data?.message || 'Không thể tạo đơn hàng');
        }
    },

    /**
     * Update order
     * @param id Order ID
     * @param orderData Order data to update
     * @returns Promise with updated order
     */
    updateOrder: async (id: string, orderData: OrderUpdateDto): Promise<Order> => {
        try {
            const response = await httpClient.put<OrderResponse>(`/orders/${id}`, orderData);
            return response.data.data;
        } catch (error: any) {
            console.error(`Error updating order ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể cập nhật đơn hàng');
        }
    },

    /**
     * Delete order
     * @param id Order ID
     */
    deleteOrder: async (id: string): Promise<void> => {
        try {
            await httpClient.delete(`/orders/${id}`);
        } catch (error: any) {
            console.error(`Error deleting order ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể xóa đơn hàng');
        }
    },

    /**
     * Track order location
     * @param id Order ID
     * @returns Promise with tracking data
     */
    trackOrder: async (id: string): Promise<{ latitude: number, longitude: number }> => {
        try {
            const response = await httpClient.get<OrderTrackingApiResponse>(`/orders/${id}/track`);
            const trackingData = response.data.data;
            return {
                latitude: trackingData.latitude,
                longitude: trackingData.longitude
            };
        } catch (error: any) {
            console.error(`Error tracking order ${id}:`, error);
            throw new Error(error.response?.data?.message || 'Không thể theo dõi vị trí đơn hàng');
        }
    }
};

export default orderService; 