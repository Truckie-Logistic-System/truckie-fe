import { VIET_MAPS_API_KEY } from '../../config/env';
import axios from 'axios';
import type { VietMapSearchResponse, VietMapRouteResponse } from './types';
import type { MapLocation } from '@/models/Map';
import type { RouteResponse } from '@/models/Route';

export interface AutocompleteResult {
    ref_id: string;
    distance: number;
    address: string;
    name: string;
    display: string;
    boundaries: {
        type: number;
        id: number;
        name: string;
        prefix: string;
        full_name: string;
    }[];
    categories: any[];
    entry_points: any[];
}

export interface PlaceDetail {
    display: string;
    name: string;
    hs_num: string;
    street: string;
    address: string;
    city_id: number;
    city: string;
    district_id: number;
    district: string;
    ward_id: number;
    ward: string;
    lat: number;
    lng: number;
}

export interface RouteInstruction {
    distance: number;
    heading: number;
    sign: number;
    interval: number[];
    text: string;
    time: number;
    street_name: string;
    last_heading: number | null;
}

export interface RoutePath {
    distance: number;
    weight: number;
    time: number;
    transfers: number;
    points_encoded: boolean;
    bbox: number[];
    points: string;
    instructions: RouteInstruction[];
    snapped_waypoints: string;
}

export interface VietMapRouteApiResponse {
    license: string;
    code: string;
    messages: string | null;
    paths: RoutePath[];
}

// Lưu trữ controller cho request hiện tại để có thể hủy nếu cần
let currentSearchController: AbortController | null = null;

const vietmapService = {
    /**
     * Gọi API autocomplete của VietMap để gợi ý địa điểm
     * @param text Từ khóa tìm kiếm
     * @param focus Tọa độ trung tâm tìm kiếm (lat,lng) dạng string
     * @returns Danh sách các địa điểm gợi ý
     */
    searchPlaces: async (
        text: string,
        focus?: string
    ): Promise<AutocompleteResult[]> => {
        try {
            // Hủy request cũ nếu đang có request đang chạy
            if (currentSearchController) {
                currentSearchController.abort();
            }

            // Tạo controller mới cho request này
            currentSearchController = new AbortController();

            // Đảm bảo text được mã hóa đúng cách
            const encodedText = encodeURIComponent(text.trim());
            const focusParam = focus ? `&focus=${focus}` : '';

            const url = `https://maps.vietmap.vn/api/autocomplete/v3?apikey=${VIET_MAPS_API_KEY}&text=${encodedText}${focusParam}&display_type=1`;

            const response = await axios.get<AutocompleteResult[]>(url, {
                signal: currentSearchController.signal
            });

            // Xóa controller sau khi request hoàn thành
            currentSearchController = null;

            return response.data;
        } catch (error: any) {
            // Nếu lỗi không phải do hủy request
            if (error.name !== 'AbortError') {
                console.error('Error searching places:', error);
            }
            return [];
        }
    },

    /**
     * Lấy chi tiết địa điểm từ VietMap
     * @param refId ID tham chiếu của địa điểm
     * @returns Chi tiết địa điểm
     */
    getPlaceDetail: async (refId: string): Promise<PlaceDetail | null> => {
        try {
            const url = `https://maps.vietmap.vn/api/place/v3?apikey=${VIET_MAPS_API_KEY}&refid=${refId}`;
            const response = await axios.get<PlaceDetail>(url);
            return response.data;
        } catch (error) {
            console.error('Error getting place detail:', error);
            return null;
        }
    },

    /**
     * Tìm đường đi giữa hai điểm
     * @param origin Điểm xuất phát [lng, lat]
     * @param destination Điểm đích [lng, lat]
     * @returns Thông tin về tuyến đường
     */
    getRoute: async (
        origin: [number, number],
        destination: [number, number]
    ): Promise<RouteResponse | null> => {
        try {
            const url = `https://maps.vietmap.vn/api/route?api-version=1.1&apikey=${VIET_MAPS_API_KEY}&point=${origin[1]},${origin[0]}&point=${destination[1]},${destination[0]}&vehicle=car&weighting=fastest&locale=vi&elevation=false&points_encoded=true`;

            const response = await axios.get<VietMapRouteApiResponse>(url);

            if (response.data.paths && response.data.paths.length > 0) {
                const path = response.data.paths[0];

                // Chuyển đổi sang định dạng RouteResponse
                return {
                    distance: path.distance,
                    duration: path.time / 1000, // Convert từ milliseconds sang seconds
                    geometry: {
                        coordinates: [], // Cần giải mã polyline nếu cần
                        type: "LineString"
                    },
                    legs: [{
                        steps: path.instructions.map(instruction => ({
                            distance: instruction.distance,
                            duration: instruction.time / 1000,
                            geometry: {
                                coordinates: [],
                                type: "LineString"
                            },
                            name: instruction.street_name,
                            mode: "driving",
                            maneuver: {
                                type: "turn",
                                modifier: instruction.sign.toString(),
                                location: [0, 0], // Không có thông tin vị trí chi tiết
                                instruction: instruction.text
                            }
                        }))
                    }]
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting route:', error);
            return null;
        }
    },

    /**
     * Tìm kiếm địa điểm từ tọa độ (reverse geocoding)
     * @param lat Vĩ độ
     * @param lng Kinh độ
     * @returns Thông tin địa điểm
     */
    reverseGeocode: async (lat: number, lng: number): Promise<MapLocation | null> => {
        try {
            const url = `https://maps.vietmap.vn/api/reverse/v3?apikey=${VIET_MAPS_API_KEY}&lat=${lat}&lng=${lng}`;
            const response = await axios.get<any>(url);

            if (response.data) {
                return {
                    lat,
                    lng,
                    address: response.data.display || response.data.address,
                    name: response.data.name
                };
            }

            return null;
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            return null;
        }
    }
};

export default vietmapService; 