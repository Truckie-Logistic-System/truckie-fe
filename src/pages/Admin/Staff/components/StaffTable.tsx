import React from 'react';
import { Table, Button, Space, Avatar, Tooltip, Skeleton, Tag } from 'antd';
import { EyeOutlined, SwapOutlined, TeamOutlined, PhoneOutlined, MailOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import type { UserModel } from '../../../../services/user/types';

interface StaffTableProps {
    data: UserModel[];
    loading: boolean;
    onViewDetails: (staffId: string) => void;
    onStatusChange: (staff: UserModel) => void;
}

const StaffTable: React.FC<StaffTableProps> = ({
    data,
    loading,
    onViewDetails,
    onStatusChange
}) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'green';
            case 'banned': return 'red';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return 'Hoạt động';
            case 'banned': return 'Bị cấm';
            default: return status;
        }
    };

    const columns = [
        {
            title: 'Nhân viên',
            key: 'staff',
            render: (record: UserModel) => (
                <div className="flex items-center">
                    <Avatar
                        src={record.imageUrl}
                        size={40}
                        icon={<TeamOutlined />}
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
            render: (record: UserModel) => (
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
            render: (status: string) => {
                const color = getStatusColor(status);
                const text = getStatusText(status);
                const isActive = status.toLowerCase() === 'active';

                return (
                    <Tag
                        color={color}
                        className="px-3 py-1 text-sm"
                        icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
                    >
                        {text}
                    </Tag>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (record: UserModel) => (
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
                        className={record.status.toLowerCase() === 'active' ? 'border-red-400 text-red-500 hover:text-red-600 hover:border-red-500' : 'border-green-400 text-green-500 hover:text-green-600 hover:border-green-500'}
                    >
                        {record.status.toLowerCase() === 'active' ? 'Cấm' : 'Kích hoạt'}
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
                showTotal: (total) => `Tổng ${total} nhân viên`
            }}
            loading={{
                spinning: loading,
                indicator: <></>
            }}
            className="staff-table"
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

export default StaffTable; 