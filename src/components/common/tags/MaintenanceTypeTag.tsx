import React from 'react';
import StatusTag from './StatusTag';
import { MaintenanceTypeEnum, MaintenanceTypeColors, MaintenanceTypeLabels } from '../../../constants/enums';
import {
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';

interface MaintenanceTypeTagProps {
    status: MaintenanceTypeEnum | boolean;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái loại bảo dưỡng
 */
const MaintenanceTypeTag: React.FC<MaintenanceTypeTagProps> = ({ status, className, size }) => {
    // Chuyển đổi boolean sang enum nếu cần
    const statusValue = typeof status === 'boolean'
        ? (status ? MaintenanceTypeEnum.ACTIVE : MaintenanceTypeEnum.INACTIVE)
        : status;

    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: MaintenanceTypeEnum) => {
        switch (status) {
            case MaintenanceTypeEnum.ACTIVE:
                return <CheckCircleOutlined />;
            case MaintenanceTypeEnum.INACTIVE:
                return <CloseCircleOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={statusValue}
            colorClass={MaintenanceTypeColors[statusValue]}
            label={MaintenanceTypeLabels[statusValue]}
            className={className}
            icon={getStatusIcon(statusValue)}
            size={size}
        />
    );
};

export default MaintenanceTypeTag; 