import { useState, useEffect, useCallback } from 'react';
import driverService from '@/services/driver/driverService';

export const useDriverManagement = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await driverService.getAllDrivers();
      setDrivers(data);
    } catch (err: any) {
      console.error('[useDriverManagement] Error:', err);
      setError(err?.message || 'Không thể tải danh sách tài xế');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const getDriverById = useCallback(async (id: string) => {
    return await driverService.getDriverById(id);
  }, []);

  const createDriver = useCallback(async (data: any) => {
    const response = await driverService.registerDriver(data);
    await fetchDrivers();
    return response;
  }, [fetchDrivers]);

  const updateDriverStatus = useCallback(async (id: string, status: string) => {
    const response = await driverService.updateDriverStatus(id, status);
    await fetchDrivers();
    return response;
  }, [fetchDrivers]);

  return {
    drivers,
    loading,
    error,
    refetch: fetchDrivers,
    getDriverById,
    createDriver,
    updateDriverStatus,
  };
};
