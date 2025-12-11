import type { Vehicle, VehicleMaintenance, CreateVehicleMaintenanceRequest, UpdateVehicleMaintenanceRequest } from '../../models';
import type { ApiResponse } from '../api/types';

export type GetVehiclesResponse = ApiResponse<Vehicle[]>;
export type GetVehicleResponse = ApiResponse<Vehicle>;
export type CreateVehicleResponse = ApiResponse<Vehicle>;
export type UpdateVehicleResponse = ApiResponse<Vehicle>;

export type GetVehicleMaintenancesResponse = ApiResponse<VehicleMaintenance[]>;
export type GetVehicleMaintenanceResponse = ApiResponse<VehicleMaintenance>;
export type GetVehicleMaintenanceDetailResponse = ApiResponse<VehicleMaintenance>;
export type CreateVehicleMaintenanceResponse = ApiResponse<VehicleMaintenance>;
export type UpdateVehicleMaintenanceResponse = ApiResponse<VehicleMaintenance>;

export interface CreateVehicleTypeRequest {
  vehicleTypeName: string;
  description: string;
}

export interface UpdateVehicleTypeRequest {
  vehicleTypeName?: string;
  description?: string;
}