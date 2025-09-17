import React, { useMemo } from 'react';
import { OrderStatusEnum, OrderStatusColors, OrderStatusLabels } from '../../../constants/enums';
import { StatusFilterGroup } from '../../../components/common';
import type { StatusFilterOption } from '../../../components/common';
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

interface OrderStatusFilterGroupProps {
    value: string;
    onChange: (value: OrderStatusEnum | string) => void;
    showAll?: boolean;
    allLabel?: string;
    badgeSize?: 'small' | 'default' | 'large';
    className?: string;
    disabled?: boolean;
    counts?: Record<OrderStatusEnum, number>;
}

/**
 * Component hiển thị nhóm filter theo trạng thái đơn hàng
 */
const OrderStatusFilterGroup: React.FC<OrderStatusFilterGroupProps> = ({
    value,
    onChange,
    showAll = true,
    allLabel = 'Tất cả trạng thái',
    badgeSize = 'small',
    className,
    disabled,
    counts
}) => {
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
        if ([OrderStatusEnum.ON_PLANNING, OrderStatusEnum.ASSIGNED_TO_DRIVER, OrderStatusEnum.DRIVER_CONFIRM].includes(status)) {
            return <UserOutlined />;
        }

        // Trạng thái vận chuyển
        if ([OrderStatusEnum.PICKED_UP, OrderStatusEnum.SEALED_COMPLETED, OrderStatusEnum.ON_DELIVERED,
        OrderStatusEnum.ONGOING_DELIVERED, OrderStatusEnum.IN_DELIVERED].includes(status)) {
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

        // Trạng thái từ chối và hoàn trả
        if ([OrderStatusEnum.REJECT_ORDER, OrderStatusEnum.CANCELLED, OrderStatusEnum.CONTRACT_DENIED].includes(status)) {
            return <CloseCircleOutlined />;
        }

        if ([OrderStatusEnum.RETURNING, OrderStatusEnum.RETURNED].includes(status)) {
            return <RollbackOutlined />;
        }

        return null;
    };

    // Nhóm các trạng thái theo nhóm logic
    const statusGroups = useMemo(() => {
        const pendingStatuses = [OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING, OrderStatusEnum.CONTRACT_DRAFT];
        const inProgressStatuses = [
            OrderStatusEnum.CONTRACT_SIGNED, OrderStatusEnum.ON_PLANNING, OrderStatusEnum.ASSIGNED_TO_DRIVER,
            OrderStatusEnum.DRIVER_CONFIRM, OrderStatusEnum.PICKED_UP, OrderStatusEnum.ON_DELIVERED,
            OrderStatusEnum.ONGOING_DELIVERED, OrderStatusEnum.IN_DELIVERED
        ];
        const completedStatuses = [OrderStatusEnum.DELIVERED, OrderStatusEnum.SUCCESSFUL];
        const problemStatuses = [
            OrderStatusEnum.CANCELLED, OrderStatusEnum.CONTRACT_DENIED, OrderStatusEnum.IN_TROUBLES,
            OrderStatusEnum.REJECT_ORDER, OrderStatusEnum.RETURNING, OrderStatusEnum.RETURNED
        ];

        return [
            ...pendingStatuses,
            ...inProgressStatuses,
            ...completedStatuses,
            ...problemStatuses
        ];
    }, []);

    // Tạo danh sách options cho StatusFilterGroup
    const statusOptions = useMemo(() => {
        return statusGroups.map(status => ({
            value: status,
            label: OrderStatusLabels[status],
            colorClass: OrderStatusColors[status],
            icon: getStatusIcon(status),
            count: counts?.[status]
        } as StatusFilterOption<OrderStatusEnum>));
    }, [counts, statusGroups]);

    return (
        <StatusFilterGroup
            options={statusOptions}
            value={value}
            onChange={onChange}
            showAll={showAll}
            allLabel={allLabel}
            badgeSize={badgeSize}
            className={className}
            disabled={disabled}
        />
    );
};

export default OrderStatusFilterGroup; 