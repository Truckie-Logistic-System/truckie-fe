import httpClient from "../api/httpClient";
import type {
  Order,
  OrderDetail,
  OrderCreateRequest,
  OrderRequest,
  OrderUpdateDto,
  CustomerOrder,
} from "@/models/Order";
import type {
  OrderResponse,
  OrdersResponse,
  PaginatedOrdersResponse,
  OrderTrackingApiResponse,
  OrderDetailsResponse,
  VehicleAssignmentResponse,
  UnitsListResponse,
  CustomerOrdersResponse,
  RecentReceiversResponse,
  ReceiverDetailsResponse,
  CustomerOrderDetailResponse,
  StaffOrderDetailResponse,
  VehicleSuggestionsResponse,
  BillOfLadingPreviewResponse,
  BothOptimalAndRealisticVehicle,
} from "./types";
import type { PaginationParams } from "../api/types";
import { handleApiError } from "../api/errorHandler";
import {
  formatToVietnamTime,
  getTomorrowVietnamTime,
} from "../../utils/dateUtils";

import dayjs from "dayjs";
import type { get } from "lodash";

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
      const response = await httpClient.get<OrderResponse>(
        `/orders/get-by-id/${id}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw handleApiError(error, "Không thể tải thông tin đơn hàng");
    }
  },

  /**
   * Get order details for customer by order ID
   * @param orderId Order ID
   * @returns Promise with customer order details
   */
  getOrderForCustomerByOrderId: async (orderId: string): Promise<any> => {
    try {
      const response = await httpClient.get<CustomerOrderDetailResponse>(
        `/orders/get-order-for-customer-by-order-id/${orderId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching customer order details for order ${orderId}:`,
        error
      );
      throw handleApiError(error, "Không thể tải thông tin đơn hàng");
    }
  },

  /**
   * Get order details for staff by order ID
   * @param orderId Order ID
   * @returns Promise with staff order details
   */
  getOrderForStaffByOrderId: async (orderId: string): Promise<any> => {
    try {
      const response = await httpClient.get<StaffOrderDetailResponse>(
        `/orders/get-order-for-staff-by-order-id/${orderId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching staff order details for order ${orderId}:`,
        error
      );
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
   * @returns Promise with created order response
   */
  createOrder: async (
    orderData: OrderCreateRequest
  ): Promise<OrderResponse> => {
    try {
      // Validate required fields in orderRequest
      const requiredOrderRequestFields = [
        "receiverName",
        "receiverPhone",
        "receiverIdentity",
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
          if (!detail.weightBaseUnit && (!detail.weight || detail.weight <= 0)) {
            missingOrderRequestFields.push(`orderDetails[${index}].weight`);
          }
          if (!detail.unit) {
            missingOrderRequestFields.push(`orderDetails[${index}].unit`);
          }
          if (!detail.orderSizeId) {
            missingOrderRequestFields.push(
              `orderDetails[${index}].orderSizeId`
            );
          }
        });
      }

      const missingFields = missingOrderRequestFields;

      if (missingFields.length > 0) {
        throw new Error(`Thiếu thông tin: ${missingFields.join(", ")}`);
      }

      // API không còn yêu cầu senderId, sẽ tự lấy từ token

      // Tạo ngày giờ ước tính bắt đầu mặc định là 2 ngày sau hiện tại
      // Thêm 2 ngày vào thời gian hiện tại để đảm bảo luôn hợp lệ
      const minPickupTime = dayjs().add(2, 'day');
      const defaultDate = minPickupTime.toDate();
      const defaultEstimateStartTime = formatToVietnamTime(defaultDate);

      // Xử lý estimateStartTime từ orderData hoặc sử dụng default
      let finalEstimateStartTime = defaultEstimateStartTime;

      if (orderData.orderRequest.estimateStartTime) {
        // Nếu có estimateStartTime từ form, kiểm tra và sử dụng
        const inputDate = new Date(orderData.orderRequest.estimateStartTime);

        // Kiểm tra xem thời gian đã chọn có đủ 2 ngày không
        if (dayjs(inputDate).isBefore(minPickupTime)) {
          // Nếu không đủ 2 ngày, sử dụng thời gian mặc định thay vì báo lỗi
          finalEstimateStartTime = defaultEstimateStartTime;
        } else {
          // Nếu đủ 2 ngày, sử dụng thời gian đã chọn
          finalEstimateStartTime = formatToVietnamTime(inputDate);
        }
      }

      const apiOrderData = {
        orderRequest: {
          ...orderData.orderRequest,
          estimateStartTime: finalEstimateStartTime,
          notes: orderData.orderRequest.notes || "Không có ghi chú",
          receiverIdentity: orderData.orderRequest.receiverIdentity || "",
        },
        orderDetails: orderData.orderDetails.map((detail) => ({
          weight: detail.weightBaseUnit || detail.weight,
          unit: detail.unit || "kg",
          description: detail.description || "",
          orderSizeId: detail.orderSizeId,
        })),
      };

      // Debug log
      

      const response = await httpClient.post<OrderResponse>(
        "/orders",
        apiOrderData
      );

      // Trả về toàn bộ response thay vì chỉ trả về data
      return response.data;
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
  updateVehicleAssignmentForDetails: async (
    orderId: string
  ): Promise<OrderDetail[]> => {
    try {
      const response = await httpClient.put<VehicleAssignmentResponse>(
        `/order-details/update-vehicle-assignment-for-details?orderId=${orderId}`,
        {} // Empty body
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error updating vehicle assignment for order ${orderId}:`,
        error
      );
      throw handleApiError(
        error,
        "Không thể cập nhật phân công xe cho đơn hàng"
      );
    }
  },

  /**
   * Update vehicle assignment for a specific order detail
   * @param orderDetailId Order Detail ID or tracking code
   * @returns Promise with updated order detail
   */
  updateVehicleAssignmentForOrderDetail: async (
    orderId: string
  ): Promise<OrderDetail> => {
    try {
      const response = await httpClient.put<{ data: OrderDetail }>(
        `/order-details/update-vehicle-assignment-for-details?orderId=${orderId}`,
        {} // Empty body
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error updating vehicle assignment for order ${orderId}:`,
        error
      );
      throw handleApiError(
        error,
        "Không thể cập nhật phân công xe cho đơn hàng"
      );
    }
  },

  /**
   * Get all orders for a specific customer by user ID
   * @param userId User ID
   * @returns Promise with array of orders
   */
  getOrdersByUserId: async (userId: string): Promise<Order[]> => {
    try {
      const response = await httpClient.get<OrdersResponse>(
        `/orders/get-orders-for-cus-by-user-id/${userId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching orders for user ${userId}:`, error);
      throw handleApiError(error, "Không thể tải danh sách đơn hàng");
    }
  },

  /**
   * Get orders with filters for a specific user
   * @param userId User ID
   * @param filters Filter parameters (year, quarter, status, addressId)
   * @returns Promise with filtered orders
   */
  getFilteredOrdersByUserId: async (
    userId: string,
    filters: {
      year?: number;
      quarter?: number;
      status?: string;
      addressId?: string;
    }
  ): Promise<Order[]> => {
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
      console.error(
        `Error fetching filtered orders for user ${userId}:`,
        error
      );
      throw handleApiError(error, "Không thể tải danh sách đơn hàng đã lọc");
    }
  },

  /**
   * Get list of available units
   * @returns Promise with array of unit strings
   */
  getUnitsList: async (): Promise<string[]> => {
    try {
      const response = await httpClient.get<UnitsListResponse>(
        "/orders/list-unit"
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching units list:", error);
      throw handleApiError(error, "Không thể tải danh sách đơn vị");
    }
  },

  /**
   * Get all orders for the current customer
   * @returns Promise with array of customer orders
   */
  getMyOrders: async (): Promise<CustomerOrder[]> => {
    try {
      const response = await httpClient.get<CustomerOrdersResponse>(
        "/orders/get-my-orders"
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      throw handleApiError(error, "Không thể tải danh sách đơn hàng");
    }
  },

  /**
   * Get filtered orders for the current customer
   * @param filters Filter parameters (year, quarter, status, deliveryAddressId)
   * @returns Promise with filtered customer orders
   */
  getFilteredOrders: async (filters: {
    year?: number;
    quarter?: number;
    status?: string;
    deliveryAddressId?: string;
  }): Promise<CustomerOrder[]> => {
    try {
      // Build query parameters
      const params: Record<string, string> = {};

      if (filters.year) params.year = filters.year.toString();
      if (filters.quarter) params.quarter = filters.quarter.toString();
      if (filters.status) params.status = filters.status;
      if (filters.deliveryAddressId)
        params.deliveryAddressId = filters.deliveryAddressId;

      const response = await httpClient.get<CustomerOrdersResponse>(
        "/orders/get-my-orders",
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error fetching filtered orders:", error);
      throw handleApiError(error, "Không thể tải danh sách đơn hàng đã lọc");
    }
  },

  /**
   * Get list of recent receivers for suggestions
   * @returns Promise with recent receivers data
   */
  getRecentReceivers: async () => {
    try {
      const response = await httpClient.get<RecentReceiversResponse>(
        "/orders/suggestions/recent-receivers"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching recent receivers:", error);
      throw handleApiError(error, "Không thể tải danh sách người nhận gần đây");
    }
  },

  /**
   * Get receiver details by order ID for autofill
   * @param orderId Order ID to get receiver details from
   * @returns Promise with receiver details
   */
  getReceiverDetails: async (orderId: string) => {
    try {
      const response = await httpClient.get<ReceiverDetailsResponse>(
        `/orders/suggestions/receiver-details/${orderId}`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching receiver details for order ${orderId}:`,
        error
      );
      throw handleApiError(error, "Không thể tải thông tin người nhận");
    }
  },

  /**
   * Get suggest assign vehicles for order
   * @param orderId Order ID to get vehicle suggestions
   * @returns Promise with vehicle assignment suggestions
   */
  getSuggestAssignVehicles: async (orderId: string) => {
    try {
      const response = await httpClient.get<VehicleSuggestionsResponse>(
        `/contracts/${orderId}/suggest-assign-vehicles`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching vehicle suggestions for order ${orderId}:`,
        error
      );
      throw handleApiError(error, "Không thể tải đề xuất phân xe");
    }
  },

  /**
   * Get suggest assign vehicles in realistic and optimal range for order
   * @param orderId Order ID to get vehicle suggestions
   * @returns Promise with vehicle assignment suggestions
   */
  getBothOptimalAndRealisticAssignVehicles: async (orderId: string) => {
    try {
      const response = await httpClient.get(
        `/contracts/${orderId}/get-both-optimal-and-realistic-assign-vehicles`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching vehicle suggestions for order ${orderId}:`,
        error
      );
      throw handleApiError(error, "Không thể tải đề xuất phân xe");
    }
  },

  /**
   * Check if contract exists for order
   * @param orderId Order ID to check contract
   * @returns Promise with contract check result
   */
  checkContractByOrderId: async (orderId: string) => {
    try {
      const response = await httpClient.get(`/contracts/order/${orderId}`);
      return response.data;
    } catch (error) {
      // If contract doesn't exist, API might return 404, that's expected
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        return { success: false, data: null, message: "Contract not found" };
      }
      console.error(`Error checking contract for order ${orderId}:`, error);
      throw handleApiError(error, "Không thể kiểm tra hợp đồng");
    }
  },

  /**
   * Preview bill of lading for an order
   * @param orderId Order ID
   * @returns Promise with bill of lading preview data
   */
  previewBillOfLading: async (
    orderId: string
  ): Promise<BillOfLadingPreviewResponse["data"]> => {
    try {
      const response = await httpClient.get<BillOfLadingPreviewResponse>(
        `/bill-of-ladings/order/${orderId}/preview`
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error previewing bill of lading for order ${orderId}:`,
        error
      );
      throw handleApiError(error, "Không thể tải vận đơn");
    }
  },

  /**
   * Sign contract for an order
   * @param contractId Contract ID
   * @returns Promise with response data
   */
  signContract: async (contractId: string): Promise<any> => {
    try {
      const response = await httpClient.put(
        `/orders/sign-contract?contractId=${contractId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error signing contract ${contractId}:`, error);
      throw handleApiError(error, "Không thể ký hợp đồng");
    }
  },

  /**
   * Pay deposit for a signed contract
   * @param contractId Contract ID
   * @returns Promise with response data
   */
  payDeposit: async (contractId: string): Promise<any> => {
    try {
      const response = await httpClient.post(
        `/transactions/pay-os/${contractId}/deposit`
      );
      return response.data;
    } catch (error) {
      console.error(`Error paying deposit for contract ${contractId}:`, error);
      throw handleApiError(error, "Không thể thanh toán đặt cọc");
    }
  },

  /**
   * Pay full amount for a contract
   * @param contractId Contract ID
   * @returns Promise with response data
   */
  payFullAmount: async (contractId: string): Promise<any> => {
    try {
      const response = await httpClient.post(
        `/transactions/pay-os/${contractId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error paying full amount for contract ${contractId}:`, error);
      throw handleApiError(error, "Không thể thanh toán toàn bộ");
    }
  },

  /**
   * Cancel an order
   * Only allowed for orders with status PENDING, PROCESSING, or CONTRACT_DRAFT
   * @param orderId Order ID to cancel
   * @returns Promise with response data
   */
  cancelOrder: async (orderId: string): Promise<any> => {
    try {
      const response = await httpClient.put(
        `/orders/${orderId}/cancel`
      );
      return response.data;
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      throw handleApiError(error, "Không thể hủy đơn hàng");
    }
  },
};

export default orderService;
