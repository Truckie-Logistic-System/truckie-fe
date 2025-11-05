import React from 'react';
import { Tag } from 'antd';
import { OrderStatusEnum, OrderStatusLabels, OrderStatusColors } from '../../../constants/enums';

interface OrderDetailStatusTagProps {
    status: string;
    className?: string;
}

/**
 * Component hiển thị trạng thái chi tiết đơn hàng với tiếng Việt và màu sắc
 */
const OrderDetailStatusTag: React.FC<OrderDetailStatusTagProps> = ({ status, className }) => {
    const colorClass = OrderStatusColors[status as OrderStatusEnum] || 'bg-gray-400 text-white';
    const label = OrderStatusLabels[status as OrderStatusEnum] || status;
    
    // Extract color from colorClass (e.g., "bg-blue-500 text-white" -> "blue")
    const getTagColor = (colorClass: string): string => {
        if (colorClass.includes('bg-gray-400')) return 'default';
        if (colorClass.includes('bg-blue')) return 'blue';
        if (colorClass.includes('bg-green')) return 'green';
        if (colorClass.includes('bg-red')) return 'red';
        if (colorClass.includes('bg-orange')) return 'orange';
        if (colorClass.includes('bg-amber')) return 'orange';
        if (colorClass.includes('bg-indigo')) return 'purple';
        if (colorClass.includes('bg-emerald')) return 'green';
        return 'default';
    };

    return (
        <Tag color={getTagColor(colorClass)} className={className}>
            {label}
        </Tag>
    );
};

export default OrderDetailStatusTag;
