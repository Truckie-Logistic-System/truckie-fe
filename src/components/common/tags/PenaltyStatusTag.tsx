import React from 'react';
import StatusTag from './StatusTag';
import { PenaltyStatusEnum, PenaltyStatusColors, PenaltyStatusLabels } from '../../../constants/enums';
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    CheckOutlined,
    StopOutlined
} from '@ant-design/icons';

interface PenaltyStatusTagProps {
    status: PenaltyStatusEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái khoản phạt với kiểu dáng phù hợp
 */
const PenaltyStatusTag: React.FC<PenaltyStatusTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: PenaltyStatusEnum) => {
        switch (status) {
            case PenaltyStatusEnum.PENDING:
                return <ClockCircleOutlined />;
            case PenaltyStatusEnum.PAID:
                return <CheckCircleOutlined />;
            case PenaltyStatusEnum.DISPUTED:
                return <ExclamationCircleOutlined />;
            case PenaltyStatusEnum.RESOLVED:
                return <CheckOutlined />;
            case PenaltyStatusEnum.CANCELLED:
                return <StopOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={PenaltyStatusColors[status]}
            label={PenaltyStatusLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default PenaltyStatusTag; 