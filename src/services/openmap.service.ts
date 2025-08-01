import { OPEN_MAP_API_KEY, OPEN_MAP_API_BASE_URL } from '../config/env';
import axios from 'axios';

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

// Lưu trữ controller cho request hiện tại để có thể hủy nếu cần
let currentSearchController: AbortController | null = null;

/**
 * Gọi API autocomplete của OpenMap để gợi ý địa điểm
 * @param input Từ khóa tìm kiếm
 * @param location Tọa độ trung tâm tìm kiếm (lat,lng) dạng string
 * @returns Danh sách các địa điểm gợi ý
 */
export const searchPlaces = async (
    input: string,
    location?: string
): Promise<AutocompleteResult[]> => {
    try {
        // Hủy request cũ nếu đang có request đang chạy
        if (currentSearchController) {
            currentSearchController.abort();
        }

        // Tạo controller mới cho request này
        currentSearchController = new AbortController();

        // Đảm bảo input được mã hóa đúng cách
        const encodedInput = encodeURIComponent(input.trim());

        // Xây dựng URL với các tham số
        let url = `${BASE_URL}/autocomplete?input=${encodedInput}`;

        // Thêm tham số location nếu có
        if (location) {
            url += `&location=${location}`;
        }

        // Thêm tham số radius và API key
        url += `&radius=50&apikey=${OPEN_MAP_API_KEY}`;

        const response = await axios.get<AutocompleteResponse>(url, {
            signal: currentSearchController.signal
        });

        // Xóa controller sau khi request hoàn thành
        currentSearchController = null;

        return response.data.predictions || [];
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
            return searchPlaces(input, location); // Thử lại
        }

        console.error('Error searching places:', error);
        return [];
    }
};

/**
 * Lấy thông tin chi tiết của một địa điểm từ place_id
 * @param placeId ID của địa điểm
 * @returns Thông tin chi tiết của địa điểm
 */
export const getPlaceDetail = async (placeId: string): Promise<PlaceDetail | null> => {
    try {
        const response = await axios.get<PlaceDetailResponse>(
            `${BASE_URL}/place?ids=${placeId}&format=google&apikey=${OPEN_MAP_API_KEY}`
        );

        return response.data.result;
    } catch (error) {
        console.error('Error getting place detail:', error);
        return null;
    }
};

/**
 * Lấy địa chỉ từ tọa độ sử dụng API Reverse Geocoding của OpenMap
 * @param lng Kinh độ
 * @param lat Vĩ độ
 * @returns Thông tin địa chỉ
 */
export const getReverseGeocode = async (lng: number, lat: number): Promise<any | null> => {
    try {
        // Sử dụng API Reverse Geocoding của OpenMap
        const response = await axios.get<ReverseGeocodeResponse>(
            `${BASE_URL}/geocode/reverse?latlng=${lat},${lng}&apikey=${OPEN_MAP_API_KEY}`
        );

        // Kiểm tra kết quả trả về
        if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];

            // Định dạng kết quả để phù hợp với cấu trúc hiện tại
            return {
                display: result.formatted_address,
                name: result.name,
                address: result.address,
                components: result.address_components,
                place_id: result.place_id,
                exactPosition: `(${lat.toFixed(6)}, ${lng.toFixed(6)})`,
                location: {
                    lat,
                    lng
                }
            };
        }

        // Nếu không có kết quả, trả về thông tin tọa độ cơ bản
        return {
            display: `Vị trí (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            name: `Vị trí không xác định`,
            address: `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            components: [
                {
                    long_name: `Vĩ độ: ${lat.toFixed(6)}`,
                    short_name: 'Vĩ độ'
                },
                {
                    long_name: `Kinh độ: ${lng.toFixed(6)}`,
                    short_name: 'Kinh độ'
                }
            ],
            exactPosition: `(${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            location: {
                lat,
                lng
            }
        };
    } catch (error) {
        console.error('Error getting reverse geocode:', error);

        // Trả về thông tin tọa độ cơ bản nếu có lỗi
        return {
            display: `Vị trí (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            name: `Lỗi khi lấy thông tin địa chỉ`,
            address: `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            components: [
                {
                    long_name: `Vĩ độ: ${lat.toFixed(6)}`,
                    short_name: 'Vĩ độ'
                },
                {
                    long_name: `Kinh độ: ${lng.toFixed(6)}`,
                    short_name: 'Kinh độ'
                }
            ],
            exactPosition: `(${lat.toFixed(6)}, ${lng.toFixed(6)})`,
            location: {
                lat,
                lng
            }
        };
    }
}; 