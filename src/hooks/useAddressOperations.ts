import { useState } from 'react';
import addressService from '@/services/address/addressService';
import type { AddressCreateDto, AddressUpdateDto } from '@/models/Address';

export const useAddressOperations = () => {
  const [loading, setLoading] = useState(false);

  const createAddress = async (addressData: AddressCreateDto): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      await addressService.createAddress(addressData);
      return { success: true };
    } catch (error: any) {
      console.error('Error creating address:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi tạo địa chỉ'
      };
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (id: string, addressData: AddressUpdateDto): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      await addressService.updateAddress(id, addressData);
      return { success: true };
    } catch (error: any) {
      console.error('Error updating address:', error);
      return {
        success: false,
        error: error.message || 'Có lỗi xảy ra khi cập nhật địa chỉ'
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createAddress,
    updateAddress,
  };
};
