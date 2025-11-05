import { useState, useEffect, useCallback } from 'react';
import userService from '@/services/user/userService';

export const useStaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Get users with STAFF role
      const data = await userService.searchUsersByRole('STAFF');
      setStaff(data);
    } catch (err: any) {
      console.error('[useStaffManagement] Error:', err);
      setError(err?.message || 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const getStaffById = useCallback(async (id: string) => {
    return await userService.getUserById(id);
  }, []);

  const createStaff = useCallback(async (data: any) => {
    const response = await userService.registerEmployee(data);
    await fetchStaff();
    return response;
  }, [fetchStaff]);

  const updateStaff = useCallback(async (id: string, data: any) => {
    const response = await userService.updateUserProfile(id, data);
    await fetchStaff();
    return response;
  }, [fetchStaff]);

  const updateStaffStatus = useCallback(async (id: string, status: string) => {
    const response = await userService.updateUserStatus(id, status);
    await fetchStaff();
    return response;
  }, [fetchStaff]);

  return {
    staff,
    loading,
    error,
    refetch: fetchStaff,
    getStaffById,
    createStaff,
    updateStaff,
    updateStaffStatus,
  };
};
