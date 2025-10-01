import httpClient from '../api';
import type { OrderRoutePointsApiResponse, SuggestRouteApiResponse } from './types';
import type { SuggestRouteRequest } from '../../models/RoutePoint';

const BASE_URL = '/routes';

const routeService = {
    /**
     * Get route points for an order
     * @param orderId Order ID
     * @returns Route points including carrier, pickup, and delivery locations
     */
    getOrderPoints: async (orderId: string): Promise<OrderRoutePointsApiResponse> => {
        try {
            const response = await httpClient.get<OrderRoutePointsApiResponse>(`${BASE_URL}/orders/${orderId}/points`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Suggest route based on points
     * @param data Request data containing points, point types, and vehicle type ID
     * @returns Suggested route with segments and toll information
     */
    suggestRoute: async (data: SuggestRouteRequest): Promise<SuggestRouteApiResponse> => {
        try {
            const response = await httpClient.post<SuggestRouteApiResponse>(`${BASE_URL}/suggest`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default routeService; 