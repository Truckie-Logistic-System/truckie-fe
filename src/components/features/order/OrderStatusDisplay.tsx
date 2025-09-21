import React from 'react';
import { OrderStatusEnum } from '@/constants/enums';
import { OrderStatusTag } from '@/components/common/tags';

interface OrderStatusDisplayProps {
    status: string;
    showGradient?: boolean;
    size?: 'small' | 'default' | 'large';
}

const OrderStatusDisplay: React.FC<OrderStatusDisplayProps> = ({
    status,
    showGradient = true,
    size = 'default'
}) => {
    let bgColor = '';
    let label = '';

    switch (status) {
        // Trạng thái ban đầu
        case 'PENDING':
            bgColor = 'bg-gradient-to-r from-yellow-500 to-orange-500';
            break;
        case 'PROCESSING':
            bgColor = 'bg-gradient-to-r from-blue-400 to-blue-500';
            break;
        case 'CANCELLED':
            bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
            break;

        // Trạng thái hợp đồng
        case 'CONTRACT_DRAFT':
            bgColor = 'bg-gradient-to-r from-cyan-500 to-blue-400';
            break;
        case 'CONTRACT_DENIED':
            bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
            break;
        case 'CONTRACT_SIGNED':
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            break;

        // Trạng thái lập kế hoạch và phân công
        case 'ON_PLANNING':
            bgColor = 'bg-gradient-to-r from-purple-500 to-indigo-500';
            break;
        case 'ASSIGNED_TO_DRIVER':
            bgColor = 'bg-gradient-to-r from-blue-500 to-indigo-500';
            break;
        case 'DRIVER_CONFIRM':
            bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
            break;

        // Trạng thái vận chuyển
        case 'PICKED_UP':
            bgColor = 'bg-gradient-to-r from-cyan-500 to-blue-500';
            break;
        case 'SEALED_COMPLETED':
            bgColor = 'bg-gradient-to-r from-cyan-500 to-blue-500';
            break;
        case 'ON_DELIVERED':
            bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
            break;
        case 'ONGOING_DELIVERED':
            bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
            break;
        case 'IN_DELIVERED':
            bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
            break;

        // Trạng thái vấn đề
        case 'IN_TROUBLES':
            bgColor = 'bg-gradient-to-r from-red-600 to-orange-500';
            break;
        case 'RESOLVED':
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            break;
        case 'COMPENSATION':
            bgColor = 'bg-gradient-to-r from-orange-500 to-amber-500';
            break;

        // Trạng thái hoàn thành
        case 'DELIVERED':
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            break;
        case 'SUCCESSFUL':
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            break;

        // Trạng thái từ chối và hoàn trả
        case 'REJECT_ORDER':
            bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
            break;
        case 'RETURNING':
            bgColor = 'bg-gradient-to-r from-purple-500 to-pink-500';
            break;
        case 'RETURNED':
            bgColor = 'bg-gradient-to-r from-purple-500 to-pink-500';
            break;

        default:
            bgColor = 'bg-gradient-to-r from-gray-500 to-slate-500';
    }

    if (showGradient) {
        const sizeClasses = size === 'small'
            ? 'px-2 py-1 text-xs'
            : size === 'large'
                ? 'px-6 py-3 text-base'
                : 'px-4 py-2 text-sm';

        return (
            <div className={`${bgColor} text-white ${sizeClasses} rounded-full inline-flex items-center shadow-md`}>
                <span className="font-medium">{label || status}</span>
            </div>
        );
    }

    return <OrderStatusTag status={status as OrderStatusEnum} size={size} />;
};

export default OrderStatusDisplay; 