import { VIET_MAPS_API_KEY } from '../../config/env';
import httpClient from '../api/httpClient';
import type { MapLocation, MapStyle } from '@/models/Map';
import type { RouteResponse } from '@/models/Route';
import type {
    VietMapAutocompleteResult,
    VietMapPlaceDetail,
    VietMapRouteResponse,
    VietMapTollItem,
    VietMapRouteTollsRequest,
    VietMapStyle
} from '@/models/VietMap';

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
    ): Promise<VietMapAutocompleteResult[]> => {
        try {
            // Hủy request cũ nếu đang có request đang chạy
            if (currentSearchController) {
                currentSearchController.abort();
            }

            // Tạo controller mới cho request này
            currentSearchController = new AbortController();

            const response = await httpClient.get<VietMapAutocompleteResult[]>('/vietmap/autocomplete', {
                params: { text, focus },
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
    getPlaceDetail: async (refId: string): Promise<VietMapPlaceDetail | null> => {
        try {
            const response = await httpClient.get<VietMapPlaceDetail>('/vietmap/place', {
                params: { refid: refId }
            });
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
     * @param vehicle Loại phương tiện (car, bike, foot, motorcycle)
     * @returns Thông tin về tuyến đường
     */
    getRoute: async (
        origin: [number, number],
        destination: [number, number],
        vehicle: 'car' | 'bike' | 'foot' | 'motorcycle' = 'car'
    ): Promise<VietMapRouteResponse | null> => {
        try {
            const point = [
                `${origin[1]},${origin[0]}`,
                `${destination[1]},${destination[0]}`
            ];

            const response = await httpClient.get<VietMapRouteResponse>('/vietmap/route', {
                params: { point, vehicle }
            });

            return response.data;
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
    reverseGeocode: async (lat: number, lng: number): Promise<VietMapAutocompleteResult[] | null> => {
        try {
            const response = await httpClient.get<VietMapAutocompleteResult[]>('/vietmap/reverse', {
                params: { lat, lng }
            });

            return response.data;
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            return null;
        }
    },

    /**
     * Tính phí đường bộ cho một tuyến đường
     * @param path Mảng các điểm [lng, lat] tạo thành tuyến đường
     * @returns Thông tin về phí đường bộ
     */
    getRouteTolls: async (path: [number, number][]): Promise<VietMapTollItem[] | null> => {
        try {
            const payload: VietMapRouteTollsRequest = { path };
            const response = await httpClient.post<{ tolls: VietMapTollItem[] }>('/vietmap/route-tolls', payload);

            return response.data.tolls || [];
        } catch (error) {
            console.error('Error getting route tolls:', error);
            return null;
        }
    },

    /**
     * Lấy style cho bản đồ
     * @returns Style cho bản đồ
     */
    getMapStyles: async (): Promise<VietMapStyle | null> => {
        try {
            const response = await httpClient.get<VietMapStyle>('/vietmap/styles');
            return response.data;
        } catch (error) {
            console.error('Error getting map styles:', error);
            return null;
        }
    },

    /**
     * Chuyển đổi kết quả tuyến đường từ VietMap sang định dạng RouteResponse
     * @param vietMapRoute Kết quả tuyến đường từ VietMap
     * @returns Tuyến đường ở định dạng RouteResponse
     */
    convertToRouteResponse: (vietMapRoute: VietMapRouteResponse): RouteResponse | null => {
        if (vietMapRoute.paths && vietMapRoute.paths.length > 0) {
            const path = vietMapRoute.paths[0];

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
    },

    /**
     * Chuyển đổi kết quả reverse geocoding từ VietMap sang định dạng MapLocation
     * @param reverseResult Kết quả reverse geocoding từ VietMap
     * @returns Vị trí ở định dạng MapLocation
     */
    convertToMapLocation: (reverseResult: VietMapAutocompleteResult | VietMapPlaceDetail): MapLocation => {
        // Kiểm tra nếu là PlaceDetail (có lat và lng trực tiếp)
        if ('lat' in reverseResult && 'lng' in reverseResult &&
            typeof reverseResult.lat === 'number' &&
            typeof reverseResult.lng === 'number') {
            return {
                lat: reverseResult.lat,
                lng: reverseResult.lng,
                address: reverseResult.display || reverseResult.address,
                name: reverseResult.name
            };
        }

        // Nếu không, xử lý như AutocompleteResult với lat/lng có thể undefined
        return {
            lat: reverseResult.lat || 0,
            lng: reverseResult.lng || 0,
            address: reverseResult.display || reverseResult.address,
            name: reverseResult.name
        };
    }
};

export default vietmapService; 