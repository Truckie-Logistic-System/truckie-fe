import React from 'react';
import { Table, Button, Space, Avatar, Tooltip, Skeleton, Tag } from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    EyeOutlined,
    SwapOutlined,
    CheckCircleOutlined,
    ShopOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CustomerModel } from '@/models/Customer';
import { UserStatusEnum } from '@/constants/enums';
import { UserStatusTag } from '@/components/common/tags';

interface CustomerTableProps {
    data: CustomerModel[];
    loading: boolean;
    onViewDetails: (id: string) => void;
    onStatusChange: (customer: CustomerModel) => void;
    getStatusColor: (status: string) => string;
    getStatusText: (status: string) => string;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
    data,
    loading,
    onViewDetails,
    onStatusChange,
    getStatusColor,
    getStatusText
}) => {
    const columns = [
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (record: CustomerModel) => (
                <div className="flex items-center">
                    <Avatar
                        src={record.imageUrl}
                        size={40}
                        icon={<ShopOutlined />}
                        className="mr-3 bg-blue-100"
                    />
                    <div>
                        <div className="font-medium">{record.fullName}</div>
                        <div className="text-xs text-gray-500">ID: {record.id.substring(0, 8)}...</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Thông tin liên hệ',
            key: 'contact',
            render: (record: CustomerModel) => (
                <div>
                    <div className="flex items-center mb-1">
                        <MailOutlined className="text-gray-500 mr-2" />
                        <span>{record.email}</span>
                    </div>
                    <div className="flex items-center">
                        <PhoneOutlined className="text-gray-500 mr-2" />
                        <span>{record.phoneNumber}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Tên đăng nhập',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <UserStatusTag status={status as UserStatusEnum} />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (record: CustomerModel) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => onViewDetails(record.id)}
                        className="bg-blue-500 hover:bg-blue-600"
                    >
                        Chi tiết
                    </Button>
                    <Button
                        icon={<SwapOutlined />}
                        onClick={() => onStatusChange(record)}
                        className={record.status.toLowerCase() === 'active' ? 'border-gray-400 text-gray-600 hover:text-gray-700 hover:border-gray-500' : 'border-green-400 text-green-500 hover:text-green-600 hover:border-green-500'}
                    >
                        {record.status.toLowerCase() === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={loading ? [] : data}
            rowKey="id"
            pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Tổng ${total} khách hàng`
            }}
            loading={{
                spinning: loading,
                indicator: <></>
            }}
            className="customer-table"
            rowClassName="hover:bg-blue-50 transition-colors"
            locale={{
                emptyText: loading ? (
                    <div className="py-5">
                        <Skeleton active paragraph={{ rows: 5 }} />
                    </div>
                ) : 'Không có dữ liệu'
            }}
        />
    );
};

export default CustomerTable; 