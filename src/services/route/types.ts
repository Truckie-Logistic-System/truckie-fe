import type { ApiResponse } from '../api/types';
import type { OrderRoutePointsResponse, SuggestRouteRequest, SuggestRouteResponse } from '../../models/RoutePoint';

export interface OrderRoutePointsApiResponse extends ApiResponse<OrderRoutePointsResponse> { }
export interface SuggestRouteApiResponse extends ApiResponse<SuggestRouteResponse> { } 