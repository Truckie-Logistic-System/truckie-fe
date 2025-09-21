export interface MaintenanceTypeEntity {
    id: string;
    maintenanceTypeName: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    modifiedAt: string;
}

export interface MaintenanceTypeRequest {
    maintenanceTypeName: string;
    description: string;
    isActive: boolean;
} 