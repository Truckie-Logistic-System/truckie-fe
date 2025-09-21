import type { Vehicle } from './Vehicle';

export interface MaintenanceType {
    id: string;
    name: string;
    description?: string;
}

export interface VehicleMaintenance {
    id: string;
    maintenanceDate: string;
    description: string;
    cost: number;
    nextMaintenanceDate?: string;
    odometerReading?: number;
    serviceCenter: string;
    vehicleId: string;
    maintenanceTypeId: string;
    vehicle?: Vehicle;
    maintenanceType?: MaintenanceType;
}

export interface VehicleMaintenanceDetail {
    id: string;
    maintenanceDate: string;
    description: string;
    cost: number;
    nextMaintenanceDate?: string;
    odometerReading?: number;
    serviceCenter: string;
    vehicleEntity: {
        id: string;
        licensePlateNumber: string;
        model: string;
        manufacturer: string;
        year: number;
        capacity: number;
        status: string;
        vehicleTypeId: string;
    };
    maintenanceTypeEntity: {
        id: string;
        maintenanceTypeName: string;
        description: string;
        isActive: boolean;
        createdAt: string;
        modifiedAt: string;
    };
}

export interface CreateVehicleMaintenanceRequest {
    maintenanceDate: string;
    description: string;
    cost: number;
    nextMaintenanceDate?: string;
    odometerReading?: number;
    serviceCenter: string;
    vehicleId: string;
    maintenanceTypeId: string;
}

export interface UpdateVehicleMaintenanceRequest {
    maintenanceDate: string;
    description: string;
    cost: number;
    nextMaintenanceDate?: string;
    odometerReading?: number;
    serviceCenter: string;
    vehicleId: string;
    maintenanceTypeId: string;
} 