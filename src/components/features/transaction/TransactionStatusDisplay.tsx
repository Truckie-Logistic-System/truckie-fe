import React from 'react';
import { TransactionEnum } from '@/constants/enums';
import { TransactionStatusTag } from '@/components/common/tags';

interface TransactionStatusDisplayProps {
    status: string;
    showGradient?: boolean;
    size?: 'small' | 'default' | 'large';
}

const TransactionStatusDisplay: React.FC<TransactionStatusDisplayProps> = ({
    status,
    showGradient = true,
    size = 'default'
}) => {
    let bgColor = '';

    switch (status) {
        // Chờ thanh toán
        case 'PENDING':
            bgColor = 'bg-gradient-to-r from-yellow-500 to-orange-500';
            break;
        case 'PAID':
            bgColor = 'bg-gradient-to-r from-emerald-500 to-green-500';
            break;
        case 'DEPOSITED':
            bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
            break;

        // Lỗi/Hủy
        case 'FAILED':
            bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
            break;
        case 'CANCELLED':
            bgColor = 'bg-gradient-to-r from-gray-500 to-slate-500';
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

    return <TransactionStatusTag status={status as TransactionEnum} size={size} />;
};

export default TransactionStatusDisplay;
