import React from 'react';
import StatusTag from './StatusTag';
import { ContractStatusEnum, ContractStatusColors, ContractStatusLabels } from '../../../constants/enums';
import {
    FileOutlined,
    CheckCircleOutlined,
    DollarOutlined,
    CloseCircleOutlined,
    HistoryOutlined,
    RollbackOutlined
} from '@ant-design/icons';

interface ContractStatusTagProps {
    status: ContractStatusEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái hợp đồng với kiểu dáng phù hợp
 */
const ContractStatusTag: React.FC<ContractStatusTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: ContractStatusEnum) => {
        switch (status) {
            case ContractStatusEnum.CONTRACT_DRAFT:
                return <FileOutlined />;
            case ContractStatusEnum.CONTRACT_SIGNED:
                return <CheckCircleOutlined />;
            case ContractStatusEnum.DEPOSITED:
                return <DollarOutlined />;
            case ContractStatusEnum.PAID:
                return <CheckCircleOutlined />;
            case ContractStatusEnum.UNPAID:
                return <DollarOutlined />;
            case ContractStatusEnum.CANCELLED:
                return <CloseCircleOutlined />;
            case ContractStatusEnum.EXPIRED:
                return <HistoryOutlined />;
            case ContractStatusEnum.REFUNDED:
                return <RollbackOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={ContractStatusColors[status]}
            label={ContractStatusLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default ContractStatusTag;
