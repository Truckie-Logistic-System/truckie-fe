import type { Order, OrderDetail, OrderCreateRequest as OrderCreateRequestModel } from '@/models/Order';
import type { ApiResponse, PaginatedResponse } from '../api/types';

export interface OrderUpdateDto {
    status?: string;
    notes?: string;
}

export interface OrderTrackingResponse {
    orderId: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    speed?: number;
    heading?: number;
}

export interface UnitsListResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: string[];
}

export interface CustomerOrder {
    id: string;
    orderCode: string;
    totalPrice: number | null;
    totalQuantity: number;
    status: string;
    notes: string;
    packageDescription: string;
    receiverName: string;
    receiverPhone: string;
    pickupAddress: string;
    deliveryAddress: string;
    deliveryAddressId: string;
    createdAt: string;
}

export interface CustomerOrdersResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: CustomerOrder[];
}

export type OrderResponse = ApiResponse<Order>;
export type OrdersResponse = ApiResponse<Order[]>;
export type OrderDetailsResponse = ApiResponse<OrderDetail[]>;
export type PaginatedOrdersResponse = ApiResponse<PaginatedResponse<Order>>;
export type OrderTrackingApiResponse = ApiResponse<OrderTrackingResponse>;
export type VehicleAssignmentResponse = ApiResponse<OrderDetail[]>; 