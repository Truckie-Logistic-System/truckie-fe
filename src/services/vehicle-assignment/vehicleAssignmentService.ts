import httpClient from "../api";
import type {
    VehicleAssignmentResponse,
    VehicleAssignmentDetailResponse,
    CreateVehicleAssignmentRequest,
    UpdateVehicleAssignmentRequest,
    VehicleAssignmentSuggestionResponse,
    CreateVehicleAssignmentForDetailsRequest,
    CreateVehicleAssignmentForDetailsResponse
} from "./types";

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
            console.error("Error in getSuggestionsForOrderDetails:", error);
            throw error;
        }
    },

    createAndAssignForDetails: async (data: CreateVehicleAssignmentForDetailsRequest): Promise<CreateVehicleAssignmentForDetailsResponse> => {
        try {
            console.log("Sending assignment request:", data);

            // Ensure the request has the correct structure
            if (!data.assignments || typeof data.assignments !== 'object') {
                throw new Error("Invalid request format: assignments must be an object");
            }

            const response = await httpClient.put<CreateVehicleAssignmentForDetailsResponse>(
                `/order-details/create-and-assign-assignment-for-details`,
                data
            );
            console.log("Assignment response:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error in createAndAssignForDetails:", error);
            throw error;
        }
    }
}; 