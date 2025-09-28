import httpClient from '../api/httpClient';
import type { MapLocation } from '../../models/Map';
import type {
    AutocompleteResult,
    AutocompleteResponse,
    PlaceDetailResult,
    PlaceDetailResponse,
    ReverseGeocodingResponse,
    ReverseGeocodingResult,
    DirectionsResponse
} from '../../models/TrackAsia';

// Lưu trữ controller cho request hiện tại để có thể hủy nếu cần
let currentSearchController: AbortController | null = null;

// Mock data cho autocomplete
const mockAutocompleteResults: AutocompleteResult[] = [
    {
        place_id: 'mock_place_1',
        description: 'Quận 1, Thành phố Hồ Chí Minh',
        name: 'Quận 1',
        reference: 'mock_reference_1',
        formatted_address: 'Quận 1, Thành phố Hồ Chí Minh, Việt Nam',
        icon: '',
        matched_substrings: [{ length: 6, offset: 0 }],
        structured_formatting: {
            main_text: 'Quận 1',
            main_text_matched_substrings: [{ length: 6, offset: 0 }],
            secondary_text: 'Thành phố Hồ Chí Minh, Việt Nam'
        },
        terms: [{ offset: 0, value: 'Quận 1' }],
        types: ['political', 'sublocality']
    },
    {
        place_id: 'mock_place_2',
        description: 'Quận 2, Thành phố Hồ Chí Minh',
        name: 'Quận 2',
        reference: 'mock_reference_2',
        formatted_address: 'Quận 2, Thành phố Hồ Chí Minh, Việt Nam',
        icon: '',
        matched_substrings: [{ length: 6, offset: 0 }],
        structured_formatting: {
            main_text: 'Quận 2',
            main_text_matched_substrings: [{ length: 6, offset: 0 }],
            secondary_text: 'Thành phố Hồ Chí Minh, Việt Nam'
        },
        terms: [{ offset: 0, value: 'Quận 2' }],
        types: ['political', 'sublocality']
    },
    {
        place_id: 'mock_place_3',
        description: 'Quận 3, Thành phố Hồ Chí Minh',
        name: 'Quận 3',
        reference: 'mock_reference_3',
        formatted_address: 'Quận 3, Thành phố Hồ Chí Minh, Việt Nam',
        icon: '',
        matched_substrings: [{ length: 6, offset: 0 }],
        structured_formatting: {
            main_text: 'Quận 3',
            main_text_matched_substrings: [{ length: 6, offset: 0 }],
            secondary_text: 'Thành phố Hồ Chí Minh, Việt Nam'
        },
        terms: [{ offset: 0, value: 'Quận 3' }],
        types: ['political', 'sublocality']
    }
];

// Mock data cho place detail
const mockPlaceDetail: PlaceDetailResult = {
    place_id: 'mock_place_1',
    formatted_address: 'Quận 1, Thành phố Hồ Chí Minh, Việt Nam',
    geometry: {
        location: {
            lat: 10.7743,
            lng: 106.6974
        },
        viewport: {
            northeast: {
                lat: 10.7743,
                lng: 106.6974
            },
            southwest: {
                lat: 10.7743,
                lng: 106.6974
            }
        },
        location_type: "ROOFTOP"
    },
    icon: "",
    name: "Quận 1",
    types: ["point_of_interest"],
    address_components: [
        {
            types: ["street_number"],
            long_name: "1",
            short_name: "1"
        },
        {
            types: ["route"],
            long_name: "Đường Nguyễn Huệ",
            short_name: "Nguyễn Huệ"
        },
        {
            types: ["administrative_area_level_2", "political"],
            long_name: "Quận 1",
            short_name: "Quận 1"
        },
        {
            types: ["administrative_area_level_1", "political"],
            long_name: "Thành phố Hồ Chí Minh",
            short_name: "HCM"
        }
    ]
};

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
     * Lấy style map từ proxy server hoặc URL trực tiếp
     * @param styleType Loại style (streets, night, simple, streets-raster)
     * @param useProxy Sử dụng proxy server hay không
     * @returns URL của style map
     */
    getMapStyle: (styleType: string = 'streets', useProxy: boolean = true): string => {
        if (useProxy) {
            return `/trackasia/style?styleType=${styleType}`;
        } else {
            return `https://maps.track-asia.com/styles/v2/${styleType}.json?key=public_key`;
        }
    },

    /**
     * Tạo instance map TrackAsia
     * @param containerId ID của element chứa bản đồ
     * @param options Tùy chọn cấu hình map
     * @returns Instance của TrackAsia map
     */
    createMap: (containerId: string, options: {
        center?: { lat: number, lng: number },
        zoom?: number,
        styleType?: string
    } = {}): any => {
        // Kiểm tra xem thư viện đã được tải chưa
        if (!window.trackasiagl && !window.trackasia) {
            console.error('TrackAsia library not found');
            console.log('window.trackasiagl:', typeof window.trackasiagl);
            console.log('window.trackasia:', typeof window.trackasia);
            return null;
        }

        // Ưu tiên sử dụng trackasiagl từ NPM
        const mapLib = window.trackasiagl || window.trackasia;
        console.log('Using TrackAsia library:', window.trackasiagl ? 'NPM version' : 'CDN version');

        const defaultCenter = { lat: 10.769034, lng: 106.694945 }; // TPHCM
        const center = options.center || defaultCenter;
        const zoom = options.zoom || 9;
        const styleType = options.styleType || 'streets';

        try {
            return new mapLib.Map({
                container: containerId,
                style: `/trackasia/style?styleType=${styleType}`,
                center: [center.lng, center.lat], // TrackAsia expects [lng, lat]
                zoom: zoom
            });
        } catch (error) {
            console.error('Error creating TrackAsia map:', error);
            return null;
        }
    },

    /**
     * Tìm kiếm địa điểm với TrackAsia API
     * @param query Từ khóa tìm kiếm
     * @param size Số lượng kết quả tối đa
     * @param bounds Giới hạn khu vực tìm kiếm (southwest_lng,southwest_lat,northeast_lng,northeast_lat)
     * @param location Vị trí hiện tại để tìm kiếm gần đó [lng, lat]
     * @returns Danh sách kết quả tìm kiếm
     */
    autocomplete: async (
        input: string,
        size: number = 10,
        bounds?: string,
        location?: string
    ): Promise<AutocompleteResult[]> => {
        console.log('trackasiaService.autocomplete called with:', { input, size, bounds, location });

        try {
            // Hủy request cũ nếu đang có request đang chạy
            if (currentSearchController) {
                console.log('Aborting previous autocomplete request');
                currentSearchController.abort();
            }

            // Tạo controller mới cho request này
            currentSearchController = new AbortController();

            console.log('Sending request to /trackasia/autocomplete with input:', input);
            const response = await httpClient.get<AutocompleteResponse>('/trackasia/autocomplete', {
                params: {
                    input,
                    size,
                    bounds,
                    location
                },
                signal: currentSearchController.signal
            });

            console.log('Autocomplete API response:', response);

            // Xóa controller sau khi request hoàn thành
            currentSearchController = null;

            if (response.data && response.data.status === 'OK') {
                console.log('Autocomplete results found:', response.data.predictions);
                return response.data.predictions || [];
            }

            console.warn('No valid autocomplete results found in response, using mock data');
            return mockAutocompleteResults.filter(item =>
                item.description.toLowerCase().includes(input.toLowerCase()) ||
                item.name.toLowerCase().includes(input.toLowerCase())
            );
        } catch (error: any) {
            // Nếu lỗi không phải do hủy request
            if (error.name !== 'AbortError') {
                console.error('Error autocompleting places:', error);
                if (error.response) {
                    console.error('Error response data:', error.response.data);
                    console.error('Error response status:', error.response.status);
                }
            }
            console.warn('Error in autocomplete, using mock data');
            return mockAutocompleteResults.filter(item =>
                item.description.toLowerCase().includes(input.toLowerCase()) ||
                item.name.toLowerCase().includes(input.toLowerCase())
            );
        } finally {
            // Đảm bảo controller được reset
            currentSearchController = null;
        }
    },

    /**
     * Lấy chi tiết địa điểm từ place_id
     * @param placeId ID của địa điểm
     * @returns Chi tiết địa điểm
     */
    getPlaceDetail: async (place_id: string): Promise<PlaceDetailResult | null> => {
        console.log('trackasiaService.getPlaceDetail called with place_id:', place_id);

        // Nếu là mock place ID, trả về mock data
        if (place_id.startsWith('mock_place_')) {
            console.log('Using mock place detail for place_id:', place_id);
            return {
                ...mockPlaceDetail,
                place_id: place_id
            };
        }

        // Thử với cả hai endpoint để xem cái nào hoạt động
        const endpoints = [
            '/trackasia/place/details'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`Trying endpoint ${endpoint} with place_id:`, place_id);
                const response = await httpClient.get<PlaceDetailResponse>(endpoint, {
                    params: {
                        place_id
                    }
                });

                console.log(`Response from ${endpoint}:`, response);

                if (response.data && response.data.status === 'OK') {
                    console.log('Place detail found:', response.data.result);
                    return response.data.result;
                }
            } catch (error: any) {
                console.error(`Error with endpoint ${endpoint}:`, error);
                if (error.response) {
                    console.error('Error response data:', error.response.data);
                    console.error('Error response status:', error.response.status);
                }
            }
        }

        // Nếu tất cả các endpoint đều thất bại, trả về mock data
        console.warn('All endpoints failed to get place detail, using mock data');
        return {
            ...mockPlaceDetail,
            place_id: place_id,
            name: `Địa điểm ${place_id}`,
            formatted_address: `Địa điểm ${place_id}, Thành phố Hồ Chí Minh, Việt Nam`
        };
    },

    /**
     * Tìm kiếm địa điểm từ tọa độ (reverse geocoding)
     * @param latlng Vĩ độ và kinh độ theo định dạng "lat,lng"
     * @param radius Bán kính tìm kiếm (mét)
     * @returns Thông tin địa điểm
     */
    reverseGeocode: async (latlng: string, radius?: number): Promise<ReverseGeocodingResponse | null> => {
        try {
            const response = await httpClient.get<ReverseGeocodingResponse>('/trackasia/geocode/reverse', {
                params: {
                    latlng,
                    radius
                }
            });

            if (response.data && response.data.status === 'OK' && response.data.results.length > 0) {
                return response.data;
            }

            return null;
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            return null;
        }
    },

    /**
     * Chuyển đổi từ kết quả reverseGeocode sang MapLocation
     * @param result Kết quả từ reverseGeocode
     * @returns MapLocation object
     */
    convertToMapLocation: (result: ReverseGeocodingResult, lat: number, lng: number): MapLocation => {
        return {
            lat,
            lng,
            address: result.formatted_address,
            placeId: result.name // Sử dụng name thay vì place_id nếu không có
        };
    },

    /**
     * Tìm đường đi giữa hai điểm
     * @param origin Điểm xuất phát (lat,lng)
     * @param destination Điểm đến (lat,lng)
     * @param mode Phương tiện di chuyển (driving, walking, bicycling, transit)
     * @returns Phản hồi từ API directions
     */
    getDirections: async (
        origin: string,
        destination: string,
        mode: string = 'driving'
    ): Promise<DirectionsResponse | null> => {
        try {
            const response = await httpClient.get<DirectionsResponse>('/trackasia/directions', {
                params: {
                    origin,
                    destination,
                    mode
                }
            });

            if (response.data && response.data.status === 'OK') {
                return response.data;
            }

            return null;
        } catch (error) {
            console.error('Error getting directions:', error);
            throw error;
        }
    }
};

// Thêm định nghĩa kiểu cho window object để sử dụng TrackAsia
declare global {
    interface Window {
        trackasia?: any;
        trackasiagl?: any;
    }
}

export default trackasiaService;