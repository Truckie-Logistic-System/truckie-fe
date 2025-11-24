import { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import trackasiaService from '@/services/map/trackasiaService';
import type { PlaceDetailResult } from '@/models/TrackAsia';

const HCMC_BOUNDS = '106.5444,10.3369,107.0111,11.1602';

export const useAddressSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchOptions, setSearchOptions] = useState<{ value: string; label: string }[]>([]);

  const searchPlaces = async (query: string): Promise<void> => {
    if (!query || query.trim().length < 3) {
      setSearchOptions([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await trackasiaService.autocomplete(query, 5, HCMC_BOUNDS);
      if (results.length === 0) {
        setSearchOptions([{
          value: 'no-results',
          label: 'Không tìm thấy kết quả'
        }]);
      } else {
        setSearchOptions(results.map(result => {
          return {
            value: result.place_id,
            label: result.description || result.name
          };
        }));
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchOptions([{
        value: 'error',
        label: 'Lỗi tìm kiếm, vui lòng thử lại'
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchPlaces(query);
    }, 300),
    []
  );

  const getPlaceDetail = async (placeId: string): Promise<{ success: boolean; place?: PlaceDetailResult; error?: string }> => {
    if (!placeId || placeId === 'no-results' || placeId === 'error') {
      return { success: false, error: 'Invalid place ID' };
    }
    setIsSearching(true);

    try {
      const placeDetail = await trackasiaService.getPlaceDetail(placeId);
      if (placeDetail && placeDetail.geometry && placeDetail.geometry.location) {
        return { success: true, place: placeDetail };
      } else {
        console.error('Invalid place detail response:', placeDetail);
        return { success: false, error: 'Invalid place detail response' };
      }
    } catch (error: any) {
      console.error('Error getting place details:', error);
      return { success: false, error: error.message || 'Error getting place details' };
    } finally {
      setIsSearching(false);
    }
  };

  const autocomplete = async (query: string, limit: number = 5, bounds?: string): Promise<any[]> => {
    try {
      const results = await trackasiaService.autocomplete(query, limit, bounds);
      return results || [];
    } catch (error: any) {
      console.error('Error autocomplete:', error);
      return [];
    }
  };

  return {
    isSearching,
    searchOptions,
    setSearchOptions,
    debouncedSearch,
    getPlaceDetail,
    autocomplete,
  };
};
