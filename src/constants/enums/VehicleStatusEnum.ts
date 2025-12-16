export enum VehicleStatusEnum {
    // Trạng thái hoạt động
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    IN_TRANSIT = 'IN_TRANSIT',
    BREAKDOWN = 'BREAKDOWN',
    ACCIDENT = 'ACCIDENT',
    // Trạng thái hết hạn - không được phân công
    INSPECTION_EXPIRED = 'INSPECTION_EXPIRED',
    INSURANCE_EXPIRED = 'INSURANCE_EXPIRED',
    // Trạng thái sắp đến hạn - cảnh báo, vẫn được phân công
    INSPECTION_DUE = 'INSPECTION_DUE',
    INSURANCE_DUE = 'INSURANCE_DUE',
    MAINTENANCE_DUE = 'MAINTENANCE_DUE'
}

export const VehicleStatusColors: Record<string, string> = {
    [VehicleStatusEnum.ACTIVE]: 'bg-green-500 text-white',
    [VehicleStatusEnum.INACTIVE]: 'bg-gray-500 text-white',
    [VehicleStatusEnum.MAINTENANCE]: 'bg-blue-500 text-white',
    [VehicleStatusEnum.IN_TRANSIT]: 'bg-yellow-500 text-white',
    [VehicleStatusEnum.BREAKDOWN]: 'bg-orange-500 text-white',
    [VehicleStatusEnum.ACCIDENT]: 'bg-red-500 text-white',
    // Trạng thái hết hạn - màu đỏ đậm
    [VehicleStatusEnum.INSPECTION_EXPIRED]: 'bg-red-600 text-white',
    [VehicleStatusEnum.INSURANCE_EXPIRED]: 'bg-red-600 text-white',
    // Trạng thái sắp đến hạn - màu cam cảnh báo
    [VehicleStatusEnum.INSPECTION_DUE]: 'bg-amber-500 text-white',
    [VehicleStatusEnum.INSURANCE_DUE]: 'bg-amber-500 text-white',
    [VehicleStatusEnum.MAINTENANCE_DUE]: 'bg-amber-500 text-white'
};

export const VehicleStatusLabels: Record<string, string> = {
    [VehicleStatusEnum.ACTIVE]: 'Hoạt động',
    [VehicleStatusEnum.INACTIVE]: 'Ngừng hoạt động',
    [VehicleStatusEnum.MAINTENANCE]: 'Đang bảo trì',
    [VehicleStatusEnum.IN_TRANSIT]: 'Đang vận chuyển',
    [VehicleStatusEnum.BREAKDOWN]: 'Hỏng hóc',
    [VehicleStatusEnum.ACCIDENT]: 'Tai nạn',
    // Trạng thái hết hạn
    [VehicleStatusEnum.INSPECTION_EXPIRED]: 'Hết hạn đăng kiểm',
    [VehicleStatusEnum.INSURANCE_EXPIRED]: 'Hết hạn bảo hiểm',
    // Trạng thái sắp đến hạn
    [VehicleStatusEnum.INSPECTION_DUE]: 'Sắp hết hạn đăng kiểm',
    [VehicleStatusEnum.INSURANCE_DUE]: 'Sắp hết hạn bảo hiểm',
    [VehicleStatusEnum.MAINTENANCE_DUE]: 'Sắp đến hạn bảo trì'
};

/**
 * Lấy nhãn tiếng Việt cho trạng thái xe
 * Hỗ trợ cả status string không nằm trong enum
 */
export const getVehicleStatusLabel = (status: string): string => {
    return VehicleStatusLabels[status] || status;
};

/**
 * Lấy màu cho trạng thái xe
 * Hỗ trợ cả status string không nằm trong enum
 */
export const getVehicleStatusColor = (status: string): string => {
    return VehicleStatusColors[status] || 'bg-gray-400 text-white';
}; 