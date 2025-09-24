import type {
    VehicleAssignment,
    VehicleAssignmentSuggestionData,
    CreateVehicleAssignmentRequest,
    UpdateVehicleAssignmentRequest,
    CreateVehicleAssignmentForDetailsRequest,
    GroupedVehicleAssignmentSuggestionData,
    CreateGroupedVehicleAssignmentsRequest
} from "../../models/VehicleAssignment";
import type { ApiResponse } from "../api/types";

export interface VehicleAssignmentResponse extends ApiResponse<VehicleAssignment[]> { }

export interface VehicleAssignmentDetailResponse extends ApiResponse<VehicleAssignment> { }

export interface CreateVehicleAssignmentResponse extends ApiResponse<VehicleAssignment> { }

export interface UpdateVehicleAssignmentResponse extends ApiResponse<VehicleAssignment> { }

export interface DeleteVehicleAssignmentResponse extends ApiResponse<void> { }

export interface VehicleAssignmentSuggestionResponse extends ApiResponse<VehicleAssignmentSuggestionData> { }

export interface CreateVehicleAssignmentForDetailsResponse extends ApiResponse<any> { }

export type {
    VehicleAssignment,
    CreateVehicleAssignmentRequest,
    UpdateVehicleAssignmentRequest,
    VehicleAssignmentSuggestionData,
    CreateVehicleAssignmentForDetailsRequest,
    GroupedVehicleAssignmentSuggestionData,
    CreateGroupedVehicleAssignmentsRequest
}; 