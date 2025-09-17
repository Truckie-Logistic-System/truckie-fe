import httpClient from '../api/httpClient';
import type {
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CreateCategoryPricingRequest,
    UpdateCategoryPricingRequest,
    Category
} from '../../models';
import type { GetCategoriesResponse, GetCategoryPricingResponse } from './types';

export const categoryService = {
    // Các phương thức hiện tại
    getCategories: async (): Promise<GetCategoriesResponse> => {
        try {
            const response = await httpClient.get('/categories');
            return response.data;
        } catch (error) {
            console.error('Error in getCategories:', error);
            return {
                success: false,
                message: 'Error fetching categories',
                statusCode: 500,
                data: []
            };
        }
    },

    // Thêm phương thức getAllCategories để tương thích với trang Create Order
    getAllCategories: async (): Promise<Category[]> => {
        try {
            const response = await httpClient.get('/categories');
            return response.data?.data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    createCategory: async (data: CreateCategoryRequest): Promise<void> => {
        return httpClient.post('/categories', data);
    },

    updateCategory: async (id: string, data: UpdateCategoryRequest): Promise<void> => {
        return httpClient.put(`/categories/${id}`, data);
    },

    deleteCategory: async (id: string): Promise<void> => {
        return httpClient.delete(`/categories/${id}`);
    },

    getCategoryPricingDetails: async (): Promise<GetCategoryPricingResponse> => {
        try {
            const response = await httpClient.get('/category-pricing-details');
            return response.data;
        } catch (error) {
            console.error('Error in getCategoryPricingDetails:', error);
            return {
                success: false,
                message: 'Error fetching category pricing details',
                statusCode: 500,
                data: []
            };
        }
    },

    createCategoryPricing: async (data: CreateCategoryPricingRequest): Promise<void> => {
        return httpClient.post('/category-pricing-details', data);
    },

    updateCategoryPricing: async (id: string, data: UpdateCategoryPricingRequest): Promise<void> => {
        return httpClient.put(`/category-pricing-details/${id}`, data);
    },

    deleteCategoryPricing: async (id: string): Promise<void> => {
        return httpClient.delete(`/category-pricing-details/${id}`);
    }
}; 