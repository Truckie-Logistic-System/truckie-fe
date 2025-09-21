export enum TransactionEnum {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    REFUNDED = 'REFUNDED'
}

export const TransactionStatusColors = {
    [TransactionEnum.PENDING]: 'bg-yellow-500 text-white',
    [TransactionEnum.PAID]: 'bg-green-500 text-white',
    [TransactionEnum.FAILED]: 'bg-red-500 text-white',
    [TransactionEnum.CANCELLED]: 'bg-gray-500 text-white',
    [TransactionEnum.EXPIRED]: 'bg-gray-600 text-white',
    [TransactionEnum.REFUNDED]: 'bg-blue-500 text-white'
};

export const TransactionStatusLabels = {
    [TransactionEnum.PENDING]: 'Chờ thanh toán',
    [TransactionEnum.PAID]: 'Đã thanh toán',
    [TransactionEnum.FAILED]: 'Thất bại',
    [TransactionEnum.CANCELLED]: 'Đã hủy',
    [TransactionEnum.EXPIRED]: 'Hết hạn',
    [TransactionEnum.REFUNDED]: 'Đã hoàn tiền'
}; 