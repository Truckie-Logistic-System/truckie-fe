// Import specific types from User to avoid ambiguity
import type { User, UserCredentials, UserModel, RegisterEmployeeRequest, UserStatusUpdateRequest } from './User';
import { hasAccess, getRedirectPathByRole, mapUserResponseToModel } from './User';

// Import specific types from Issue to avoid Vehicle conflict
import type { Issue, IssueStatus, IssueType, IssueUser } from './Issue';
import { getIssueStatusColor, getIssueStatusLabel, getDriverFullName, getVehicleInfo } from './Issue';

// Import specific types from Address to avoid ambiguity
import type { Address, AddressCreateDto, AddressUpdateDto } from './Address';

// Import VehicleMaintenance types to avoid conflicts
import type {
    VehicleMaintenance as VMaintenance,
    VehicleMaintenanceDetail,
    CreateVehicleMaintenanceRequest,
    UpdateVehicleMaintenanceRequest,
    MaintenanceType as MaintenanceTypeVM
} from './VehicleMaintenance';

// Import MaintenanceType types to avoid conflicts
import type { MaintenanceTypeEntity, MaintenanceTypeRequest } from './MaintenanceType';

// Re-export specific types
export type { User, UserCredentials, UserModel, RegisterEmployeeRequest, UserStatusUpdateRequest };
export { hasAccess, getRedirectPathByRole, mapUserResponseToModel };

export type { Issue, IssueStatus, IssueType, IssueUser };
export { getIssueStatusColor, getIssueStatusLabel, getDriverFullName, getVehicleInfo };

export type { Address, AddressCreateDto, AddressUpdateDto };

// Re-export VehicleMaintenance types with aliases to avoid conflicts
export type {
    VMaintenance as VehicleMaintenanceModel,
    VehicleMaintenanceDetail,
    CreateVehicleMaintenanceRequest,
    UpdateVehicleMaintenanceRequest,
    MaintenanceTypeVM as MaintenanceType
};

// Re-export MaintenanceType types
export type { MaintenanceTypeEntity, MaintenanceTypeRequest };

// Export all enums
export * from '../constants/enums';

// Export other modules normally
export * from './Category';
export * from './OrderSize';
export * from './Order';
export * from './Route';
export * from './Penalty';
export * from './Map';
export * from './Chat';
export * from './Driver';
export * from './Customer';
export * from './Device';
export * from './Vehicle'; 