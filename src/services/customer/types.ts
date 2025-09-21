import type { Customer } from '@/models/Customer';
import type { UserResponse } from '@/models/User';
import type { ApiResponse, PaginatedResponse } from '../api/types';

export type { Customer, UserResponse };
export type CustomerResponse = ApiResponse<Customer>;
export type CustomersResponse = ApiResponse<Customer[]>;
export type PaginatedCustomersResponse = ApiResponse<PaginatedResponse<Customer>>;

export interface CustomerUpdateRequest {
    companyName?: string;
    representativeName?: string;
    representativePhone?: string;
    businessLicenseNumber?: string;
    businessAddress?: string;
} 