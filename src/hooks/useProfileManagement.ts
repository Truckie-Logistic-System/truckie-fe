import { useState, useEffect, useCallback } from 'react';
import userService from '@/services/user';
import addressService from '@/services/address';

export const useProfileManagement = () => {
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRes, addressesData] = await Promise.all([
        userService.getProfile(),
        addressService.getMyAddresses()
      ]);
      setProfile(profileRes?.data);
      setAddresses(addressesData);
    } catch (err: any) {
      console.error('[useProfileManagement] Error:', err);
      setError(err?.message || 'Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (data: any) => {
    const response = await userService.updateProfile(data);
    await fetchProfile();
    return response.data;
  }, [fetchProfile]);

  const createAddress = useCallback(async (data: any) => {
    const response = await addressService.createAddress(data);
    await fetchProfile();
    return response;
  }, [fetchProfile]);

  const updateAddress = useCallback(async (id: string, data: any) => {
    const response = await addressService.updateAddress(id, data);
    await fetchProfile();
    return response;
  }, [fetchProfile]);

  const deleteAddress = useCallback(async (id: string) => {
    await addressService.deleteAddress(id);
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    addresses,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
    createAddress,
    updateAddress,
    deleteAddress,
  };
};
