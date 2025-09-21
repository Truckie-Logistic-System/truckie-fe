import type { MaintenanceTypeEntity, MaintenanceTypeRequest } from '../../models';
import type { ApiResponse } from '../api/types';

export interface GetMaintenanceTypesResponse extends Omit<ApiResponse<MaintenanceTypeEntity[]>, 'data'> {
    data: MaintenanceTypeEntity[];
}
export interface GetMaintenanceTypeResponse extends Omit<ApiResponse<MaintenanceTypeEntity>, 'data'> {
    data: MaintenanceTypeEntity | null;
}
export type CreateMaintenanceTypeRequest = MaintenanceTypeRequest;
export type UpdateMaintenanceTypeRequest = MaintenanceTypeRequest; 