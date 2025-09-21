import React, { useState } from 'react';
import { Table, Space, Button, Input, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { OrderStatusTag } from '../../../../components/common';
import { OrderStatusFilter } from '../../../../components/features/order';
import { getOrderStatusColumn } from '../../../../components/features/order/OrderStatusColumn';
import { OrderStatusEnum } from '../../../../constants/enums';

interface OrderTableProps {
    loading: boolean;
    dataSource: any[];
    pagination: TableProps<any>['pagination'];
    onChange: TableProps<any>['onChange'];
}

const OrderTable: React.FC<OrderTableProps> = ({
    loading,
    dataSource,
    pagination,
    onChange,
}) => {
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Example columns for the order table
    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'orderCode',
            key: 'orderCode',
            render: (text: string) => <span className="font-medium">{text}</span>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
        },
        getOrderStatusColumn(),
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button type="link" size="small">
                        Chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    const handleSearch = (value: string) => {
        setSearchText(value);
        // Implement search logic here
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        // Implement status filter logic here
    };

    return (
        <div>
            <Row gutter={16} className="mb-4">
                <Col span={8}>
                    <Input
                        placeholder="Tìm kiếm đơn hàng"
                        prefix={<SearchOutlined />}
                        onChange={(e) => handleSearch(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col span={6}>
                    <OrderStatusFilter
                        value={statusFilter}
                        onChange={handleStatusFilter}
                        style={{ width: '100%' }}
                    />
                </Col>
            </Row>

            <Table
                loading={loading}
                columns={columns}
                dataSource={dataSource}
                rowKey="id"
                pagination={pagination}
                onChange={onChange}
            />
        </div>
    );
};

export default OrderTable; 