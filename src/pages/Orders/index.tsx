import React, { useState, useEffect } from "react";
import { OrdersHeader, OrdersContent } from "./components";
import orderService from "../../services/order";
import type { Order } from "../../models/Order";
import { Spin, Alert } from "antd";

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await orderService.getAllOrders();
                setOrders(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || "Không thể tải danh sách đơn hàng");
                console.error("Error fetching orders:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();

        // Cleanup function to prevent memory leaks
        return () => {
            // Cancel any pending requests if needed
        };
    }, []);

    return (
        <>
            <OrdersHeader />
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spin size="large" tip="Đang tải đơn hàng..." />
                </div>
            ) : error ? (
                <Alert
                    message="Lỗi"
                    description={error}
                    type="error"
                    showIcon
                    className="my-4"
                />
            ) : (
                <OrdersContent orders={orders} />
            )}
        </>
    );
};

export default OrdersPage; 