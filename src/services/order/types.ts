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
    StaffOrderDetailItem
} from '@/models/Order';
import type { ApiResponse, PaginatedResponse } from '../api/types';

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