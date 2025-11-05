import { useState, useEffect, useCallback } from 'react';
import categoryService from '@/services/category';

export const useCategoryManagement = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getCategories();
      const categoriesArray = Array.isArray(response) 
        ? response 
        : (response as any)?.data || [];
      setCategories(categoriesArray);
    } catch (err: any) {
      console.error('[useCategoryManagement] Error:', err);
      setError(err?.message || 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
};
