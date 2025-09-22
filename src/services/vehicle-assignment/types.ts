import type { VehicleAssignment, CreateVehicleAssignmentRequest, UpdateVehicleAssignmentRequest, VehicleAssignmentSuggestion, CreateVehicleAssignmentForDetailsRequest } from "../../models/VehicleAssignment";
import type { ApiResponse } from "../api/types";

export interface VehicleAssignmentResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: VehicleAssignment[];
}

export interface VehicleAssignmentDetailResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: VehicleAssignment;
}

export type VehicleAssignmentSuggestionResponse = VehicleAssignmentSuggestion;

export interface CreateVehicleAssignmentForDetailsResponse {
    success: boolean;
    message: string;
    statusCode: number;
    data: any; // The response structure depends on the API
}

export type { VehicleAssignment, CreateVehicleAssignmentRequest, UpdateVehicleAssignmentRequest, VehicleAssignmentSuggestion, CreateVehicleAssignmentForDetailsRequest }; 