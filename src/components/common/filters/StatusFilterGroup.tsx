import React from 'react';
import { Radio } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { StatusBadge } from '../tags';

export interface StatusFilterOption<T extends string> {
    value: T;
    label: string;
    colorClass: string;
    icon?: React.ReactNode;
    count?: number;
}

interface StatusFilterGroupProps<T extends string> {
    options: StatusFilterOption<T>[];
    value: T | string;
    onChange: (value: T) => void;
    showAll?: boolean;
    allLabel?: string;
    badgeSize?: 'small' | 'default' | 'large';
    className?: string;
    disabled?: boolean;
}

/**
 * Component hiển thị nhóm filter theo trạng thái
 */
function StatusFilterGroup<T extends string>({
    options,
    value,
    onChange,
    showAll = true,
    allLabel = 'Tất cả',
    badgeSize = 'default',
    className,
    disabled,
}: StatusFilterGroupProps<T>) {
    const handleChange = (e: RadioChangeEvent) => {
        onChange(e.target.value as T);
    };

    return (
        <Radio.Group
            value={value}
            onChange={handleChange}
            buttonStyle="solid"
            className={`flex flex-wrap gap-2 ${className || ''}`}
            disabled={disabled}
        >
            {showAll && (
                <Radio.Button value="" className="flex items-center">
                    {allLabel}
                </Radio.Button>
            )}

            {options.map((option) => (
                <Radio.Button
                    key={option.value}
                    value={option.value}
                    className="flex items-center"
                >
                    <StatusBadge
                        status={option.value}
                        colorClass={option.colorClass}
                        label={option.label}
                        icon={option.icon}
                        size={badgeSize}
                    />
                    {option.count !== undefined && (
                        <span className="ml-1 text-xs bg-gray-200 text-gray-700 rounded-full px-1.5 py-0.5">
                            {option.count}
                        </span>
                    )}
                </Radio.Button>
            ))}
        </Radio.Group>
    );
}

export default StatusFilterGroup; 