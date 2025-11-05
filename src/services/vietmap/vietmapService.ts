import httpClient from '../api/httpClient';

interface VietMapReverseResponse {
    lat: number;
    lng: number;
    ref_id: string;
    distance: number;
    address: string;
    name: string;
    display: string;
    boundaries: Array<{
        type: number;
        id: number;
        name: string;
        prefix: string;
        full_name: string;
    }>;
    categories: any[];
    entry_points: any[];
    data_old: any;
    data_new: any;
}

interface VietMapStyle {
    version: number;
    sources: {
        [key: string]: {
            type: string;
            tiles: string[];
            tileSize: number;
            attribution: string;
        };
    };
    layers: Array<{
        id: string;
        type: string;
        source: string;
        minzoom: number;
        maxzoom: number;
    }>;
}

const vietmapService = {
    /**
     * Reverse geocode - Lấy địa chỉ từ tọa độ
     * @param lat Latitude
     * @param lng Longitude
     * @returns Promise with location data
     */
    reverseGeocode: async (lat: number, lng: number): Promise<VietMapReverseResponse[]> => {
        try {
            const response = await httpClient.get<VietMapReverseResponse[]>('/vietmap/reverse', {
                params: { lat, lng }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error reverse geocoding:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy thông tin địa chỉ');
        }
    },

    /**
     * Get VietMap style
     * @returns Promise with map style
     */
    getMapStyle: async (): Promise<VietMapStyle> => {
        try {
            const response = await httpClient.get<VietMapStyle>('/vietmap/styles');
            return response.data;
        } catch (error: any) {
            console.error('Error fetching map style:', error);
            throw new Error(error.response?.data?.message || 'Không thể lấy style bản đồ');
        }
    }
};

export default vietmapService;
