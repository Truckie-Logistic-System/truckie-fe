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

// Hàm kiểm tra xem cache có hết hạn chưa (1 tuần)
const isCacheExpired = (timestamp: number): boolean => {
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // 1 tuần tính bằng milliseconds
    return Date.now() - timestamp > oneWeekInMs;
};

// Hàm lưu style vào sessionStorage
const cacheMapStyle = (styleType: string, styleData: any): void => {
    try {
        const cacheItem = {
            timestamp: Date.now(),
            data: styleData
        };
        sessionStorage.setItem(`trackasia_style_${styleType}`, JSON.stringify(cacheItem));
        console.log(`Cached map style "${styleType}" to sessionStorage`);
    } catch (error) {
        console.error('Error caching map style:', error);
    }
};

// Hàm lấy style từ sessionStorage
const getCachedMapStyle = (styleType: string): any | null => {
    try {
        const cachedItem = sessionStorage.getItem(`trackasia_style_${styleType}`);
        if (!cachedItem) return null;

        const { timestamp, data } = JSON.parse(cachedItem);

        // Kiểm tra xem cache có hết hạn chưa
        if (isCacheExpired(timestamp)) {
            console.log(`Cached map style "${styleType}" has expired`);
            sessionStorage.removeItem(`trackasia_style_${styleType}`);
            return null;
        }

        console.log(`Using cached map style "${styleType}" from sessionStorage`);
        return data;
    } catch (error) {
        console.error('Error retrieving cached map style:', error);
        return null;
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
            // Kiểm tra xem có style đã cache chưa
            const cachedStyle = getCachedMapStyle(styleType);

            const map = new mapLib.Map({
                container: containerId,
                style: cachedStyle || `/trackasia/style?styleType=${styleType}`,
                center: [center.lng, center.lat], // TrackAsia expects [lng, lat]
                zoom: zoom
            });

            // Nếu không có cache, fetch style và cache lại
            if (!cachedStyle) {
                fetch(`/trackasia/style?styleType=${styleType}`)
                    .then(response => response.json())
                    .then(styleData => {
                        cacheMapStyle(styleType, styleData);
                    })
                    .catch(error => {
                        console.error('Error fetching map style for caching:', error);
                    });
            }

            return map;
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

            console.warn('No valid autocomplete results found in response');
            return [];
        } catch (error: any) {
            // Nếu lỗi không phải do hủy request
            if (error.name !== 'AbortError') {
                console.error('Error autocompleting places:', error);
                if (error.response) {
                    console.error('Error response data:', error.response.data);
                    console.error('Error response status:', error.response.status);
                }
            }
            console.warn('Error in autocomplete');
            return [];
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

        try {
            console.log(`Trying endpoint /trackasia/place/details with place_id:`, place_id);
            const response = await httpClient.get<PlaceDetailResponse>('/trackasia/place/details', {
                params: {
                    place_id
                }
            });

            console.log(`Response from /trackasia/place/details:`, response);

            if (response.data && response.data.status === 'OK') {
                console.log('Place detail found:', response.data.result);
                return response.data.result;
            }

            console.warn('No valid place detail found in response');
            return null;
        } catch (error: any) {
            console.error(`Error with place details:`, error);
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
            }
            return null;
        }
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