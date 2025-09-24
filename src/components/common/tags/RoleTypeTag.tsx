import React from 'react';
import StatusTag from './StatusTag';
import { RoleTypeEnum, RoleTypeColors, RoleTypeLabels } from '../../../constants/enums';

interface RoleTypeTagProps {
    role: RoleTypeEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị vai trò người dùng với kiểu dáng phù hợp
 */
const RoleTypeTag: React.FC<RoleTypeTagProps> = ({ role, className, size }) => {
    return (
        <StatusTag
            status={role}
            colorClass={RoleTypeColors[role]}
            label={RoleTypeLabels[role]}
            className={className}
            size={size}
        />
    );
};

export default RoleTypeTag; 