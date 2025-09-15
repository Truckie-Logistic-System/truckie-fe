import React from 'react';
import StatusTag from './StatusTag';
import { ConversationStatusEnum, ConversationStatusColors, ConversationStatusLabels } from '../../../constants/enums';
import {
    MessageOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';

interface ConversationStatusTagProps {
    status: ConversationStatusEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái cuộc hội thoại với kiểu dáng phù hợp
 */
const ConversationStatusTag: React.FC<ConversationStatusTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: ConversationStatusEnum) => {
        switch (status) {
            case ConversationStatusEnum.ACTIVE:
                return <MessageOutlined />;
            case ConversationStatusEnum.CLOSED:
                return <CloseCircleOutlined />;
            case ConversationStatusEnum.PENDING:
                return <ClockCircleOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={ConversationStatusColors[status]}
            label={ConversationStatusLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default ConversationStatusTag; 