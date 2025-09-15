import React from 'react';
import StatusBadge from './StatusBadge';

interface StatusTagProps {
    status: string;
    colorClass?: string;
    label?: string;
    className?: string;
    icon?: React.ReactNode;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái dưới dạng tag
 * (Giữ lại để đảm bảo tính tương thích ngược)
 */
const StatusTag: React.FC<StatusTagProps> = ({
    status,
    colorClass,
    label,
    className,
    icon,
    size = 'default',
}) => {
    return (
        <StatusBadge
            status={status}
            colorClass={colorClass}
            label={label}
            className={className}
            icon={icon}
            size={size}
        />
    );
};

export default StatusTag; 