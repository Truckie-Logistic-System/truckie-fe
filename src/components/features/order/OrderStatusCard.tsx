import React from 'react';
import dayjs from 'dayjs';
import OrderStatusDisplay from './OrderStatusDisplay';
import type { Order } from '../../../models';

interface OrderStatusCardProps {
    order: Order;
}

const OrderStatusCard: React.FC<OrderStatusCardProps> = ({ order }) => {
    return (
        <div className="mb-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-4 md:mb-0">
                        <p className="text-gray-500 mb-1">Trạng thái đơn hàng</p>
                        <div className="flex items-center">
                            <OrderStatusDisplay status={order.status} />
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="text-center px-4">
                            <p className="text-gray-500 text-sm">Mã đơn hàng</p>
                            <p className="font-semibold text-lg">{order.orderCode}</p>
                        </div>
                        {order.createdAt && (
                            <div className="text-center px-4 border-l border-gray-200">
                                <p className="text-gray-500 text-sm">Ngày tạo</p>
                                <p className="font-semibold">{dayjs(order.createdAt).format('DD/MM/YYYY')}</p>
                            </div>
                        )}
                        <div className="text-center px-4 border-l border-gray-200">
                            <p className="text-gray-500 text-sm">Tổng tiền</p>
                            <p className="font-semibold text-lg text-blue-600">
                                {(order.totalPrice !== null && order.totalPrice !== undefined) ? order.totalPrice.toLocaleString('vi-VN') : '0'} VNĐ
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderStatusCard; 