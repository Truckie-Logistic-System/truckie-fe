import { useState } from 'react';
import vietmapService from '@/services/map/vietmapService';
import type { VietMapAutocompleteResult, VietMapPlaceDetail } from '@/models/VietMap';

export const useVietMapSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VietMapAutocompleteResult[]>([]);

  const searchPlaces = async (text: string, focus?: string): Promise<VietMapAutocompleteResult[]> => {
    setIsSearching(true);
    try {
      const searchResults = await vietmapService.searchPlaces(text, focus);
      setResults(searchResults || []);
      return searchResults || [];
    } catch (error: any) {
      console.error('Error searching places:', error);
      setResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  const getPlaceDetail = async (refId: string): Promise<VietMapPlaceDetail | null> => {
    setIsSearching(true);
    try {
      const placeDetail = await vietmapService.getPlaceDetail(refId);
      return placeDetail;
    } catch (error: any) {
      console.error('Error getting place detail:', error);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<VietMapAutocompleteResult[] | null> => {
    try {
      const geocodeResults = await vietmapService.reverseGeocode(lat, lng);
      return geocodeResults;
    } catch (error: any) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };

  return {
    isSearching,
    results,
    searchPlaces,
    getPlaceDetail,
    reverseGeocode,
  };
};
