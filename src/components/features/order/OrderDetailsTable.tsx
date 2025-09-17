import React, { useState } from 'react';
import { Card, Table, Button, App } from 'antd';
import { FileTextOutlined, ClockCircleOutlined, CarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import OrderStatusDisplay from './OrderStatusDisplay';
import type { OrderDetail, Order } from '../../../models';
import orderService from '@/services/order/orderService';

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

interface OrderDetailsTableProps {
    orderDetails?: OrderDetail[];
    order?: Order;
    showAssignButton?: boolean;
    onRefresh?: () => void;
    assigningVehicle?: boolean;
}

const OrderDetailsTable: React.FC<OrderDetailsTableProps> = ({
    orderDetails,
    order,
    showAssignButton = false,
    onRefresh,
    assigningVehicle = false
}) => {
    const messageApi = App.useApp().message;
    const [loading, setLoading] = useState<boolean>(false);
    // Nếu có order, lấy orderDetails từ order
    const detailsData = order?.orderDetails || orderDetails || [];

    // Function to handle vehicle assignment for the order
    const handleAssignVehicle = async () => {
        if (!order?.id) {
            messageApi.error('Không tìm thấy ID của đơn hàng');
            return;
        }

        try {
            setLoading(true);
            messageApi.loading('Đang phân công xe...');
            await orderService.updateVehicleAssignmentForOrderDetail(order.id);
            messageApi.success('Đã phân công xe thành công');
            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            messageApi.error('Không thể phân công xe cho đơn hàng');
            console.error('Error assigning vehicle:', error);
        } finally {
            setLoading(false);
        }
    };

    // Format date to Vietnam timezone with hours and minutes
    const formatDateToVNTime = (date: string) => {
        if (!date) return null;
        return dayjs(date).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss');
    };

    // Nếu không có dữ liệu, hiển thị thông báo
    if (detailsData.length === 0) {
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
                <div className="p-4 text-center text-gray-500">
                    Không có thông tin chi tiết vận chuyển
                </div>
            </Card>
        );
    }

    // Định nghĩa các cột cho bảng chi tiết đơn hàng
    const baseColumns = [
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
                    <span>{date ? formatDateToVNTime(date) : 'Chưa bắt đầu'}</span>
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
                    <span>{date ? formatDateToVNTime(date) : 'Chưa kết thúc'}</span>
                </div>
            ),
        },
    ];

    // We no longer need an action column for each row
    // since we're using a single button for the entire order
    const columns = baseColumns;

    return (
        <Card
            title={
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <FileTextOutlined className="mr-2 text-blue-500" />
                        <span>Chi tiết vận chuyển</span>
                    </div>
                    {showAssignButton && order && (
                        <Button
                            type="primary"
                            icon={<CarOutlined />}
                            onClick={handleAssignVehicle}
                            loading={loading || assigningVehicle}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Phân công xe cho đơn
                        </Button>
                    )}
                </div>
            }
            className="shadow-md rounded-xl mb-6"
        >
            <Table
                columns={columns}
                dataSource={detailsData}
                rowKey="id"
                pagination={false}
                className="border rounded-lg overflow-hidden"
                rowClassName="hover:bg-blue-50"
            />
        </Card>
    );
};

export default OrderDetailsTable; 