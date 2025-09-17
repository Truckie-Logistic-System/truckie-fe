import React from 'react';
import StatusTag from './StatusTag';
import { UserStatusEnum, UserStatusColors, UserStatusLabels } from '../../../constants/enums';
import {
    CheckCircleOutlined,
    StopOutlined,
    DeleteOutlined,
    ClockCircleOutlined,
    LockOutlined
} from '@ant-design/icons';

interface UserStatusTagProps {
    status: UserStatusEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái người dùng với kiểu dáng phù hợp
 */
const UserStatusTag: React.FC<UserStatusTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: UserStatusEnum) => {
        switch (status) {
            case UserStatusEnum.ACTIVE:
                return <CheckCircleOutlined />;
            case UserStatusEnum.INACTIVE:
                return <StopOutlined />;
            case UserStatusEnum.DELETED:
                return <DeleteOutlined />;
            case UserStatusEnum.OTP_PENDING:
                return <ClockCircleOutlined />;
            case UserStatusEnum.BANNED:
                return <LockOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={UserStatusColors[status]}
            label={UserStatusLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default UserStatusTag; 