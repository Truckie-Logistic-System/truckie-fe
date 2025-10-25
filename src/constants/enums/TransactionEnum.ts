export enum TransactionEnum {
    PENDING = 'PENDING',
    PAID = 'PAID',
    DEPOSITED = 'DEPOSITED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    REFUNDED = 'REFUNDED'
}

export const TransactionStatusColors = {
    // Chờ thanh toán
    [TransactionEnum.PENDING]: 'bg-yellow-500 text-white',
    [TransactionEnum.PAID]: 'bg-emerald-500 text-white',
    [TransactionEnum.DEPOSITED]: 'bg-green-400 text-white',

    // Lỗi/Hủy
    [TransactionEnum.FAILED]: 'bg-red-500 text-white',
    [TransactionEnum.CANCELLED]: 'bg-red-500 text-white',
    [TransactionEnum.EXPIRED]: 'bg-gray-600 text-white',
    [TransactionEnum.REFUNDED]: 'bg-blue-500 text-white'
};

export const TransactionStatusLabels = {
    [TransactionEnum.PENDING]: 'Chờ thanh toán',
    [TransactionEnum.PAID]: 'Đã thanh toán',
    [TransactionEnum.DEPOSITED]: 'Đã đặt cọc',
    [TransactionEnum.FAILED]: 'Thất bại',
    [TransactionEnum.CANCELLED]: 'Đã hủy',
    [TransactionEnum.EXPIRED]: 'Hết hạn',
    [TransactionEnum.REFUNDED]: 'Đã hoàn tiền'
};

// Màu nền cho status cards (inline style objects)
export const TransactionStatusCardColors = {
    // Chờ thanh toán - Vàng/Xanh lá
    [TransactionEnum.PENDING]: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
    [TransactionEnum.PAID]: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
    [TransactionEnum.DEPOSITED]: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },

    // Lỗi/Hủy - Đỏ/Xám
    [TransactionEnum.FAILED]: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
    [TransactionEnum.CANCELLED]: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
    [TransactionEnum.EXPIRED]: { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' },
    [TransactionEnum.REFUNDED]: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }
};