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

    console.log('Searching places with query:', query);
    setIsSearching(true);
    try {
      console.log('Calling autocomplete API with query:', query, 'bounds:', HCMC_BOUNDS);
      const results = await trackasiaService.autocomplete(query, 5, HCMC_BOUNDS);
      console.log('Autocomplete API results:', results);

      if (results.length === 0) {
        console.log('No results found for query:', query);
        setSearchOptions([{
          value: 'no-results',
          label: 'Không tìm thấy kết quả'
        }]);
      } else {
        console.log('Found', results.length, 'results for query:', query);
        setSearchOptions(results.map(result => {
          console.log('Result item:', result);
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

    console.log('Selected place ID:', placeId);
    setIsSearching(true);

    try {
      console.log('Calling getPlaceDetail API with place_id:', placeId);
      const placeDetail = await trackasiaService.getPlaceDetail(placeId);
      console.log('Place detail API response:', placeDetail);

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
