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