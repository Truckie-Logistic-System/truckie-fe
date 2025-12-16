import React from 'react';
import StatusTag from './StatusTag';
import { VehicleStatusEnum, VehicleStatusColors, VehicleStatusLabels, getVehicleStatusLabel, getVehicleStatusColor } from '../../../constants/enums';
import {
    CheckCircleOutlined,
    StopOutlined,
    ToolOutlined,
    CarOutlined,
    WarningOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    SafetyCertificateOutlined,
    FileProtectOutlined
} from '@ant-design/icons';

interface VehicleStatusTagProps {
    status: VehicleStatusEnum | string;
    className?: string;
    size?: 'small' | 'default' | 'large';
    showIcon?: boolean;
    showText?: boolean;
}

/**
 * Component hiển thị trạng thái phương tiện với kiểu dáng phù hợp
 */
const VehicleStatusTag: React.FC<VehicleStatusTagProps> = ({
    status,
    className,
    size = 'small',
    showIcon = true,
    showText = true
}) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: string) => {
        if (!showIcon) return null;

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
            case VehicleStatusEnum.INSPECTION_EXPIRED:
            case VehicleStatusEnum.INSPECTION_DUE:
                return <FileProtectOutlined />;
            case VehicleStatusEnum.INSURANCE_EXPIRED:
            case VehicleStatusEnum.INSURANCE_DUE:
                return <SafetyCertificateOutlined />;
            case VehicleStatusEnum.MAINTENANCE_DUE:
                return <ClockCircleOutlined />;
            default:
                return null;
        }
    };

    // Lấy nhãn trạng thái - hỗ trợ cả string status
    const statusLabel = showText ? getVehicleStatusLabel(status as string) : '';
    const statusColor = getVehicleStatusColor(status as string);

    return (
        <StatusTag
            status={status as string}
            colorClass={statusColor}
            label={statusLabel}
            className={`whitespace-nowrap flex-shrink-0 ${className || ''}`}
            icon={getStatusIcon(status as string)}
            size={size}
        />
    );
};

export default VehicleStatusTag; 