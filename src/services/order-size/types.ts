import type { OrderSize } from '@/models/OrderSize';
import type { ApiResponse, PaginatedResponse } from '../api/types';

export type { OrderSize };
export interface OrderSizeCreateDto {
    name: string;
    description: string;
    minWeight: number;
    maxWeight: number;
    minLength: number;
    maxLength: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    price: number;
}

export interface OrderSizeUpdateDto {
    name?: string;
    description?: string;
    minWeight?: number;
    maxWeight?: number;
    minLength?: number;
    maxLength?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    price?: number;
    isActive?: boolean;
}

export type OrderSizeResponse = ApiResponse<OrderSize>;
export type OrderSizesResponse = ApiResponse<OrderSize[]>;
export type PaginatedOrderSizesResponse = ApiResponse<PaginatedResponse<OrderSize>>; 