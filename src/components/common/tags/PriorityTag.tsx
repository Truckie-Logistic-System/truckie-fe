import React from 'react';
import StatusTag from './StatusTag';
import { PriorityEnum, PriorityColors, PriorityLabels } from '../../../constants/enums';
import {
    FireOutlined,
    ExclamationOutlined,
    CheckOutlined
} from '@ant-design/icons';

interface PriorityTagProps {
    priority: PriorityEnum | string;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị mức độ ưu tiên
 */
const PriorityTag: React.FC<PriorityTagProps> = ({ priority, className, size }) => {
    // Chuyển đổi string sang enum nếu cần
    const getPriorityEnum = (value: string): PriorityEnum => {
        switch (value.toUpperCase()) {
            case 'HIGH':
            case 'CAO':
                return PriorityEnum.HIGH;
            case 'MEDIUM':
            case 'TRUNG BÌNH':
                return PriorityEnum.MEDIUM;
            case 'LOW':
            case 'THẤP':
                return PriorityEnum.LOW;
            default:
                return PriorityEnum.MEDIUM;
        }
    };

    const priorityValue = typeof priority === 'string' && !Object.values(PriorityEnum).includes(priority as PriorityEnum)
        ? getPriorityEnum(priority)
        : priority as PriorityEnum;

    // Xác định icon dựa vào mức độ ưu tiên
    const getPriorityIcon = (priority: PriorityEnum) => {
        switch (priority) {
            case PriorityEnum.HIGH:
                return <FireOutlined />;
            case PriorityEnum.MEDIUM:
                return <ExclamationOutlined />;
            case PriorityEnum.LOW:
                return <CheckOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={priorityValue}
            colorClass={PriorityColors[priorityValue]}
            label={PriorityLabels[priorityValue]}
            className={className}
            icon={getPriorityIcon(priorityValue)}
            size={size}
        />
    );
};

export default PriorityTag; 