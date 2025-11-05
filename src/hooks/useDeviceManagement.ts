import { useState, useEffect, useCallback } from 'react';
import { deviceService } from '@/services/device/deviceService';

export const useDeviceManagement = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [devicesRes, typesRes] = await Promise.all([
        deviceService.getDevices(),
        deviceService.getDeviceTypes()
      ]);
      setDevices(devicesRes.data || []);
      setDeviceTypes(typesRes.data || []);
    } catch (err: any) {
      console.error('[useDeviceManagement] Error:', err);
      setError(err?.message || 'Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const createDevice = useCallback(async (data: any) => {
    await deviceService.createDevice(data);
    await fetchDevices();
  }, [fetchDevices]);

  const updateDevice = useCallback(async (id: string, data: any) => {
    await deviceService.updateDevice(id, data);
    await fetchDevices();
  }, [fetchDevices]);

  const deleteDevice = useCallback(async (id: string) => {
    await deviceService.deleteDevice(id);
    await fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    deviceTypes,
    loading,
    error,
    refetch: fetchDevices,
    createDevice,
    updateDevice,
    deleteDevice,
  };
};
