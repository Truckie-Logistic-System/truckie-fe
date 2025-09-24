import type { Driver, Vehicle } from "./Issue";

export interface SuggestedDriver {
    id: string;
    fullName: string;
    driverLicenseNumber: string;
    licenseClass: string;
    isRecommended: boolean;
    violationCount: number;
    completedTripsCount: number;
    experienceYears: string;
    lastActiveTime: string;
}

export interface VehicleSuggestion {
    id: string;
    licensePlateNumber: string;
    model: string;
    manufacturer: string;
    suggestedDrivers: SuggestedDriver[];
    isRecommended: boolean;
}

export interface VehicleAssignmentSuggestionData {
    suggestionsByDetailId?: {
        [detailId: string]: VehicleSuggestion[];
    };
    suggestionsByTrackingCode?: {
        [trackingCode: string]: VehicleSuggestion[];
    };
}

export interface VehicleAssignmentSuggestion {
    success: boolean;
    message: string;
    statusCode: number;
    data: VehicleAssignmentSuggestionData;
}

export interface VehicleAssignmentForDetail {
    vehicleId: string;
    driverId_1: string;
    driverId_2: string;
    description?: string;
}

export interface CreateVehicleAssignmentForDetailsRequest {
    assignments: {
        [detailId: string]: VehicleAssignmentForDetail;
    };
}

export interface VehicleAssignment {
    id: string;
    vehicleId: string;
    driver_id_1: string;
    driver_id_2?: string;
    description?: string;
    status: string;
    vehicle?: Vehicle;
    driver1?: Driver;
    driver2?: Driver;
    createdAt?: string;
    modifiedAt?: string;
}

export interface CreateVehicleAssignmentRequest {
    vehicleId: string;
    driverId_1: string;
    driverId_2?: string;
    description?: string;
}

export interface UpdateVehicleAssignmentRequest {
    vehicleId?: string;
    driverId_1?: string;
    driverId_2?: string;
    description?: string;
    status?: string;
}

export interface OrderDetailInfo {
    id: string;
    trackingCode: string;
    originAddress: string;
    destinationAddress: string;
    totalWeight: number;
    totalVolume: number;
}

export interface OrderDetailGroup {
    orderDetails: OrderDetailInfo[];
    suggestedVehicles: VehicleSuggestion[];
    groupingReason: string;
}

export interface GroupedVehicleAssignmentSuggestionData {
    groups: OrderDetailGroup[];
}

export interface GroupAssignment {
    orderDetailIds: string[];
    vehicleId: string;
    driverId_1: string;
    driverId_2: string;
    description?: string;
}

export interface CreateGroupedVehicleAssignmentsRequest {
    groupAssignments: GroupAssignment[];
} 