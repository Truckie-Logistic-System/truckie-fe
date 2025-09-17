import type { ApiResponse } from '../api/types';
import type { Category, CategoryPricing } from '../../models';

export type GetCategoriesResponse = ApiResponse<Category[]>;
export type GetCategoryPricingResponse = ApiResponse<CategoryPricing[]>; 