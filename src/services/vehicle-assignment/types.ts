import type { VehicleAssignment, CreateVehicleAssignmentRequest, UpdateVehicleAssignmentRequest } from "../../models";

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

export type { VehicleAssignment, CreateVehicleAssignmentRequest, UpdateVehicleAssignmentRequest }; 