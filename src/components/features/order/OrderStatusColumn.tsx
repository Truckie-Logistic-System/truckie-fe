import React from 'react';
import { OrderStatusTag } from '../../common';
import { OrderStatusEnum, OrderStatusLabels } from '../../../constants/enums';
import { createEnumFilter } from '../../../utils/enumUtils';
import type { TableColumnType } from 'antd';

/**
 * Creates a table column configuration for order status
 * 
 * @returns Column configuration for Ant Design Table
 */
export const getOrderStatusColumn = (): TableColumnType<any> => {
    return {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        filters: createEnumFilter(OrderStatusEnum, OrderStatusLabels),
        onFilter: (value: any, record: any) => record.status === value,
        render: (status: OrderStatusEnum) => <OrderStatusTag status={status} />
    };
};

/**
 * Creates a table column configuration for order status with custom filtering
 * 
 * @param onFilter - Custom filter function
 * @returns Column configuration for Ant Design Table
 */
export const getOrderStatusColumnWithCustomFilter = (
    onFilter: (value: any, record: any) => boolean
): TableColumnType<any> => {
    return {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        filters: createEnumFilter(OrderStatusEnum, OrderStatusLabels),
        onFilter,
        render: (status: OrderStatusEnum) => <OrderStatusTag status={status} />
    };
}; 