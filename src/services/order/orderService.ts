import httpClient from '../api/httpClient';
import type { Order, OrderDetail, OrderCreateRequest } from '@/models/Order';
import type {
    OrderUpdateDto,
    OrderResponse,
    OrdersResponse,
    PaginatedOrdersResponse,
    OrderTrackingApiResponse,
    OrderDetailsResponse
} from './types';
import type { PaginationParams } from '../api/types';
import { handleApiError } from '../api/errorHandler';

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
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw handleApiError(error, 'Không thể tải danh sách đơn hàng');
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
        } catch (error) {
            console.error('Error fetching paginated orders:', error);
            throw handleApiError(error, 'Không thể tải danh sách đơn hàng');
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
        } catch (error) {
            console.error(`Error fetching order ${id}:`, error);
            throw handleApiError(error, 'Không thể tải thông tin đơn hàng');
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
        } catch (error) {
            console.error(`Error fetching order details for order ${orderId}:`, error);
            throw handleApiError(error, 'Không thể tải chi tiết đơn hàng');
        }
    },

    /**
     * Create new order
     * @param orderData Order data
     * @returns Promise with created order
     */
    createOrder: async (orderData: OrderCreateRequest): Promise<Order> => {
        try {
            // Validate order data before sending
            const { orderRequest, orderDetails } = orderData;

            // Check if orderDetails is empty or missing required fields
            if (!orderDetails || orderDetails.length === 0 ||
                !orderDetails[0].weight ||
                !orderDetails[0].description ||
                !orderDetails[0].orderSizeId) {
                throw new Error('Chi tiết đơn hàng không hợp lệ');
            }

            // Check if orderRequest is missing required fields
            const requiredFields = [
                'receiverName',
                'receiverPhone',
                'packageDescription',
                'estimateStartTime',
                'deliveryAddressId',
                'pickupAddressId',
                'senderId',
                'categoryId'
            ];

            const missingFields = requiredFields.filter(field => !orderRequest[field as keyof typeof orderRequest]);

            if (missingFields.length > 0) {
                throw new Error(`Thiếu thông tin: ${missingFields.join(', ')}`);
            }

            // Debug log
            console.log("Request body:", JSON.stringify(orderData, null, 2));

            const response = await httpClient.post<OrderResponse>('/orders', orderData);
            return response.data.data;
        } catch (error) {
            console.error('Error creating order:', error);
            throw handleApiError(error, 'Không thể tạo đơn hàng');
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
        } catch (error) {
            console.error(`Error updating order ${id}:`, error);
            throw handleApiError(error, 'Không thể cập nhật đơn hàng');
        }
    },

    /**
     * Delete order
     * @param id Order ID
     */
    deleteOrder: async (id: string): Promise<void> => {
        try {
            await httpClient.delete(`/orders/${id}`);
        } catch (error) {
            console.error(`Error deleting order ${id}:`, error);
            throw handleApiError(error, 'Không thể xóa đơn hàng');
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
        } catch (error) {
            console.error(`Error tracking order ${id}:`, error);
            throw handleApiError(error, 'Không thể theo dõi vị trí đơn hàng');
        }
    }
};

export default orderService; 