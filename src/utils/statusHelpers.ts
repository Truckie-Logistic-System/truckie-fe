import {
    ContractStatusEnum,
    ContractStatusLabels,
    ContractStatusColors,
    ContractStatusCardColors,
    TransactionEnum,
    TransactionStatusLabels,
    TransactionStatusColors,
    TransactionStatusCardColors,
    OrderStatusEnum,
    OrderStatusLabels,
    OrderStatusColors,
    OrderStatusCardColors
} from '@/constants/enums';

/**
 * Lấy label tiếng Việt cho contract status
 */
export const getContractStatusLabel = (status: string): string => {
    return ContractStatusLabels[status as ContractStatusEnum] || status;
};

/**
 * Lấy màu CSS class cho contract status
 */
export const getContractStatusColor = (status: string): string => {
    return ContractStatusColors[status as ContractStatusEnum] || 'bg-gray-400 text-white';
};

/**
 * Lấy màu card cho contract status
 */
export const getContractStatusCardColor = (status: string) => {
    return ContractStatusCardColors[status as ContractStatusEnum] || { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' };
};

/**
 * Lấy label tiếng Việt cho transaction status
 */
export const getTransactionStatusLabel = (status: string): string => {
    return TransactionStatusLabels[status as TransactionEnum] || status;
};

/**
 * Lấy màu CSS class cho transaction status
 */
export const getTransactionStatusColor = (status: string): string => {
    return TransactionStatusColors[status as TransactionEnum] || 'bg-gray-400 text-white';
};

/**
 * Lấy màu card cho transaction status
 */
export const getTransactionStatusCardColor = (status: string) => {
    return TransactionStatusCardColors[status as TransactionEnum] || { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' };
};

/**
 * Lấy label tiếng Việt cho order status
 */
export const getOrderStatusLabel = (status: string): string => {
    return OrderStatusLabels[status as OrderStatusEnum] || status;
};

/**
 * Lấy màu CSS class cho order status
 */
export const getOrderStatusColor = (status: string): string => {
    return OrderStatusColors[status as OrderStatusEnum] || 'bg-gray-400 text-white';
};

/**
 * Lấy màu card cho order status
 */
export const getOrderStatusCardColor = (status: string) => {
    return OrderStatusCardColors[status as OrderStatusEnum] || { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' };
};
