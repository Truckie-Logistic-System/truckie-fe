import React from 'react';
import type { ReactNode } from 'react';
import { Badge, Tag } from 'antd';
import classNames from 'classnames';

export interface StatusBadgeProps {
    status: string;
    colorClass?: string;
    label?: string;
    icon?: ReactNode;
    className?: string;
    size?: 'small' | 'default' | 'large';
}

/**
 * Một component hiển thị trạng thái với kiểu nhất quán trên toàn ứng dụng
 * 
 * @param status - Giá trị trạng thái
 * @param colorClass - Class màu từ Tailwind CSS (ví dụ: 'bg-green-500 text-white')
 * @param label - Nhãn hiển thị (nếu không cung cấp sẽ hiển thị giá trị status)
 * @param icon - Icon hiển thị bên trái nhãn
 * @param className - Class CSS bổ sung
 * @param size - Kích thước của badge: 'small', 'default', hoặc 'large'
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    colorClass,
    label,
    icon,
    className,
    size = 'default',
}) => {
    // Xác định kích thước dựa trên prop size
    const sizeClasses = {
        small: 'py-0 px-1.5 text-xs',
        default: 'py-1 px-2.5 text-sm',
        large: 'py-1.5 px-3 text-base',
    };

    // Xác định màu dựa vào colorClass
    const getColorFromClass = () => {
        if (!colorClass) return 'default';
        
        if (colorClass.includes('green') || colorClass.includes('emerald')) return 'success';
        if (colorClass.includes('red')) return 'error';
        if (colorClass.includes('yellow') || colorClass.includes('amber') || colorClass.includes('orange')) return 'warning';
        if (colorClass.includes('blue') || colorClass.includes('cyan')) return 'processing';
        if (colorClass.includes('indigo') || colorClass.includes('purple')) return 'purple';
        if (colorClass.includes('gray')) return 'default';
        return 'default';
    };

    const antColor = getColorFromClass();

    // Sử dụng Ant Design Tag cho hiển thị nhất quán
    return (
        <Tag
            color={antColor}
            className={classNames(
                'text-center',
                className
            )}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minWidth: '80px'
            }}
            icon={icon}
        >
            {label || status}
        </Tag>
    );
};

export default StatusBadge; 