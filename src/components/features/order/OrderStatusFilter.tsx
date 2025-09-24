import React from 'react';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { OrderStatusEnum, OrderStatusLabels } from '../../../constants/enums';
import { enumToSelectOptions } from '../../../utils/enumUtils';

interface OrderStatusFilterProps extends Omit<SelectProps, 'options'> {
    showAll?: boolean;
    placeholder?: string;
    allowClear?: boolean;
    className?: string;
}

/**
 * A Select component for filtering by order status
 */
const OrderStatusFilter: React.FC<OrderStatusFilterProps> = ({
    showAll = true,
    placeholder = 'Lọc theo trạng thái',
    allowClear = true,
    className,
    ...props
}) => {
    const options = React.useMemo(() => {
        const statusOptions = enumToSelectOptions(OrderStatusEnum, OrderStatusLabels) || [];
        return showAll
            ? [{ label: 'Tất cả', value: '' }, ...statusOptions]
            : statusOptions;
    }, [showAll]);

    return (
        <Select
            placeholder={placeholder}
            allowClear={allowClear}
            className={className}
            options={options}
            {...props}
        />
    );
};

export default OrderStatusFilter; 