// Seal status enum
export enum SealStatus {
    ACTIVE = 'ACTIVE',
    IN_USE = 'IN_USE',
    REMOVED = 'REMOVED',
    DAMAGED = 'DAMAGED'
}

// Seal status labels in Vietnamese
export const SealStatusLabels: Record<SealStatus, string> = {
    [SealStatus.ACTIVE]: 'Sẵn sàng',
    [SealStatus.IN_USE]: 'Đang sử dụng',
    [SealStatus.REMOVED]: 'Đã gỡ',
    [SealStatus.DAMAGED]: 'Hư hỏng'
};

// Seal status colors for tags
export const SealStatusColors: Record<SealStatus, string> = {
    [SealStatus.ACTIVE]: 'success',
    [SealStatus.IN_USE]: 'processing',
    [SealStatus.REMOVED]: 'warning',
    [SealStatus.DAMAGED]: 'error'
};

// Helper function to get seal status label
export const getSealStatusLabel = (status: string): string => {
    return SealStatusLabels[status as SealStatus] || status;
};

// Helper function to get seal status color
export const getSealStatusColor = (status: string): string => {
    return SealStatusColors[status as SealStatus] || 'default';
};
