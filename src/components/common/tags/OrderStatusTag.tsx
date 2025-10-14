import React from 'react';
import StatusTag from './StatusTag';
import { OrderStatusEnum, OrderStatusColors, OrderStatusLabels } from '../../../constants/enums';
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    FileOutlined,
    UserOutlined,
    CarOutlined,
    ExclamationCircleOutlined,
    RollbackOutlined
} from '@ant-design/icons';

interface OrderStatusTagProps {
    status: OrderStatusEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái đơn hàng với kiểu dáng phù hợp
 */
const OrderStatusTag: React.FC<OrderStatusTagProps> = ({ status, className, size }) => {
    // Debug log để kiểm tra status
    console.log('OrderStatusTag received status:', status);
    
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: OrderStatusEnum) => {
        // Trạng thái ban đầu
        if ([OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING].includes(status)) {
            return <ClockCircleOutlined />;
        }

        // Trạng thái hợp đồng
        if ([OrderStatusEnum.CONTRACT_DRAFT, OrderStatusEnum.CONTRACT_SIGNED].includes(status)) {
            return <FileOutlined />;
        }

        // Trạng thái lập kế hoạch và phân công
        if ([OrderStatusEnum.ON_PLANNING, OrderStatusEnum.ASSIGNED_TO_DRIVER, OrderStatusEnum.FULLY_PAID].includes(status)) {
            return <UserOutlined />;
        }

        // Trạng thái vận chuyển
        if ([OrderStatusEnum.PICKING_UP, OrderStatusEnum.ON_DELIVERED, OrderStatusEnum.ONGOING_DELIVERED].includes(status)) {
            return <CarOutlined />;
        }

        // Trạng thái vấn đề
        if ([OrderStatusEnum.IN_TROUBLES, OrderStatusEnum.COMPENSATION].includes(status)) {
            return <ExclamationCircleOutlined />;
        }

        // Trạng thái hoàn thành
        if ([OrderStatusEnum.DELIVERED, OrderStatusEnum.SUCCESSFUL, OrderStatusEnum.RESOLVED].includes(status)) {
            return <CheckCircleOutlined />;
        }

        // Trạng thái từ chối
        if ([OrderStatusEnum.REJECT_ORDER].includes(status)) {
            return <CloseCircleOutlined />;
        }

        // Trạng thái hoàn trả
        if ([OrderStatusEnum.RETURNING, OrderStatusEnum.RETURNED].includes(status)) {
            return <RollbackOutlined />;
        }

        return null;
    };

    // Fallback nếu status không có trong enum
    const colorClass = OrderStatusColors[status] || 'bg-gray-400 text-white';
    const label = OrderStatusLabels[status] || status;
    
    return (
        <StatusTag
            status={status}
            colorClass={colorClass}
            label={label}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default OrderStatusTag; 