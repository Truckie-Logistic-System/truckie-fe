import React from 'react';
import StatusTag from './StatusTag';
import { CommonStatusEnum, CommonStatusColors, CommonStatusLabels } from '../../../constants/enums';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    CheckOutlined
} from '@ant-design/icons';

interface CommonStatusTagProps {
    status: CommonStatusEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị các trạng thái phổ biến như active/inactive
 */
const CommonStatusTag: React.FC<CommonStatusTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: CommonStatusEnum) => {
        switch (status) {
            case CommonStatusEnum.ACTIVE:
                return <CheckCircleOutlined />;
            case CommonStatusEnum.INACTIVE:
                return <CloseCircleOutlined />;
            case CommonStatusEnum.DELETED:
                return <DeleteOutlined />;
            case CommonStatusEnum.PENDING:
                return <ClockCircleOutlined />;
            case CommonStatusEnum.PROCESSING:
                return <SyncOutlined spin />;
            case CommonStatusEnum.COMPLETED:
                return <CheckOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={CommonStatusColors[status]}
            label={CommonStatusLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default CommonStatusTag; 