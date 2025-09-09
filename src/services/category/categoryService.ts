import httpClient from '../api/httpClient';
import { handleApiError } from '../api/errorHandler';
import type { Category, CategoryCreateDto, CategoryUpdateDto } from '@/models/Category';
import type {
    CategoryResponse,
    CategoriesResponse,
    PaginatedCategoriesResponse
} from './types';
import type { PaginationParams } from '../api/types';

/**
 * Service for handling category-related API calls
 */
const categoryService = {
    /**
     * Get all categories
     * @returns Promise with array of categories
     */
    getAllCategories: async (): Promise<Category[]> => {
        try {
            const response = await httpClient.get<CategoriesResponse>('/categories');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw handleApiError(error, 'Không thể tải danh sách danh mục');
        }
    },

    /**
     * Get category by ID
     * @param id Category ID
     * @returns Promise with category data
     */
    getCategoryById: async (id: string): Promise<Category> => {
        try {
            const response = await httpClient.get<CategoryResponse>(`/categories/${id}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching category ${id}:`, error);
            throw handleApiError(error, 'Không thể tải thông tin danh mục');
        }
    },

    /**
     * Search categories
     * @param query Search query
     * @returns Promise with array of categories
     */
    searchCategories: async (query: string): Promise<Category[]> => {
        try {
            const response = await httpClient.get<CategoriesResponse>(`/categories/search`, {
                params: { query }
            });
            return response.data.data;
        } catch (error) {
            console.error('Error searching categories:', error);
            throw handleApiError(error, 'Không thể tìm kiếm danh mục');
        }
    },

    /**
     * Create new category
     * @param categoryData Category data
     * @returns Promise with created category
     */
    createCategory: async (categoryData: CategoryCreateDto): Promise<Category> => {
        try {
            const response = await httpClient.post<CategoryResponse>('/categories', categoryData);
            return response.data.data;
        } catch (error) {
            console.error('Error creating category:', error);
            throw handleApiError(error, 'Không thể tạo danh mục');
        }
    },

    /**
     * Update category
     * @param id Category ID
     * @param categoryData Category data to update
     * @returns Promise with updated category
     */
    updateCategory: async (id: string, categoryData: CategoryUpdateDto): Promise<Category> => {
        try {
            const response = await httpClient.put<CategoryResponse>(`/categories/${id}`, categoryData);
            return response.data.data;
        } catch (error) {
            console.error(`Error updating category ${id}:`, error);
            throw handleApiError(error, 'Không thể cập nhật danh mục');
        }
    },

    /**
     * Delete category
     * @param id Category ID
     */
    deleteCategory: async (id: string): Promise<void> => {
        try {
            await httpClient.delete(`/categories/${id}`);
        } catch (error) {
            console.error(`Error deleting category ${id}:`, error);
            throw handleApiError(error, 'Không thể xóa danh mục');
        }
    }
};

export default categoryService; 