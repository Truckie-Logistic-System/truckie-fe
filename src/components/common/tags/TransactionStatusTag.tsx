import React from 'react';
import StatusTag from './StatusTag';
import { TransactionEnum, TransactionStatusColors, TransactionStatusLabels } from '../../../constants/enums';
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    StopOutlined,
    HistoryOutlined,
    RollbackOutlined
} from '@ant-design/icons';

interface TransactionStatusTagProps {
    status: TransactionEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái giao dịch với kiểu dáng phù hợp
 */
const TransactionStatusTag: React.FC<TransactionStatusTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: TransactionEnum) => {
        switch (status) {
            case TransactionEnum.PENDING:
                return <ClockCircleOutlined />;
            case TransactionEnum.PAID:
                return <CheckCircleOutlined />;
            case TransactionEnum.FAILED:
                return <CloseCircleOutlined />;
            case TransactionEnum.CANCELLED:
                return <StopOutlined />;
            case TransactionEnum.EXPIRED:
                return <HistoryOutlined />;
            case TransactionEnum.REFUNDED:
                return <RollbackOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={TransactionStatusColors[status]}
            label={TransactionStatusLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default TransactionStatusTag; 