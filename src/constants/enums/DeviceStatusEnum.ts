export enum DeviceStatusEnum {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    BROKEN = 'BROKEN'
}

export const DeviceStatusColors = {
    [DeviceStatusEnum.ACTIVE]: 'bg-green-500 text-white',
    [DeviceStatusEnum.INACTIVE]: 'bg-gray-500 text-white',
    [DeviceStatusEnum.MAINTENANCE]: 'bg-blue-500 text-white',
    [DeviceStatusEnum.BROKEN]: 'bg-red-500 text-white'
};

export const DeviceStatusLabels = {
    [DeviceStatusEnum.ACTIVE]: 'Hoạt động',
    [DeviceStatusEnum.INACTIVE]: 'Không hoạt động',
    [DeviceStatusEnum.MAINTENANCE]: 'Đang bảo trì',
    [DeviceStatusEnum.BROKEN]: 'Hỏng'
}; 