import axios from 'axios';
import { TRACKASIA_MAP_API_KEY, TRACKASIA_MAP_API_BASE_URL } from '../../config/env';
import type { MapLocation } from '../../models/Map';
import type { RouteResponse } from '../../models/Route';

// Base URL for TrackAsia API
const TRACKASIA_API_BASE_URL = TRACKASIA_MAP_API_BASE_URL;

// Types for API responses
export interface GeocodingResult {
    id: string;
    type: string;
    place_type: string[];
    relevance: number;
    properties: {
        accuracy: string;
    };
    text: string;
    place_name: string;
    center: [number, number];
    geometry: {
        type: string;
        coordinates: [number, number];
    };
    context: Array<{
        id: string;
        text: string;
    }>;
}

export interface GeocodingResponse {
    type: string;
    query: string[];
    features: GeocodingResult[];
    attribution: string;
}

export interface DirectionsResponse {
    routes: Array<{
        weight_name: string;
        weight: number;
        duration: number;
        distance: number;
        legs: Array<{
            steps: Array<{
                maneuver: {
                    bearing_after: number;
                    bearing_before: number;
                    location: [number, number];
                    modifier?: string;
                    type: string;
                    instruction: string;
                };
                name: string;
                duration: number;
                distance: number;
                geometry: string;
            }>;
            summary: string;
            weight: number;
            duration: number;
            distance: number;
        }>;
        geometry: string;
    }>;
    waypoints: Array<{
        name: string;
        location: [number, number];
    }>;
    code: string;
    uuid: string;
}

// Lưu trữ controller cho request hiện tại để có thể hủy nếu cần
let currentSearchController: AbortController | null = null;

// Hàm định dạng khoảng cách
const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
};

// Hàm định dạng thời gian
const formatTime = (seconds: number): string => {
    if (seconds < 60) {
        return `${Math.round(seconds)} giây`;
    } else if (seconds < 3600) {
        return `${Math.round(seconds / 60)} phút`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.round((seconds % 3600) / 60);
        return `${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`;
    }
};

const trackasiaService = {
    /**
     * Tìm kiếm địa điểm với TrackAsia API v2
     * @param query Từ khóa tìm kiếm
     * @param location Vị trí hiện tại để tìm kiếm gần đó [lat, lng]
     * @param radius Bán kính tìm kiếm (mét)
     * @returns Danh sách kết quả tìm kiếm
     */
    autocomplete: async (
        query: string,
        location?: [number, number],
        radius: number = 50000
    ): Promise<AutocompleteResult[]> => {
        try {
            // Hủy request cũ nếu đang có request đang chạy
            if (currentSearchController) {
                currentSearchController.abort();
            }

            // Tạo controller mới cho request này
            currentSearchController = new AbortController();

            const locationParam = location
                ? `&location=${location[0]},${location[1]}&radius=${radius}`
                : '';

            const url = `https://maps.track-asia.com/api/v2/place/autocomplete/json?input=${encodeURIComponent(
                query
            )}&key=${TRACKASIA_MAP_API_KEY}${locationParam}&language=vi&new_admin=true`;

            const response = await axios.get<AutocompleteResponse>(url, {
                signal: currentSearchController.signal,
            });

            // Xóa controller sau khi request hoàn thành
            currentSearchController = null;

            if (response.data.status === 'OK') {
                return response.data.predictions;
            }

            return [];
        } catch (error: any) {
            // Nếu lỗi không phải do hủy request
            if (error.name !== 'AbortError') {
                console.error('Error autocompleting places:', error);
            }
            return [];
        }
    },

    /**
     * Lấy chi tiết địa điểm từ place_id
     * @param placeId ID của địa điểm
     * @returns Chi tiết địa điểm
     */
    getPlaceDetail: async (placeId: string): Promise<PlaceDetailResult | null> => {
        try {
            const url = `https://maps.track-asia.com/api/v2/place/details/json?place_id=${placeId}&key=${TRACKASIA_MAP_API_KEY}&language=vi&new_admin=true`;
            const response = await axios.get<PlaceDetailResponse>(url);

            if (response.data.status === 'OK') {
                return response.data.result;
            }

            return null;
        } catch (error) {
            console.error('Error getting place detail:', error);
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
            const url = `https://maps.track-asia.com/api/v2/geocode/json?latlng=${lat},${lng}&key=${TRACKASIA_MAP_API_KEY}&language=vi&new_admin=true`;
            const response = await axios.get<ReverseGeocodingResponse>(url);

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                return {
                    lat,
                    lng,
                    address: result.formatted_address,
                    placeId: result.place_id
                };
            }

            return null;
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            return null;
        }
    },

    /**
     * Tìm đường đi giữa hai điểm sử dụng TrackAsia API v2
     * @param startLat Vĩ độ điểm xuất phát
     * @param startLng Kinh độ điểm xuất phát
     * @param endLat Vĩ độ điểm đến
     * @param endLng Kinh độ điểm đến
     * @param profile Phương tiện di chuyển (driving, motorcycling, walking, truck)
     * @returns Phản hồi từ API directions
     */
    getDirectionsV2: async (
        startLat: number,
        startLng: number,
        endLat: number,
        endLng: number,
        profile: string = 'driving'
    ): Promise<any> => {
        try {
            const response = await axios.get(`${TRACKASIA_API_BASE_URL}/route/v2/directions/json`, {
                params: {
                    key: TRACKASIA_MAP_API_KEY,
                    origin: `${startLat},${startLng}`,
                    destination: `${endLat},${endLng}`,
                    profile: profile,
                    new_admin: true,
                    include_old_admin: true
                }
            });

            if (response.data && response.data.status === 'OK') {
                // Đảm bảo dữ liệu có định dạng đúng
                if (response.data.routes && response.data.routes.length > 0) {
                    const route = response.data.routes[0];

                    // Kiểm tra và đảm bảo các trường cần thiết có sẵn
                    if (!route.legs || route.legs.length === 0) {
                        console.error('No legs found in route');
                        return {
                            status: 'ERROR',
                            message: 'No legs found in route'
                        };
                    }

                    // Đảm bảo mỗi step có đủ thông tin
                    if (route.legs[0].steps) {
                        route.legs[0].steps = route.legs[0].steps.map((step: any) => {
                            // Đảm bảo có trường maneuver
                            if (!step.maneuver) {
                                step.maneuver = '';
                            }

                            // Đảm bảo các trường distance và duration có định dạng đúng
                            if (step.distance && typeof step.distance === 'object' && step.distance.text) {
                                // Đã có định dạng đúng
                            } else if (typeof step.distance === 'number') {
                                // Chuyển đổi từ số thành đối tượng có text
                                step.distance = {
                                    text: formatDistance(step.distance),
                                    value: step.distance
                                };
                            }

                            if (step.duration && typeof step.duration === 'object' && step.duration.text) {
                                // Đã có định dạng đúng
                            } else if (typeof step.duration === 'number') {
                                // Chuyển đổi từ số thành đối tượng có text
                                step.duration = {
                                    text: formatTime(step.duration),
                                    value: step.duration
                                };
                            }

                            return step;
                        });
                    }

                    // Đảm bảo distance và duration của leg có định dạng đúng
                    if (route.legs[0].distance && typeof route.legs[0].distance === 'number') {
                        route.legs[0].distance = {
                            text: formatDistance(route.legs[0].distance),
                            value: route.legs[0].distance
                        };
                    }

                    if (route.legs[0].duration && typeof route.legs[0].duration === 'number') {
                        route.legs[0].duration = {
                            text: formatTime(route.legs[0].duration),
                            value: route.legs[0].duration
                        };
                    }
                }
            }

            return response.data;
        } catch (error) {
            console.error('Error getting directions:', error);
            throw error;
        }
    }
};

// Thêm các interface từ code cũ
export interface AutocompleteResult {
    place_id: string;
    reference: string;
    name: string;
    description: string;
    formatted_address: string;
    icon: string;
    matched_substrings: Array<{
        length: number;
        offset: number;
    }>;
    structured_formatting: {
        main_text: string;
        main_text_matched_substrings: Array<{
            length: number;
            offset: number;
        }>;
        secondary_text: string;
    };
    terms: Array<{
        offset: number;
        value: string;
    }>;
    types: string[];
    old_description?: string;
    old_formatted_address?: string;
}

export interface AutocompleteResponse {
    status: string;
    warning_message?: string;
    predictions: AutocompleteResult[];
}

export interface PlaceDetailResult {
    place_id: string;
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
        location_type: string;
        viewport: {
            northeast: {
                lat: number;
                lng: number;
            };
            southwest: {
                lat: number;
                lng: number;
            };
        };
    };
    name: string;
    types: string[];
    address_components: Array<{
        long_name: string;
        short_name: string;
        types: string[];
    }>;
}

export interface PlaceDetailResponse {
    status: string;
    result: PlaceDetailResult;
}

export interface ReverseGeocodingResponse {
    status: string;
    results: Array<{
        place_id: string;
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
        address_components: Array<{
            long_name: string;
            short_name: string;
            types: string[];
        }>;
        types: string[];
    }>;
}

export default trackasiaService;