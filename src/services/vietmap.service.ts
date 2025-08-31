import { VIET_MAPS_API_KEY } from '../config/env';
import axios from 'axios';

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

export interface RouteResponse {
    license: string;
    code: string;
    messages: string | null;
    paths: RoutePath[];
}

// Lưu trữ controller cho request hiện tại để có thể hủy nếu cần
let currentSearchController: AbortController | null = null;

/**
 * Gọi API autocomplete của VietMap để gợi ý địa điểm
 * @param text Từ khóa tìm kiếm
 * @param focus Tọa độ trung tâm tìm kiếm (lat,lng) dạng string
 * @returns Danh sách các địa điểm gợi ý
 */
export const searchPlaces = async (
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

        return response.data || [];
    } catch (error: any) {
        // Nếu là lỗi do request bị hủy, không cần xử lý
        if (axios.isCancel(error)) {
            console.log('Request canceled');
            return [];
        }

        // Xử lý lỗi 429 (Too Many Requests)
        if (error.response && error.response.status === 429) {
            console.error('Rate limit exceeded (429). Waiting before retrying...');
            // Đợi 2 giây và thử lại
            await new Promise(resolve => setTimeout(resolve, 2000));
            return searchPlaces(text, focus); // Thử lại
        }

        console.error('Error searching places:', error);
        return [];
    }
};

/**
 * Lấy thông tin chi tiết của một địa điểm từ ref_id
 * @param refId ID tham chiếu của địa điểm
 * @returns Thông tin chi tiết của địa điểm
 */
export const getPlaceDetail = async (refId: string): Promise<PlaceDetail | null> => {
    try {
        const response = await axios.get<PlaceDetail>(
            `https://maps.vietmap.vn/api/place/v3?apikey=${VIET_MAPS_API_KEY}&refid=${refId}`
        );

        return response.data;
    } catch (error) {
        console.error('Error getting place detail:', error);
        return null;
    }
};

/**
 * Tìm đường đi giữa các điểm
 * @param points Mảng các điểm [lat, lng] để tìm đường đi
 * @param vehicle Phương tiện di chuyển (car, bike, foot, motorcycle)
 * @returns Thông tin về lộ trình
 */
export const findRoute = async (
    points: [number, number][],
    vehicle: 'car' | 'bike' | 'foot' | 'motorcycle' = 'car'
): Promise<RouteResponse | null> => {
    try {
        if (points.length < 2) {
            throw new Error('Cần ít nhất 2 điểm để tìm đường đi');
        }

        // Tạo chuỗi point=lat,lng cho mỗi điểm
        const pointParams = points.map(([lat, lng]) => `point=${lat},${lng}`).join('&');

        const url = `https://maps.vietmap.vn/api/route?api-version=1.1&apikey=${VIET_MAPS_API_KEY}&${pointParams}&points_encoded=true&vehicle=${vehicle}`;

        const response = await axios.get<RouteResponse>(url);
        return response.data;
    } catch (error) {
        console.error('Error finding route:', error);
        return null;
    }
};

/**
 * Giải mã chuỗi polyline thành mảng các điểm [lng, lat]
 * @param encoded Chuỗi polyline được mã hóa
 * @returns Mảng các điểm dạng [lng, lat]
 */
export function decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        // VietMap returns points in lat,lng order but maplibregl expects lng,lat
        points.push([lng * 1e-5, lat * 1e-5]);
    }

    return points;
} 