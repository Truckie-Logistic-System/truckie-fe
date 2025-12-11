import React from 'react';
import { Table, Tag, Button, Space, Avatar, Tooltip } from 'antd';
import { UserOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UserModel } from '../../../../services/user/types';

interface CustomerTableProps {
    data: UserModel[];
    loading: boolean;
    onViewDetails: (customerId: string) => void;
    getStatusColor: (status: string | boolean) => string;
    getStatusText: (status: string | boolean) => string;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
    data,
    loading,
    onViewDetails,
    getStatusColor,
    getStatusText,
}) => {
    const columns: ColumnsType<UserModel> = [
        {
            title: 'Khách hàng',
            key: 'customer',
            width: 250,
            render: (_, record) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        size={40}
                        src={record.imageUrl}
                        icon={<UserOutlined />}
                        className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                            {record.fullName}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                            {record.username}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (email: string) => (
                <Tooltip placement="topLeft" title={email}>
                    {email}
                </Tooltip>
            ),
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            width: 120,
            render: (phone: string) => phone || 'N/A',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (address: string) => (
                <Tooltip placement="topLeft" title={address}>
                    {address || 'N/A'}
                </Tooltip>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string | boolean) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            ),
            filters: [
                {
                    text: 'Hoạt động',
                    value: 'active',
                },
                {
                    text: 'Không hoạt động',
                    value: 'inactive',
                },
                {
                    text: 'Bị cấm',
                    value: 'banned',
                },
            ],
            onFilter: (value: any, record: UserModel) => {
                return record.status?.toString().toLowerCase() === value;
            },
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 100,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => onViewDetails(record.id)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="id"
            pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                    `Hiển thị ${range[0]}-${range[1]} của ${total} khách hàng`,
                defaultPageSize: 10,
                pageSizeOptions: ['10', '20', '50', '100'],
            }}
            scroll={{
                x: 1000,
                y: 'calc(100vh - 400px)',
            }}
            className="shadow-sm"
        />
    );
};

export default CustomerTable;
