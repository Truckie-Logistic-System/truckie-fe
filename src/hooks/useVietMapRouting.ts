import { useState } from 'react';
import vietmapService from '@/services/map/vietmapService';

export const useVietMapRouting = () => {
  const [loading, setLoading] = useState(false);

  const getMapStyle = async (): Promise<{ success: boolean; style?: any; error?: string }> => {
    setLoading(true);
    try {
      const style = await vietmapService.getMapStyles();
      if (style) {
        return { success: true, style };
      }
      return { success: false, error: 'Failed to get map styles' };
    } catch (error: any) {
      console.error('Error getting map styles:', error);
      return {
        success: false,
        error: error.message || 'Error getting map styles'
      };
    } finally {
      setLoading(false);
    }
  };

  const getRoute = async (origin: [number, number], destination: [number, number], vehicle: 'car' | 'bike' | 'foot' | 'motorcycle' = 'car'): Promise<{ success: boolean; route?: any; error?: string }> => {
    setLoading(true);
    try {
      const route = await vietmapService.getRoute(origin, destination, vehicle);
      if (route) {
        return { success: true, route };
      }
      return { success: false, error: 'Failed to get route' };
    } catch (error: any) {
      console.error('Error getting route:', error);
      return {
        success: false,
        error: error.message || 'Error getting route'
      };
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const results = await vietmapService.reverseGeocode(lat, lng);
      return results;
    } catch (error: any) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };

  return {
    loading,
    getMapStyle,
    getRoute,
    reverseGeocode,
  };
};
