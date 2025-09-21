import React from 'react';
import StatusTag from './StatusTag';
import { DeviceStatusEnum, DeviceStatusColors, DeviceStatusLabels } from '../../../constants/enums';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ToolOutlined,
    WarningOutlined
} from '@ant-design/icons';

interface DeviceStatusTagProps {
    status: DeviceStatusEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái thiết bị
 */
const DeviceStatusTag: React.FC<DeviceStatusTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: DeviceStatusEnum) => {
        switch (status) {
            case DeviceStatusEnum.ACTIVE:
                return <CheckCircleOutlined />;
            case DeviceStatusEnum.INACTIVE:
                return <CloseCircleOutlined />;
            case DeviceStatusEnum.MAINTENANCE:
                return <ToolOutlined />;
            case DeviceStatusEnum.BROKEN:
                return <WarningOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={DeviceStatusColors[status]}
            label={DeviceStatusLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default DeviceStatusTag; 