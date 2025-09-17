import React from 'react';
import StatusTag from './StatusTag';
import { VehicleAssignmentEnum, VehicleAssignmentColors, VehicleAssignmentLabels } from '../../../constants/enums';
import {
    MinusCircleOutlined,
    UserOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    CarOutlined,
    ClockCircleOutlined,
    ToolOutlined,
    StopOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';

interface VehicleAssignmentTagProps {
    status: VehicleAssignmentEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái phân công xe với kiểu dáng phù hợp
 */
const VehicleAssignmentTag: React.FC<VehicleAssignmentTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: VehicleAssignmentEnum) => {
        switch (status) {
            case VehicleAssignmentEnum.UNASSIGNED:
                return <MinusCircleOutlined />;
            case VehicleAssignmentEnum.ASSIGNED_TO_DRIVER:
                return <UserOutlined />;
            case VehicleAssignmentEnum.ASSIGNED_TO_ROUTE:
                return <EnvironmentOutlined />;
            case VehicleAssignmentEnum.RESERVED:
                return <CalendarOutlined />;
            case VehicleAssignmentEnum.IN_TRANSIT:
                return <CarOutlined />;
            case VehicleAssignmentEnum.ON_STANDBY:
                return <ClockCircleOutlined />;
            case VehicleAssignmentEnum.MAINTENANCE_HOLD:
                return <ToolOutlined />;
            case VehicleAssignmentEnum.DECOMMISSIONED:
                return <StopOutlined />;
            case VehicleAssignmentEnum.COMPLETE:
                return <CheckCircleOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={VehicleAssignmentColors[status]}
            label={VehicleAssignmentLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default VehicleAssignmentTag; 