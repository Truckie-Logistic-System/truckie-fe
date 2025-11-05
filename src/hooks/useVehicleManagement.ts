import { useState, useEffect, useCallback } from 'react';
import vehicleService from '@/services/vehicle/vehicleService';

export const useVehicleManagement = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [vehiclesRes, typesRes] = await Promise.all([
        vehicleService.getVehicles(),
        vehicleService.getVehicleTypes()
      ]);
      setVehicles(vehiclesRes.data || []);
      setVehicleTypes(typesRes.data || []);
    } catch (err: any) {
      console.error('[useVehicleManagement] Error:', err);
      setError(err?.message || 'Không thể tải danh sách xe');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const getVehicleById = useCallback(async (id: string) => {
    const response = await vehicleService.getVehicleById(id);
    return response.data;
  }, []);

  const createVehicle = useCallback(async (data: any) => {
    const response = await vehicleService.createVehicle(data);
    await fetchVehicles();
    return response;
  }, [fetchVehicles]);

  const updateVehicle = useCallback(async (id: string, data: any) => {
    const response = await vehicleService.updateVehicle(id, data);
    await fetchVehicles();
    return response;
  }, [fetchVehicles]);

  const deleteVehicle = useCallback(async (id: string) => {
    await vehicleService.deleteVehicle(id);
    await fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    vehicleTypes,
    loading,
    error,
    refetch: fetchVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  };
};
