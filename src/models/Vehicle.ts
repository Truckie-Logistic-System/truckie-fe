export interface Vehicle {
    id: string;
    licensePlateNumber: string;
    model: string;
    manufacturer: string;
    year: number;
    capacity: number;
    status: string;
    vehicleTypeId: string;
    currentLatitude?: number;
    currentLongitude?: number;
}

export interface VehicleType {
    id: string;
    vehicleTypeName: string;
    description: string;
    vehicleCount?: number;
}

export interface VehicleAssignment {
    id: string;
    vehicleId: string;
    driver_id_1: string;
    driver_id_2?: string;
    description?: string;
    status: string;
}

export interface CreateVehicleAssignmentRequest {
    vehicleId: string;
    driverId_1: string;
    driverId_2?: string;
    description?: string;
    status: string;
}

export interface UpdateVehicleAssignmentRequest {
    vehicleId?: string;
    driverId_1?: string;
    driverId_2?: string;
    description?: string;
    status?: string;
}

export enum VehicleAssignmentStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    COMPLETED = "COMPLETED"
}

// VehicleMaintenance đã được di chuyển sang file VehicleMaintenance.ts
// Giữ lại reference type ở đây để tránh phá vỡ code hiện tại
export interface VehicleMaintenance {
    id: string;
    maintenanceDate: string;
    description: string;
    cost: number;
    nextMaintenanceDate: string;
    odometerReading: number;
    serviceCenter: string;
    vehicleId: string;
    maintenanceTypeId: string;
}

export interface VehicleDetail extends Vehicle {
    vehicleAssignmentResponse: VehicleAssignment[];
    vehicleMaintenanceResponse: VehicleMaintenance[];
    vehicleTypeResponse: VehicleType;
}

export interface CreateVehicleRequest {
    licensePlateNumber: string;
    model: string;
    manufacturer: string;
    year: number;
    capacity: number;
    status: string;
    vehicleTypeId: string;
    currentLatitude?: number;
    currentLongitude?: number;
}

export interface UpdateVehicleRequest extends CreateVehicleRequest {
    // Không bao gồm id vì id đã có trong URL path
} 