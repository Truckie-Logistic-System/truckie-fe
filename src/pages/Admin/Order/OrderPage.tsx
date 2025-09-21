import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import OrderList from './components/OrderList';
import orderService from '@/services/order/orderService';
import type { Order } from '@/models';

const OrderPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const navigate = useNavigate();

    // Lấy danh sách đơn hàng khi component mount
    useEffect(() => {
        fetchOrders();
    }, []);

    // Hàm lấy danh sách đơn hàng từ API
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await orderService.getAllOrders();
            setOrders(data);
            setError(null);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError(error as Error);
            message.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý khi click vào nút xem chi tiết
    const handleViewDetails = (orderId: string) => {
        navigate(`/admin/orders/${orderId}`);
    };

    return (
        <OrderList
            orders={orders}
            loading={loading}
            error={error}
            onViewDetails={handleViewDetails}
            onRefresh={fetchOrders}
        />
    );
};

export default OrderPage; 