import React from 'react';
import StatusTag from './StatusTag';
import { VehicleStatusEnum, VehicleStatusColors, VehicleStatusLabels } from '../../../constants/enums';
import {
    CheckCircleOutlined,
    StopOutlined,
    ToolOutlined,
    CarOutlined,
    WarningOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';

interface VehicleStatusTagProps {
    status: VehicleStatusEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái phương tiện với kiểu dáng phù hợp
 */
const VehicleStatusTag: React.FC<VehicleStatusTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: VehicleStatusEnum) => {
        switch (status) {
            case VehicleStatusEnum.ACTIVE:
                return <CheckCircleOutlined />;
            case VehicleStatusEnum.INACTIVE:
                return <StopOutlined />;
            case VehicleStatusEnum.MAINTENANCE:
                return <ToolOutlined />;
            case VehicleStatusEnum.IN_TRANSIT:
                return <CarOutlined />;
            case VehicleStatusEnum.BREAKDOWN:
                return <WarningOutlined />;
            case VehicleStatusEnum.ACCIDENT:
                return <ExclamationCircleOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={VehicleStatusColors[status]}
            label={VehicleStatusLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default VehicleStatusTag; 