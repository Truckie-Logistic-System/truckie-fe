import React from 'react';
import { ContractStatusEnum } from '@/constants/enums';
import { ContractStatusTag } from '@/components/common/tags';

interface ContractStatusDisplayProps {
    status: string;
    showGradient?: boolean;
    size?: 'small' | 'default' | 'large';
}

const ContractStatusDisplay: React.FC<ContractStatusDisplayProps> = ({
    status,
    showGradient = true,
    size = 'default'
}) => {
    let bgColor = '';

    switch (status) {
        // Bản nháp
        case 'CONTRACT_DRAFT':
            bgColor = 'bg-gradient-to-r from-gray-400 to-gray-500';
            break;
        case 'CONTRACT_SIGNED':
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            break;

        // Thanh toán
        case 'DEPOSITED':
            bgColor = 'bg-gradient-to-r from-yellow-500 to-orange-500';
            break;
        case 'PAID':
            bgColor = 'bg-gradient-to-r from-emerald-500 to-green-500';
            break;
        case 'UNPAID':
            bgColor = 'bg-gradient-to-r from-orange-500 to-red-500';
            break;

        // Hủy/Hết hạn
        case 'CANCELLED':
            bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
            break;
        case 'EXPIRED':
            bgColor = 'bg-gradient-to-r from-gray-500 to-slate-500';
            break;
        case 'REFUNDED':
            bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
            break;

        default:
            bgColor = 'bg-gradient-to-r from-gray-500 to-slate-500';
    }

    if (showGradient) {
        const sizeClasses = size === 'small'
            ? 'px-2 py-1 text-xs'
            : size === 'large'
                ? 'px-6 py-3 text-base'
                : 'px-4 py-2 text-sm';

        return (
            <div className={`${bgColor} text-white ${sizeClasses} rounded-full inline-flex items-center shadow-md`}>
                <span className="font-medium">{status}</span>
            </div>
        );
    }

    return <ContractStatusTag status={status as ContractStatusEnum} size={size} />;
};

export default ContractStatusDisplay;
