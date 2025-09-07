import type { Address } from '@/models/Address';
import type { ApiResponse, PaginatedResponse } from '../api/types';

export type { Address };
export type AddressResponse = ApiResponse<Address>;
export type AddressesResponse = ApiResponse<Address[]>;
export type PaginatedAddressesResponse = ApiResponse<PaginatedResponse<Address>>; 