import type { Penalty } from './Penalty';
import type { VehicleServiceRecord } from './VehicleServiceRecord';

// Alias for backward compatibility
type VehicleMaintenance = VehicleServiceRecord;

export interface Vehicle {
    id: string;
    licensePlateNumber: string;
    model: string;
    manufacturer: string;
    year: number;
    status: string;
    vehicleTypeId: string;

    vehicleTypeDescription?: string;
    currentLatitude?: number;
    currentLongitude?: number;
    
    // Đăng kiểm (Inspection)
    lastInspectionDate?: string;
    inspectionExpiryDate?: string;
    
    // Bảo hiểm (Insurance)
    insuranceExpiryDate?: string;
    insurancePolicyNumber?: string;
    
    // Bảo trì (Maintenance)
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    
    // Cảnh báo (tính toán từ backend)
    isInspectionExpiringSoon?: boolean;
    isInsuranceExpiringSoon?: boolean;
    isMaintenanceDueSoon?: boolean;
    daysUntilInspectionExpiry?: number;
    daysUntilInsuranceExpiry?: number;
    daysUntilNextMaintenance?: number;
}

export interface VehicleType {
    id: string;
    vehicleTypeName: string;
    description: string;
    vehicleCount?: number;
    vehicleTypeDescription?: string;
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

export interface TopDriver {
    driverId: string;
    driverName: string;
    driverPhoneNumber: string;
    driverStatus: string;
    tripCount: number;
}

export interface VehicleDetail extends Vehicle {
    vehicleAssignmentResponse: VehicleAssignment[];
    vehicleMaintenanceResponse: VehicleMaintenance[];
    vehicleTypeResponse: VehicleType;
    topDrivers?: TopDriver[];
    penalties?: Penalty[];
}

export interface CreateVehicleRequest {
    licensePlateNumber: string;
    model: string;
    manufacturer: string;
    year: number;
    status: string;
    vehicleTypeId: string;
    currentLatitude?: number;
    currentLongitude?: number;
}

export interface UpdateVehicleRequest extends CreateVehicleRequest {
    // Không bao gồm id vì id đã có trong URL path
} 