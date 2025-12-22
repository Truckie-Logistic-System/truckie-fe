import type { OrderSize } from '@/models/OrderSize';
import type { ApiResponse, PaginatedResponse } from '../api/types';

export type { OrderSize };
export interface OrderSizeCreateDto {
    minLength: number;
    maxLength: number;
    minHeight: number;
    maxHeight: number;
    minWidth: number;
    maxWidth: number;
    description: string;
}

export interface OrderSizeUpdateDto {
    id: string;
    minLength?: number;
    maxLength?: number;
    minHeight?: number;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
    description?: string;
}

export type OrderSizeResponse = ApiResponse<OrderSize>;
export type OrderSizesResponse = ApiResponse<OrderSize[]>;
export type PaginatedOrderSizesResponse = ApiResponse<PaginatedResponse<OrderSize>>;