import { useState, useEffect, useCallback } from 'react';
import vehicleService from '@/services/vehicle/vehicleService';
import { maintenanceTypeService } from '@/services/maintenance-type/maintenanceTypeService';

export const useMaintenanceManagement = () => {
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaintenances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [maintenancesRes, typesRes] = await Promise.all([
        vehicleService.getVehicleMaintenances(),
        maintenanceTypeService.getMaintenanceTypes()
      ]);
      setMaintenances(maintenancesRes.data || []);
      // Service types are now strings from backend config
      setServiceTypes(typesRes.data || []);
    } catch (err: any) {
      console.error('[useMaintenanceManagement] Error:', err);
      setError(err?.message || 'Không thể tải danh sách bảo trì');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenances();
  }, [fetchMaintenances]);

  const createMaintenance = useCallback(async (data: any) => {
    const response = await vehicleService.createVehicleMaintenance(data);
    await fetchMaintenances();
    return response;
  }, [fetchMaintenances]);

  const updateMaintenance = useCallback(async (id: string, data: any) => {
    const response = await vehicleService.updateVehicleMaintenance(id, data);
    await fetchMaintenances();
    return response;
  }, [fetchMaintenances]);

  return {
    maintenances,
    serviceTypes,
    loading,
    error,
    refetch: fetchMaintenances,
    createMaintenance,
    updateMaintenance,
  };
};
