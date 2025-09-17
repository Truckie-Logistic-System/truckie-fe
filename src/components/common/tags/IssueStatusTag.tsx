import React from 'react';
import StatusTag from './StatusTag';
import { IssueEnum, IssueStatusColors, IssueStatusLabels } from '../../../constants/enums';
import {
    ExclamationCircleOutlined,
    SyncOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';

interface IssueStatusTagProps {
    status: IssueEnum;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Component hiển thị trạng thái sự cố với kiểu dáng phù hợp
 */
const IssueStatusTag: React.FC<IssueStatusTagProps> = ({ status, className, size }) => {
    // Xác định icon dựa vào trạng thái
    const getStatusIcon = (status: IssueEnum) => {
        switch (status) {
            case IssueEnum.OPEN:
                return <ExclamationCircleOutlined />;
            case IssueEnum.IN_PROGRESS:
                return <SyncOutlined spin />;
            case IssueEnum.RESOLVED:
                return <CheckCircleOutlined />;
            default:
                return null;
        }
    };

    return (
        <StatusTag
            status={status}
            colorClass={IssueStatusColors[status]}
            label={IssueStatusLabels[status]}
            className={className}
            icon={getStatusIcon(status)}
            size={size}
        />
    );
};

export default IssueStatusTag; 