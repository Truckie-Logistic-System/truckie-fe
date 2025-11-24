export enum VehicleAssignmentStatusEnum {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    COMPLETED = 'COMPLETED'
}

export const VehicleAssignmentStatusColors = {
    [VehicleAssignmentStatusEnum.ACTIVE]: 'bg-blue-500 text-white',
    [VehicleAssignmentStatusEnum.INACTIVE]: 'bg-gray-400 text-white',
    [VehicleAssignmentStatusEnum.COMPLETED]: 'bg-green-600 text-white'
};

export const VehicleAssignmentStatusLabels = {
    [VehicleAssignmentStatusEnum.ACTIVE]: 'Đang hoạt động',
    [VehicleAssignmentStatusEnum.INACTIVE]: 'Không hoạt động',
    [VehicleAssignmentStatusEnum.COMPLETED]: 'Hoàn thành'
};