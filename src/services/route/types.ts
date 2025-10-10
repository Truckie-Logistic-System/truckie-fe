import type { ApiResponse } from '../api/types';
import type { OrderRoutePointsResponse, SuggestRouteRequest, SuggestRouteResponse } from '../../models/RoutePoint';

// Cập nhật để phù hợp với API thực tế - API trả về trực tiếp response không có wrapper
export type OrderRoutePointsApiResponse = OrderRoutePointsResponse;
export type SuggestRouteApiResponse = SuggestRouteResponse; 