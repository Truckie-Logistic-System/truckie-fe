import React from 'react';
import { Card } from 'antd';
import { InfoCircleOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import type { Order } from '../../../models';

interface OrderInfoCardProps {
    order: Order;
}

const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ order }) => {
    return (
        <Card
            title={
                <div className="flex items-center">
                    <InfoCircleOutlined className="mr-2 text-blue-500" />
                    <span>Thông tin đơn hàng</span>
                </div>
            }
            className="shadow-md mb-6 rounded-xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                        <UserOutlined className="mr-2 text-blue-500" /> Thông tin người nhận
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="mb-2"><span className="font-medium">Họ tên:</span> {order.receiverName}</p>
                        <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {order.receiverPhone}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                        <FileTextOutlined className="mr-2 text-blue-500" /> Thông tin gói hàng
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="mb-2"><span className="font-medium">Mô tả:</span> {order.packageDescription || 'Không có mô tả'}</p>
                        <p className="mb-2"><span className="font-medium">Số lượng:</span> {order.totalQuantity}</p>
                        {order.totalWeight && (
                            <p className="mb-0"><span className="font-medium">Tổng khối lượng:</span> {order.totalWeight} kg</p>
                        )}
                    </div>
                </div>
            </div>
            {order.notes && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                        <InfoCircleOutlined className="mr-2 text-blue-500" /> Ghi chú
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="mb-0">{order.notes}</p>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default OrderInfoCard; 