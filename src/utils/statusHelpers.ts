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
import { OrderDetailStatusMetadata } from '@/models/OrderDetailStatus';

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

/**
 * Lấy label tiếng Việt cho order detail status
 */
export const getOrderDetailStatusLabel = (status: string): string => {
    return OrderDetailStatusMetadata[status as keyof typeof OrderDetailStatusMetadata]?.label || status;
};

/**
 * Lấy màu CSS class cho order detail status
 */
export const getOrderDetailStatusColor = (status: string): string => {
    return OrderDetailStatusMetadata[status as keyof typeof OrderDetailStatusMetadata]?.color || 'bg-gray-200 text-gray-600';
};

/**
 * Lấy màu nền cho order detail status (card style)
 */
export const getOrderDetailStatusCardColor = (status: string) => {
    const metadata = OrderDetailStatusMetadata[status as keyof typeof OrderDetailStatusMetadata];
    if (!metadata) return { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' };
    
    // Extract RGB values from Tailwind classes
    const colorMap: Record<string, { backgroundColor: string; borderColor: string }> = {
        'bg-gray-100': { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' },
        'bg-purple-100': { backgroundColor: '#f3e8ff', borderColor: '#e9d5ff' },
        'bg-blue-100': { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' },
        'bg-green-100': { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
        'bg-red-100': { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
        'bg-orange-100': { backgroundColor: '#ffedd5', borderColor: '#fed7aa' },
    };
    
    return colorMap[metadata.bgColor] || { backgroundColor: '#f3f4f6', borderColor: '#d1d5db' };
};