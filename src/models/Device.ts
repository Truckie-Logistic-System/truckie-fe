import type { Vehicle } from './Vehicle';

export interface DeviceType {
    id: string;
    deviceTypeName: string;
    vehicleCapacity: number;
    description: string;
    isActive: boolean;
}

export interface Device {
    id: string;
    deviceCode: string;
    manufacturer: string;
    model: string;
    status: string;
    installedAt: string;
    ipAddress: string;
    firmwareVersion: string;
    deviceTypeEntity?: DeviceType;
    deviceTypeId?: string;
    vehicleEntity?: Vehicle;
    vehicleId?: string;
}

export interface CreateDeviceRequest {
    deviceCode: string;
    manufacturer: string;
    model: string;
    installedAt: string;
    ipAddress: string;
    firmwareVersion: string;
    deviceTypeId: string;
    vehicleId: string;
}

export interface UpdateDeviceRequest {
    deviceCode: string;
    manufacturer: string;
    model: string;
    status: string;
    ipAddress: string;
    firmwareVersion: string;
    installedAt: string;
    deviceTypeId: string;
    vehicleId: string;
}

export interface CreateDeviceTypeRequest {
    deviceTypeName: string;
    vehicleCapacity: number;
    description: string;
}

export interface UpdateDeviceTypeRequest {
    deviceTypeName: string;
    description: string;
    isActive: boolean;
    vehicleCapacity: number;
} 