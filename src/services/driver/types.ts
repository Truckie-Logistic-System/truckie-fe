import type { ApiResponse, PaginatedResponse } from '../api/types';
import type { DriverModel, DriverRegisterRequest } from '../../models/Driver';

export type { DriverModel, DriverRegisterRequest };
export type DriverResponse = ApiResponse<DriverModel>;
export type DriversResponse = ApiResponse<DriverModel[]>;
export type PaginatedDriversResponse = ApiResponse<PaginatedResponse<DriverModel>>; 