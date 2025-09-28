import { useQuery, useQueryClient } from '@tanstack/react-query';
import provinceService from '../services/address/provinceService';
import { useState, useEffect } from 'react';
import type { Province, Ward } from '@/models/Province';

/**
 * Custom hook to fetch and manage provinces data
 */
const useProvinces = (enabled = true) => {
    const queryClient = useQueryClient();
    const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
    const [wards, setWards] = useState<Ward[]>([]);

    // Fetch provinces data using React Query
    const {
        data: provinces = [],
        isLoading,
        error,
        isError,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ['provinces'],
        queryFn: async () => {
            console.log('useProvinces hook: Calling provinces API...');
            const result = await provinceService.getProvinces();
            console.log('useProvinces hook: Provinces API result:', result);
            return result;
        },
        staleTime: 24 * 60 * 60 * 1000, // 24 hours
        enabled: enabled,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });

    // Process provinces data when it's available
    useEffect(() => {
        console.log('useProvinces hook: Provinces data changed:', provinces);
        if (provinces.length > 0) {
            try {
                // Find Ho Chi Minh City and set as default
                const hcmc = provinceService.findHoChiMinhCity(provinces);
                console.log('useProvinces hook: HCMC found:', hcmc);

                if (hcmc) {
                    setSelectedProvince(hcmc);

                    // Set wards directly from province
                    const allWards: Ward[] = [];

                    // Kiểm tra xem wards có tồn tại và là mảng không
                    if (hcmc.wards && Array.isArray(hcmc.wards)) {
                        allWards.push(...hcmc.wards);
                        console.log(`useProvinces hook: Found ${allWards.length} wards in HCMC`);
                    } else {
                        console.warn('HCMC has no wards or wards is not an array');
                    }

                    setWards(allWards);
                }
            } catch (error) {
                console.error('Error processing provinces data:', error);
            }
        }
    }, [provinces]);

    // Clear cache and refetch
    const invalidateAndRefetch = () => {
        console.log('useProvinces hook: Invalidating cache and refetching...');
        queryClient.invalidateQueries({ queryKey: ['provinces'] });
        refetch();
    };

    // Find a ward by name or code
    const findWard = (wardNameOrCode: string | number): Ward | undefined => {
        if (typeof wardNameOrCode === 'number') {
            return wards.find(ward => ward.code === wardNameOrCode);
        }

        const wardName = wardNameOrCode.toLowerCase();
        return wards.find(ward =>
            ward.name.toLowerCase() === wardName ||
            ward.name.toLowerCase().includes(wardName) ||
            wardName.includes(ward.name.toLowerCase())
        );
    };

    // Kiểm tra xem dữ liệu có đúng định dạng không
    const isValidData = provinces.length > 0 &&
        provinces.every(province =>
            province &&
            typeof province === 'object' &&
            'name' in province &&
            'wards' in province
        );

    return {
        provinces,
        isLoading,
        isFetching,
        error,
        isError,
        refetch,
        invalidateAndRefetch,
        selectedProvince,
        wards,
        findWard,
        isValidData
    };
};

export default useProvinces; 