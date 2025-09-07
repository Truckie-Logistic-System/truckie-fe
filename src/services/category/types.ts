import type { Category } from '@/models/Category';
import type { ApiResponse, PaginatedResponse } from '../api/types';

export type { Category };
export type CategoryResponse = ApiResponse<Category>;
export type CategoriesResponse = ApiResponse<Category[]>;
export type PaginatedCategoriesResponse = ApiResponse<PaginatedResponse<Category>>; 