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
import { useAuth } from '@/context';
import customerService from '../customer/customerService';

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
            // Validate required fields
            const requiredFields = [
                'receiverName',
                'receiverPhone',
                'categoryId',
                'packageDescription',
                'weight',
                'orderSizeId',
                'description',
                'pickupAddressId',
                'deliveryAddressId'
            ];

            const missingFields = requiredFields.filter(field => !orderData[field as keyof OrderCreateRequest]);

            if (missingFields.length > 0) {
                throw new Error(`Thiếu thông tin: ${missingFields.join(', ')}`);
            }

            // Lấy ID người dùng từ localStorage
            const userId = localStorage.getItem('userId');
            if (!userId) {
                throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
            }

            // Gọi API để lấy thông tin customer từ userId
            const customerData = await customerService.getCustomerProfile(userId);
            if (!customerData || !customerData.id) {
                throw new Error('Không thể lấy thông tin khách hàng. Vui lòng thử lại sau.');
            }

            // Tạo ngày giờ ước tính bắt đầu (mặc định là 1 ngày sau)
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Format date as YYYY-MM-DDThh:mm:ss for LocalDateTime
            const estimateStartTime = tomorrow.toISOString().replace(/\.\d{3}Z$/, "");

            // Chuyển đổi dữ liệu sang định dạng API mong đợi
            const apiOrderData = {
                orderRequest: {
                    receiverName: orderData.receiverName,
                    receiverPhone: orderData.receiverPhone,
                    packageDescription: orderData.packageDescription,
                    notes: orderData.notes || "Không có ghi chú",
                    pickupAddressId: orderData.pickupAddressId,
                    deliveryAddressId: orderData.deliveryAddressId,
                    categoryId: orderData.categoryId,
                    senderId: customerData.id, // Sử dụng customerId thay vì userId
                    estimateStartTime: estimateStartTime,
                    totalWeight: orderData.weight // Thêm trường totalWeight từ weight
                },
                orderDetails: [
                    {
                        weight: orderData.weight,
                        description: orderData.description,
                        orderSizeId: orderData.orderSizeId
                    }
                ]
            };

            // Debug log
            console.log("Request body:", JSON.stringify(apiOrderData, null, 2));

            const response = await httpClient.post<OrderResponse>('/orders', apiOrderData);
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