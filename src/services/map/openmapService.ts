import { OPEN_MAP_API_KEY, OPEN_MAP_API_BASE_URL } from '../../config/env';
import axios from 'axios';
import type { OpenMapSearchResponse, OpenMapRouteResponse } from './types';
import type { MapLocation } from '../../models/Map';
import type { RouteResponse } from '../../models/Route';

const BASE_URL = OPEN_MAP_API_BASE_URL;

export interface AutocompleteResult {
    description: string;
    matched_substrings: {
        length: number;
        offset: number;
    }[];
    place_id: string;
    structured_formatting: {
        main_text: string;
        main_text_matched_substrings: {
            length: number;
            offset: number;
        }[];
        secondary_text: string;
        secondary_text_matched_substrings: any[];
    };
    terms: {
        offset: number;
        value: string;
    }[];
    types: string[];
    distance_meters: number | null;
}

export interface AutocompleteResponse {
    predictions: AutocompleteResult[];
    status: string;
}

export interface PlaceDetail {
    place_id: string;
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
        viewport: any;
    };
    address_components: {
        long_name: string;
        short_name: string;
    }[];
    name: string;
    url: string;
    types: string[];
}

export interface PlaceDetailResponse {
    result: PlaceDetail;
    status: string;
}

export interface ReverseGeocodeResult {
    address: string;
    address_components: {
        long_name: string;
        short_name: string;
    }[];
    formatted_address: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
    };
    name: string;
    place_id: string;
    types: string[];
}

export interface ReverseGeocodeResponse {
    results: ReverseGeocodeResult[];
    status: string;
}

export interface DirectionStep {
    distance: {
        text: string;
        value: number;
    };
    duration: {
        text: string;
        value: number;
    };
    end_location: {
        lat: number;
        lng: number;
    };
    html_instructions: string;
    maneuver: string;
    polyline: {
        points: string;
    };
    start_location: {
        lat: number;
        lng: number;
    };
    travel_mode: string;
}

export interface DirectionLeg {
    distance: {
        text: string;
        value: number;
    };
    duration: {
        text: string;
        value: number;
    };
    end_address: string;
    end_location: {
        lat: number;
        lng: number;
    };
    start_address: string;
    start_location: {
        lat: number;
        lng: number;
    };
    steps: DirectionStep[];
}

export interface DirectionRoute {
    bounds: {
        northeast: {
            lat: number;
            lng: number;
        };
        southwest: {
            lat: number;
            lng: number;
        };
    };
    copyrights: string;
    legs: DirectionLeg[];
    overview_polyline: {
        points: string;
    };
    summary: string;
    warnings: string[];
    waypoint_order: number[];
}

export interface DirectionResponse {
    routes: DirectionRoute[];
    status: string;
}

// Lưu trữ controller cho request hiện tại để có thể hủy nếu cần
let currentSearchController: AbortController | null = null;

const openmapService = {
    /**
     * Tìm kiếm địa điểm với OpenMap API
     * @param query Từ khóa tìm kiếm
     * @param location Vị trí hiện tại để tìm kiếm gần đó (lat,lng)
     * @param radius Bán kính tìm kiếm (mét)
     * @returns Danh sách kết quả tìm kiếm
     */
    searchPlaces: async (
        query: string,
        location?: { lat: number; lng: number },
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
                ? `&location=${location.lat},${location.lng}&radius=${radius}`
                : '';

            const url = `${BASE_URL}/place/autocomplete?input=${encodeURIComponent(
                query
            )}&key=${OPEN_MAP_API_KEY}${locationParam}&language=vi`;

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
                console.error('Error searching places:', error);
            }
            return [];
        }
    },

    /**
     * Lấy chi tiết địa điểm từ place_id
     * @param placeId ID của địa điểm
     * @returns Chi tiết địa điểm
     */
    getPlaceDetail: async (placeId: string): Promise<PlaceDetail | null> => {
        try {
            const url = `${BASE_URL}/place/details?place_id=${placeId}&key=${OPEN_MAP_API_KEY}&language=vi`;
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
            const url = `${BASE_URL}/geocode/reverse?latlng=${lat},${lng}&key=${OPEN_MAP_API_KEY}&language=vi`;
            const response = await axios.get<ReverseGeocodeResponse>(url);

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                return {
                    lat,
                    lng,
                    address: result.formatted_address,
                    name: result.name,
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
            const url = `${BASE_URL}/directions?origin=${origin[1]},${origin[0]}&destination=${destination[1]},${destination[0]}&key=${OPEN_MAP_API_KEY}&language=vi`;
            const response = await axios.get<DirectionResponse>(url);

            if (response.data.status === 'OK' && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                const leg = route.legs[0];

                // Chuyển đổi sang định dạng RouteResponse
                return {
                    distance: leg.distance.value,
                    duration: leg.duration.value,
                    legs: [{
                        steps: leg.steps.map(step => ({
                            distance: step.distance.value,
                            duration: step.duration.value,
                            geometry: {
                                coordinates: [], // Cần giải mã polyline nếu cần
                                type: "LineString"
                            },
                            name: "",
                            mode: step.travel_mode.toLowerCase(),
                            maneuver: {
                                type: step.maneuver || "turn",
                                location: [step.start_location.lng, step.start_location.lat],
                                instruction: step.html_instructions
                            }
                        }))
                    }]
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting directions:', error);
            return null;
        }
    }
};

export default openmapService; 