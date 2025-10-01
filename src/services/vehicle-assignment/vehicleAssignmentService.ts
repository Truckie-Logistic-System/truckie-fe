import httpClient from "../api";
import type {
    VehicleAssignmentResponse,
    VehicleAssignmentDetailResponse,
    CreateVehicleAssignmentRequest,
    UpdateVehicleAssignmentRequest,
    VehicleAssignmentSuggestionResponse,
    CreateVehicleAssignmentForDetailsRequest,
    CreateVehicleAssignmentForDetailsResponse,
    GroupedVehicleAssignmentSuggestionData,
    CreateGroupedVehicleAssignmentsRequest
} from "./types";
import type { ApiResponse } from "../api/types";
import type { JourneyHistoryRequest } from "../../models/RoutePoint";

const BASE_URL = "/vehicle-assignments";

export const vehicleAssignmentService = {
    getAll: async (): Promise<VehicleAssignmentResponse> => {
        try {
            const response = await httpClient.get<VehicleAssignmentResponse>(BASE_URL);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getById: async (id: string): Promise<VehicleAssignmentDetailResponse> => {
        try {
            const response = await httpClient.get<VehicleAssignmentDetailResponse>(`${BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    create: async (data: CreateVehicleAssignmentRequest): Promise<VehicleAssignmentDetailResponse> => {
        try {
            const response = await httpClient.post<VehicleAssignmentDetailResponse>(BASE_URL, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    update: async (id: string, data: UpdateVehicleAssignmentRequest): Promise<VehicleAssignmentDetailResponse> => {
        try {
            const response = await httpClient.put<VehicleAssignmentDetailResponse>(`${BASE_URL}/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    delete: async (id: string): Promise<VehicleAssignmentDetailResponse> => {
        try {
            const response = await httpClient.delete<VehicleAssignmentDetailResponse>(`${BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getSuggestionsForOrderDetails: async (orderId: string): Promise<VehicleAssignmentSuggestionResponse> => {
        try {
            const apiUrl = `${BASE_URL}/${orderId}/suggest-drivers-and-vehicle-for-details`;
            console.log(`Calling API: ${apiUrl}`);

            const response = await httpClient.get(apiUrl);
            console.log("Raw API response:", response);

            // Check if the response has the expected structure
            if (!response.data) {
                console.error("Empty response data");
                throw new Error("Empty response data");
            }

            // Handle different response structures
            if (response.data.data) {
                // Standard API response with data wrapper
                const responseData = response.data.data;

                // Check for different suggestion formats
                if (responseData.suggestionsByDetailId || responseData.suggestionsByTrackingCode) {
                    console.log("Found suggestions in standard format");
                    return response.data;
                } else {
                    console.error("Response data missing suggestions:", responseData);
                    throw new Error("Invalid response structure - missing suggestions");
                }
            } else if (response.data.suggestionsByDetailId || response.data.suggestionsByTrackingCode) {
                // Direct response without data wrapper
                console.log("Direct suggestions found, wrapping in data field");
                return {
                    success: true,
                    message: "Success",
                    statusCode: 200,
                    data: response.data
                };
            } else {
                console.error("Invalid response structure:", response.data);
                throw new Error("Invalid response structure");
            }
        } catch (error) {
            console.error("Error fetching vehicle assignment suggestions:", error);
            throw error;
        }
    },

    createAssignmentForDetails: async (data: CreateVehicleAssignmentForDetailsRequest): Promise<CreateVehicleAssignmentForDetailsResponse> => {
        try {
            const response = await httpClient.post<CreateVehicleAssignmentForDetailsResponse>(`${BASE_URL}/create-for-details`, data);
            return response.data;
        } catch (error) {
            console.error("Error creating vehicle assignment for details:", error);
            throw error;
        }
    },

    getSuggestionsForGroupedDetails: async (): Promise<GroupedVehicleAssignmentSuggestionData> => {
        try {
            const response = await httpClient.get<ApiResponse<GroupedVehicleAssignmentSuggestionData>>(`${BASE_URL}/suggest-grouped`);
            return response.data.data;
        } catch (error) {
            console.error("Error fetching grouped vehicle assignment suggestions:", error);
            throw error;
        }
    },

    createGroupedAssignments: async (data: CreateGroupedVehicleAssignmentsRequest): Promise<ApiResponse<any>> => {
        try {
            const response = await httpClient.post<ApiResponse<any>>(`${BASE_URL}/create-grouped`, data);
            return response.data;
        } catch (error) {
            console.error("Error creating grouped vehicle assignments:", error);
            throw error;
        }
    },

    createJourneyHistory: async (data: JourneyHistoryRequest): Promise<ApiResponse<any>> => {
        try {
            const response = await httpClient.post<ApiResponse<any>>(`${BASE_URL}/journey-history`, data);
            return response.data;
        } catch (error) {
            console.error("Error creating journey history:", error);
            throw error;
        }
    }
}; 