import httpClient from "../api/httpClient";
import type {
  Order,
  OrderDetail,
  OrderCreateRequest,
  OrderRequest,
} from "@/models/Order";
import type {
  OrderUpdateDto,
  OrderResponse,
  OrdersResponse,
  PaginatedOrdersResponse,
  OrderTrackingApiResponse,
  OrderDetailsResponse,
  VehicleAssignmentResponse,
} from "./types";
import type { PaginationParams } from "../api/types";
import { handleApiError } from "../api/errorHandler";
import {
  formatToVietnamTime,
  getTomorrowVietnamTime,
} from "../../utils/dateUtils";
import customerService from "../customer/customerService";
import { AUTH_ACCESS_TOKEN_KEY } from "@/config";

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
      const response = await httpClient.get<OrdersResponse>("/orders/get-all");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw handleApiError(error, "Không thể tải danh sách đơn hàng");
    }
  },

  /**
   * Get paginated orders
   * @param params Pagination parameters
   * @returns Promise with paginated orders response
   */
  getPaginatedOrders: async (
    params: PaginationParams
  ): Promise<PaginatedOrdersResponse> => {
    try {
      const response = await httpClient.get<PaginatedOrdersResponse>(
        "/orders/paginated",
        {
          params,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching paginated orders:", error);
      throw handleApiError(error, "Không thể tải danh sách đơn hàng");
    }
  },

  /**
   * Get order by ID
   * @param id Order ID
   * @returns Promise with order data
   */
  getOrderById: async (id: string): Promise<Order> => {
    try {
      const response = await httpClient.get<OrderResponse>(`/orders/get-by-id/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw handleApiError(error, "Không thể tải thông tin đơn hàng");
    }
  },

  /**
   * Get order details by order ID
   * @param orderId Order ID
   * @returns Promise with order details array
   */
  getOrderDetailsByOrderId: async (orderId: string): Promise<OrderDetail[]> => {
    try {
      const response = await httpClient.get<OrderDetailsResponse>(
        `/order-detail/order/${orderId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching order details for order ${orderId}:`,
        error
      );
      throw handleApiError(error, "Không thể tải chi tiết đơn hàng");
    }
  },

  /**
   * Create new order
   * @param orderData Order data
   * @returns Promise with created order
   */
  createOrder: async (orderData: OrderCreateRequest): Promise<Order> => {
    try {
      // Validate required fields in orderRequest
      const requiredOrderRequestFields = [
        "receiverName",
        "receiverPhone",
        "categoryId",
        "packageDescription",
        "pickupAddressId",
        "deliveryAddressId",
      ];

      const missingOrderRequestFields = requiredOrderRequestFields.filter(
        (field) => !orderData.orderRequest[field as keyof OrderRequest]
      );

      // Validate orderDetails
      if (!orderData.orderDetails || orderData.orderDetails.length === 0) {
        missingOrderRequestFields.push("orderDetails");
      } else {
        // Check each orderDetail has required fields
        orderData.orderDetails.forEach((detail, index) => {
          if (!detail.weight || detail.weight <= 0) {
            missingOrderRequestFields.push(`orderDetails[${index}].weight`);
          }
          if (!detail.orderSizeId) {
            missingOrderRequestFields.push(
              `orderDetails[${index}].orderSizeId`
            );
          }
          if (!detail.description) {
            missingOrderRequestFields.push(
              `orderDetails[${index}].description`
            );
          }
        });
      }

      const missingFields = missingOrderRequestFields;

      if (missingFields.length > 0) {
        throw new Error(`Thiếu thông tin: ${missingFields.join(", ")}`);
      }

      // Lấy ID người dùng từ localStorage
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error(
          "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại."
        );
      }

      // Gọi API để lấy thông tin customer từ userId
      const customerData = await customerService.getCustomerProfile(userId);
      if (!customerData || !customerData.id) {
        throw new Error(
          "Không thể lấy thông tin khách hàng. Vui lòng thử lại sau."
        );
      }

      // Tạo ngày giờ ước tính bắt đầu (mặc định là 1 ngày sau) theo UTC+7
      const defaultEstimateStartTime = getTomorrowVietnamTime();

      // Xử lý estimateStartTime từ orderData hoặc sử dụng default
      let finalEstimateStartTime = defaultEstimateStartTime;
      if (orderData.orderRequest.estimateStartTime) {
        // Nếu có estimateStartTime từ form, format lại theo UTC+7
        const inputDate = new Date(orderData.orderRequest.estimateStartTime);
        finalEstimateStartTime = formatToVietnamTime(inputDate);
      }
      const totalWeight = orderData.orderDetails.reduce(
        (sum, detail) => sum + (detail.weight || 0),
        0
      );

      // Chuyển đổi dữ liệu sang định dạng API mong đợi
      const apiOrderData = {
        orderRequest: {
          ...orderData.orderRequest,
          totalWeight: totalWeight,
          senderId: customerData.id, // Sử dụng customerId thay vì userId
          estimateStartTime: finalEstimateStartTime,
          notes: orderData.orderRequest.notes || "Không có ghi chú",
        },
        orderDetails: orderData.orderDetails,
      };

      // Debug log
      console.log("Request body:", JSON.stringify(apiOrderData, null, 2));

      const response = await httpClient.post<OrderResponse>(
        "/orders",
        apiOrderData
      );
      return response.data.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw handleApiError(error, "Không thể tạo đơn hàng");
    }
  },

  /**
   * Update order
   * @param id Order ID
   * @param orderData Order data to update
   * @returns Promise with updated order
   */
  updateOrder: async (
    id: string,
    orderData: OrderUpdateDto
  ): Promise<Order> => {
    try {
      const response = await httpClient.put<OrderResponse>(
        `/orders/${id}`,
        orderData
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating order ${id}:`, error);
      throw handleApiError(error, "Không thể cập nhật đơn hàng");
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
      throw handleApiError(error, "Không thể xóa đơn hàng");
    }
  },

  /**
   * Track order location
   * @param id Order ID
   * @returns Promise with tracking data
   */
  trackOrder: async (
    id: string
  ): Promise<{ latitude: number; longitude: number }> => {
    try {
      const response = await httpClient.get<OrderTrackingApiResponse>(
        `/orders/${id}/track`
      );
      const trackingData = response.data.data;
      return {
        latitude: trackingData.latitude,
        longitude: trackingData.longitude,
      };
    } catch (error) {
      console.error(`Error tracking order ${id}:`, error);
      throw handleApiError(error, "Không thể theo dõi vị trí đơn hàng");
    }
  },

  /**
   * Update vehicle assignment for order details
   * @param orderId Order ID
   * @returns Promise with updated order details
   */
  updateVehicleAssignmentForDetails: async (orderId: string): Promise<OrderDetail[]> => {
    try {
      // Get token from localStorage to ensure it's included
      const token = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);

      const response = await httpClient.put<VehicleAssignmentResponse>(
        `/order-details/update-vehicle-assignment-for-details?orderId=${orderId}`,
        {}, // Empty body
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating vehicle assignment for order ${orderId}:`, error);
      throw handleApiError(error, "Không thể cập nhật phân công xe cho đơn hàng");
    }
  },

  /**
 * Update vehicle assignment for a specific order detail
 * @param orderDetailId Order Detail ID or tracking code
 * @returns Promise with updated order detail
 */
  updateVehicleAssignmentForOrderDetail: async (orderId: string): Promise<OrderDetail> => {
    try {
      // Get token from localStorage to ensure it's included
      const token = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);

      const response = await httpClient.put<{ data: OrderDetail }>(
        `/order-details/update-vehicle-assignment-for-details?orderId=${orderId}`,
        {}, // Empty body
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating vehicle assignment for order ${orderId}:`, error);
      throw handleApiError(error, "Không thể cập nhật phân công xe cho đơn hàng");
    }
  },

  /**
   * Get all orders for a specific customer by user ID
   * @param userId User ID
   * @returns Promise with array of orders
   */
  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    try {
      const response = await httpClient.get<OrdersResponse>(`/orders/get-orders-for-cus-by-user-id/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching orders for user ${userId}:`, error);
      throw handleApiError(error, "Không thể tải danh sách đơn hàng");
    }
  },

  /**
   * Get order details for a customer by order ID
   * @param orderId Order ID
   * @returns Promise with detailed order response
   */
  getOrderForCustomerByOrderId: async (orderId: string): Promise<any> => {
    try {
      const response = await httpClient.get<any>(`/orders/get-order-for-customer-by-order-id/${orderId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching customer order details for order ${orderId}:`, error);
      throw handleApiError(error, "Không thể tải thông tin chi tiết đơn hàng");
    }
  },

  /**
 * Get orders with filters for a specific user
 * @param userId User ID
 * @param filters Filter parameters (year, quarter, status, addressId)
 * @returns Promise with filtered orders
 */
  getFilteredOrdersByUserId: async (userId: string, filters: {
    year?: number;
    quarter?: number;
    status?: string;
    addressId?: string;
  }): Promise<Order[]> => {
    try {
      // Build query parameters
      const params: Record<string, string> = {};

      if (filters.year) params.year = filters.year.toString();
      if (filters.quarter) params.quarter = filters.quarter.toString();
      if (filters.status) params.status = filters.status;
      if (filters.addressId) params.addressId = filters.addressId;

      const response = await httpClient.get<OrdersResponse>(
        `/orders/get-orders-for-cus-by-user-id/${userId}`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching filtered orders for user ${userId}:`, error);
      throw handleApiError(error, "Không thể tải danh sách đơn hàng đã lọc");
    }
  },
};

export default orderService;
