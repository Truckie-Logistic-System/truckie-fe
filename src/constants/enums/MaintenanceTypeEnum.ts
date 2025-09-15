export enum MaintenanceTypeEnum {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}

export const MaintenanceTypeColors = {
    [MaintenanceTypeEnum.ACTIVE]: 'bg-green-500 text-white',
    [MaintenanceTypeEnum.INACTIVE]: 'bg-gray-500 text-white'
};

export const MaintenanceTypeLabels = {
    [MaintenanceTypeEnum.ACTIVE]: 'Hoạt động',
    [MaintenanceTypeEnum.INACTIVE]: 'Không hoạt động'
}; 