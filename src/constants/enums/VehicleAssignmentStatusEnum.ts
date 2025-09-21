export enum VehicleAssignmentStatusEnum {
    ASSIGNED = 'ASSIGNED',
    AVAILABLE = 'AVAILABLE',
    IN_TRIP = 'IN_TRIP',
    COMPLETED = 'COMPLETED'
}

export const VehicleAssignmentStatusColors = {
    [VehicleAssignmentStatusEnum.ASSIGNED]: 'bg-blue-500 text-white',
    [VehicleAssignmentStatusEnum.AVAILABLE]: 'bg-green-500 text-white',
    [VehicleAssignmentStatusEnum.IN_TRIP]: 'bg-yellow-500 text-white',
    [VehicleAssignmentStatusEnum.COMPLETED]: 'bg-gray-500 text-white'
};

export const VehicleAssignmentStatusLabels = {
    [VehicleAssignmentStatusEnum.ASSIGNED]: 'Đã phân công',
    [VehicleAssignmentStatusEnum.AVAILABLE]: 'Khả dụng',
    [VehicleAssignmentStatusEnum.IN_TRIP]: 'Đang trong chuyến',
    [VehicleAssignmentStatusEnum.COMPLETED]: 'Hoàn thành'
}; 