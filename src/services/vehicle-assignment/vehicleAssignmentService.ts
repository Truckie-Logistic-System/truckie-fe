import httpClient from "../api";
import type {
    VehicleAssignmentResponse,
    VehicleAssignmentDetailResponse,
    CreateVehicleAssignmentRequest,
    UpdateVehicleAssignmentRequest,
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
}; 