import type { Category, FormCategory } from "../types";
import api from "./api";

export const categoryService = {
  getAllCategory: async (): Promise<Category[]> => {
    const response = await api.get("/categories");
    return response.data.data;
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const response = await api.get(`/categories/${id}`);
    return response.data.data;
  },
  searchCategory: async (query: string): Promise<Category[]> => {
    const response = await api.get(`/categories/search`, {
      params: { query },
    });
    return response.data.data;
  },

  createCategory: async (categoryData: FormCategory): Promise<Category> => {
    const response = await api.post(`/categories`, categoryData);
    return response.data.data;
  },

  updateCategory: async (
    id: string,
    categoryData: FormCategory
  ): Promise<Category> => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data.data;
  },
};
