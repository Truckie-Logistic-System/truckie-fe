import type { VehicleRule } from '../../models';
import type { ApiResponse } from '../api/types';

export type GetVehicleRulesResponse = ApiResponse<VehicleRule[]>;
export type GetVehicleRuleResponse = ApiResponse<VehicleRule>;
export type CreateVehicleRuleResponse = ApiResponse<VehicleRule>;
export type UpdateVehicleRuleResponse = ApiResponse<VehicleRule>; 