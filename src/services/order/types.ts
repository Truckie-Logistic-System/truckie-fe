import type {
  Order,
  OrderDetail,
  OrderCreateRequest as OrderCreateRequestModel,
  OrderUpdateDto,
  OrderTrackingResponse,
  CustomerOrder,
  CustomerOrderDetail,
  CustomerOrderDetailItem,
  CustomerContract,
  CustomerTransaction,
  RecentReceiverSuggestion,
  StaffOrderDetail,
  StaffOrderDetailItem,
} from "@/models/Order";
import type { ApiResponse, PaginatedResponse } from "../api/types";

// Response type interfaces
export interface UnitsListResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: string[];
}

export interface CustomerOrdersResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CustomerOrder[];
}

export interface CustomerOrderDetailResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    order: CustomerOrderDetail;
    contract?: CustomerContract;
    transactions?: CustomerTransaction[];
  };
}

export interface RecentReceiversResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: RecentReceiverSuggestion[];
}

export interface ReceiverDetailsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    receiverName: string;
    receiverPhone: string;
    receiverIdentity: string;
    pickupAddressId: string;
    deliveryAddressId: string;
    pickupAddress: {
      id: string;
      province: string;
      ward: string;
      street: string;
      addressType: boolean;
      latitude: number;
      longitude: number;
      customerId: string;
    };
    deliveryAddress: {
      id: string;
      province: string;
      ward: string;
      street: string;
      addressType: boolean;
      latitude: number;
      longitude: number;
      customerId: string;
    };
  };
}

export interface VehicleSuggestion {
  vehicleIndex: number;
  sizeRuleId: string;
  sizeRuleName: string;
  currentLoad: number;
  currentLoadUnit: string;
  assignedDetails: AssignedDetail[];
  packedDetailDetails?: PackedDetail[];
}

export interface PackedDetail {
  orderDetailId: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  orientation: string;
  trackingCode?: string;
}

export interface AssignedDetail {
  id: string;
  weight: number;
  weightBaseUnit: number;
  unit: string;
  trackingCode: string;
}
export interface VehicleSuggestionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: VehicleSuggestion[];
}

export interface StaffOrderDetailResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    order: StaffOrderDetail;
    contract?: CustomerContract;
    transactions?: CustomerTransaction[];
  };
}

export type OrderResponse = ApiResponse<Order>;
export type OrdersResponse = ApiResponse<Order[]>;
export type OrderDetailsResponse = ApiResponse<OrderDetail[]>;
export type PaginatedOrdersResponse = ApiResponse<PaginatedResponse<Order>>;
export type OrderTrackingApiResponse = ApiResponse<OrderTrackingResponse>;
export type VehicleAssignmentResponse = ApiResponse<OrderDetail[]>;

/**
 * Response type for bill of lading preview API
 */
export interface BillOfLadingPreviewResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    fileName: string;
    base64Content: string;
    mimeType: string;
  }[];
}

/**
 * Response for relistice suggested vehicles
 */
export interface BothOptimalAndRealisticVehicleSuggestionsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: BothOptimalAndRealisticVehicle[];
}

export interface BothOptimalAndRealisticVehicle {
  optimal: VehicleSuggestion[];
  realistic: VehicleSuggestion[];
}
