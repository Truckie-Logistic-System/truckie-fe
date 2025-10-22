import { useState } from 'react';
import trackasiaService from '@/services/map/trackasiaService';
import type { MapLocation } from '@/models/Map';

export const useMapGeocoding = () => {
  const [isLocating, setIsLocating] = useState(false);

  const reverseGeocode = async (lat: number, lng: number): Promise<{ success: boolean; address?: string; location?: MapLocation }> => {
    setIsLocating(true);
    try {
      const response = await trackasiaService.reverseGeocode(`${lat},${lng}`);
      
      if (response && response.results && response.results.length > 0) {
        const result = response.results[0];
        return {
          success: true,
          address: result.formatted_address,
          location: {
            lat,
            lng,
            address: result.formatted_address
          }
        };
      } else {
        return {
          success: true,
          address: `${lat}, ${lng}`,
          location: {
            lat,
            lng,
            address: `${lat}, ${lng}`
          }
        };
      }
    } catch (error: any) {
      console.error('Error reverse geocoding:', error);
      return {
        success: true,
        address: `${lat}, ${lng}`,
        location: {
          lat,
          lng,
          address: `${lat}, ${lng}`
        }
      };
    } finally {
      setIsLocating(false);
    }
  };

  const getMapStyle = (style: string = 'streets', isDark: boolean = false) => {
    return trackasiaService.getMapStyle(style, isDark);
  };

  return {
    isLocating,
    reverseGeocode,
    getMapStyle,
  };
};
