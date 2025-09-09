import React from 'react';
import { Card, Table } from 'antd';
import { FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import OrderStatusDisplay from './OrderStatusDisplay';
import type { OrderDetail } from '../../../models';

interface OrderDetailsTableProps {
    orderDetails: OrderDetail[];
}

const OrderDetailsTable: React.FC<OrderDetailsTableProps> = ({ orderDetails }) => {
    // Định nghĩa các cột cho bảng chi tiết đơn hàng
    const columns = [
        {
            title: 'Mã theo dõi',
            dataIndex: 'trackingCode',
            key: 'trackingCode',
            render: (text: string) => (
                <span className="font-medium text-blue-600">{text}</span>
            ),
        },
        {
            title: 'Khối lượng',
            dataIndex: 'weight',
            key: 'weight',
            render: (weight: number) => (
                <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <span>{weight} kg</span>
                </div>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (description: string) => description || 'Không có mô tả',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <OrderStatusDisplay status={status} size="small" />,
        },
        {
            title: 'Thời gian bắt đầu',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (date: string) => (
                <div className="flex items-center">
                    <ClockCircleOutlined className="text-blue-500 mr-1" />
                    <span>{date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Chưa bắt đầu'}</span>
                </div>
            ),
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (date: string) => (
                <div className="flex items-center">
                    <ClockCircleOutlined className="text-green-500 mr-1" />
                    <span>{date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Chưa kết thúc'}</span>
                </div>
            ),
        },
    ];

    return (
        <Card
            title={
                <div className="flex items-center">
                    <FileTextOutlined className="mr-2 text-blue-500" />
                    <span>Chi tiết vận chuyển</span>
                </div>
            }
            className="shadow-md rounded-xl mb-6"
        >
            <Table
                columns={columns}
                dataSource={orderDetails}
                rowKey="trackingCode"
                pagination={false}
                className="border rounded-lg overflow-hidden"
                rowClassName="hover:bg-blue-50"
            />
        </Card>
    );
};

export default OrderDetailsTable; 