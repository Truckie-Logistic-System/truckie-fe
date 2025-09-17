export enum PenaltyStatusEnum {
    PENDING = 'PENDING',
    PAID = 'PAID',
    DISPUTED = 'DISPUTED',
    RESOLVED = 'RESOLVED',
    CANCELLED = 'CANCELLED'
}

export const PenaltyStatusColors = {
    [PenaltyStatusEnum.PENDING]: 'bg-yellow-500 text-white',
    [PenaltyStatusEnum.PAID]: 'bg-green-500 text-white',
    [PenaltyStatusEnum.DISPUTED]: 'bg-red-500 text-white',
    [PenaltyStatusEnum.RESOLVED]: 'bg-blue-500 text-white',
    [PenaltyStatusEnum.CANCELLED]: 'bg-gray-500 text-white'
};

export const PenaltyStatusLabels = {
    [PenaltyStatusEnum.PENDING]: 'Chờ thanh toán',
    [PenaltyStatusEnum.PAID]: 'Đã thanh toán',
    [PenaltyStatusEnum.DISPUTED]: 'Đang tranh chấp',
    [PenaltyStatusEnum.RESOLVED]: 'Đã giải quyết',
    [PenaltyStatusEnum.CANCELLED]: 'Đã hủy'
}; 