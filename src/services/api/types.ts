// API response types
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    statusCode: number;
    data: T;
}

// Error response type
export interface ApiErrorResponse {
    success: boolean;
    message: string;
    statusCode: number;
    errors?: Record<string, string[]>;
}

// Pagination response
export interface PaginatedResponse<T> {
    items: T[];
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
}

// Pagination request params
export interface PaginationParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

// Base request options
export interface RequestOptions {
    signal?: AbortSignal;
    headers?: Record<string, string>;
} 