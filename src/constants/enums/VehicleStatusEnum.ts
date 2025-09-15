export enum VehicleStatusEnum {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    IN_TRANSIT = 'IN_TRANSIT',
    BREAKDOWN = 'BREAKDOWN',
    ACCIDENT = 'ACCIDENT'
}

export const VehicleStatusColors = {
    [VehicleStatusEnum.ACTIVE]: 'bg-green-500 text-white',
    [VehicleStatusEnum.INACTIVE]: 'bg-gray-500 text-white',
    [VehicleStatusEnum.MAINTENANCE]: 'bg-blue-500 text-white',
    [VehicleStatusEnum.IN_TRANSIT]: 'bg-yellow-500 text-white',
    [VehicleStatusEnum.BREAKDOWN]: 'bg-orange-500 text-white',
    [VehicleStatusEnum.ACCIDENT]: 'bg-red-500 text-white'
};

export const VehicleStatusLabels = {
    [VehicleStatusEnum.ACTIVE]: 'Hoạt động',
    [VehicleStatusEnum.INACTIVE]: 'Không hoạt động',
    [VehicleStatusEnum.MAINTENANCE]: 'Bảo trì',
    [VehicleStatusEnum.IN_TRANSIT]: 'Đang di chuyển',
    [VehicleStatusEnum.BREAKDOWN]: 'Hỏng hóc',
    [VehicleStatusEnum.ACCIDENT]: 'Tai nạn'
}; 