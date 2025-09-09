import React from 'react';
import { Tag } from 'antd';
import type { OrderStatus } from '../../../models';

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
    let color = 'default';
    let label = status;
    let bgColor = '';

    switch (status) {
        // Trạng thái ban đầu
        case 'PENDING':
            color = 'orange';
            bgColor = 'bg-gradient-to-r from-yellow-500 to-orange-500';
            label = 'Chờ xử lý';
            break;
        case 'PROCESSING':
            color = 'blue';
            bgColor = 'bg-gradient-to-r from-blue-400 to-blue-500';
            label = 'Đang xử lý';
            break;
        case 'CANCELLED':
            color = 'red';
            bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
            label = 'Đã hủy';
            break;

        // Trạng thái hợp đồng
        case 'CONTRACT_DRAFT':
            color = 'cyan';
            bgColor = 'bg-gradient-to-r from-cyan-500 to-blue-400';
            label = 'Bản nháp hợp đồng';
            break;
        case 'CONTRACT_DENIED':
            color = 'red';
            bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
            label = 'Hợp đồng bị từ chối';
            break;
        case 'CONTRACT_SIGNED':
            color = 'green';
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            label = 'Hợp đồng đã ký';
            break;

        // Trạng thái lập kế hoạch và phân công
        case 'ON_PLANNING':
            color = 'purple';
            bgColor = 'bg-gradient-to-r from-purple-500 to-indigo-500';
            label = 'Đang lập kế hoạch';
            break;
        case 'ASSIGNED_TO_DRIVER':
            color = 'geekblue';
            bgColor = 'bg-gradient-to-r from-blue-500 to-indigo-500';
            label = 'Đã phân công cho tài xế';
            break;
        case 'DRIVER_CONFIRM':
            color = 'blue';
            bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
            label = 'Tài xế đã xác nhận';
            break;

        // Trạng thái vận chuyển
        case 'PICKED_UP':
            color = 'cyan';
            bgColor = 'bg-gradient-to-r from-cyan-500 to-blue-500';
            label = 'Đã lấy hàng';
            break;
        case 'SEALED_COMPLETED':
            color = 'cyan';
            bgColor = 'bg-gradient-to-r from-cyan-500 to-blue-500';
            label = 'Đã niêm phong';
            break;
        case 'ON_DELIVERED':
            color = 'blue';
            bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
            label = 'Đang vận chuyển';
            break;
        case 'ONGOING_DELIVERED':
            color = 'blue';
            bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
            label = 'Đang giao hàng';
            break;
        case 'IN_DELIVERED':
            color = 'blue';
            bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
            label = 'Đang giao hàng';
            break;

        // Trạng thái vấn đề
        case 'IN_TROUBLES':
            color = 'red';
            bgColor = 'bg-gradient-to-r from-red-600 to-orange-500';
            label = 'Gặp sự cố';
            break;
        case 'RESOLVED':
            color = 'green';
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            label = 'Đã giải quyết';
            break;
        case 'COMPENSATION':
            color = 'orange';
            bgColor = 'bg-gradient-to-r from-orange-500 to-amber-500';
            label = 'Đang bồi thường';
            break;

        // Trạng thái hoàn thành
        case 'DELIVERED':
            color = 'green';
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            label = 'Đã giao hàng';
            break;
        case 'SUCCESSFUL':
            color = 'green';
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            label = 'Hoàn thành';
            break;

        // Trạng thái từ chối và hoàn trả
        case 'REJECT_ORDER':
            color = 'red';
            bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
            label = 'Đơn hàng bị từ chối';
            break;
        case 'RETURNING':
            color = 'orange';
            bgColor = 'bg-gradient-to-r from-purple-500 to-pink-500';
            label = 'Đang hoàn trả';
            break;
        case 'RETURNED':
            color = 'volcano';
            bgColor = 'bg-gradient-to-r from-purple-500 to-pink-500';
            label = 'Đã hoàn trả';
            break;

        default:
            color = 'default';
            bgColor = 'bg-gradient-to-r from-gray-500 to-slate-500';
            label = status;
    }

    if (showGradient) {
        const sizeClasses = size === 'small'
            ? 'px-2 py-1 text-xs'
            : size === 'large'
                ? 'px-6 py-3 text-base'
                : 'px-4 py-2 text-sm';

        return (
            <div className={`${bgColor} text-white ${sizeClasses} rounded-full inline-flex items-center shadow-md`}>
                <span className="font-medium">{label}</span>
            </div>
        );
    }

    return <Tag color={color}>{label}</Tag>;
};

export default OrderStatusDisplay; 