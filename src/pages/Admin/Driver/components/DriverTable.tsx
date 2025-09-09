import React from 'react';
import { Table, Button, Space, Tag, Avatar, Tooltip } from 'antd';
import { EyeOutlined, SwapOutlined, IdcardOutlined, CarOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import type { DriverModel } from '../../../../services/driver';

interface DriverTableProps {
    data: DriverModel[];
    loading: boolean;
    onViewDetails: (driverId: string) => void;
    onStatusChange: (driver: DriverModel) => void;
}

const DriverTable: React.FC<DriverTableProps> = ({
    data,
    loading,
    onViewDetails,
    onStatusChange
}) => {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'green';
            case 'banned':
                return 'red';
            case 'pending':
                return 'orange';
            case 'inactive':
                return 'gray';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'Hoạt động';
            case 'banned':
                return 'Bị cấm';
            case 'pending':
                return 'Chờ duyệt';
            case 'inactive':
                return 'Không hoạt động';
            default:
                return status;
        }
    };

    const columns = [
        {
            title: 'Tài xế',
            key: 'driver',
            render: (record: DriverModel) => (
                <div className="flex items-center">
                    <Avatar
                        src={record.userResponse.imageUrl}
                        size={40}
                        icon={<IdcardOutlined />}
                        className="mr-3 bg-blue-100"
                    />
                    <div>
                        <div className="font-medium">{record.userResponse.fullName}</div>
                        <div className="text-xs text-gray-500">ID: {record.id.substring(0, 8)}...</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Thông tin liên hệ',
            key: 'contact',
            render: (record: DriverModel) => (
                <div>
                    <div className="flex items-center mb-1">
                        <MailOutlined className="text-gray-500 mr-2" />
                        <span>{record.userResponse.email}</span>
                    </div>
                    <div className="flex items-center">
                        <PhoneOutlined className="text-gray-500 mr-2" />
                        <span>{record.userResponse.phoneNumber}</span>
                    </div>
                </div>
            ),
        },
        {
            title: 'Giấy tờ',
            key: 'documents',
            render: (record: DriverModel) => (
                <div>
                    <div className="flex items-center mb-1">
                        <IdcardOutlined className="text-gray-500 mr-2" />
                        <Tooltip title="CMND/CCCD">
                            <span>{record.identityNumber}</span>
                        </Tooltip>
                    </div>
                    <div className="flex items-center">
                        <CarOutlined className="text-gray-500 mr-2" />
                        <Tooltip title="Giấy phép lái xe">
                            <span>{record.driverLicenseNumber}</span>
                        </Tooltip>
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)} className="px-3 py-1 text-sm">
                    {getStatusText(status)}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: DriverModel) => (
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
            dataSource={data}
            rowKey="id"
            pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Tổng ${total} tài xế`
            }}
            loading={loading}
            className="driver-table"
            rowClassName="hover:bg-blue-50 transition-colors"
        />
    );
};

export default DriverTable; 