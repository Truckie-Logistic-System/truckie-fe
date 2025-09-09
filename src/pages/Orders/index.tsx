import React, { useState, useEffect } from "react";
import { OrdersHeader, OrdersContent } from "./components";
import orderService from "../../services/order";
import type { Order } from "../../models/Order";
import { Skeleton, Alert } from "antd";

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
                <div className="p-6">
                    <div className="mb-6">
                        <Skeleton.Input active size="large" style={{ width: '40%' }} />
                        <div className="mt-2">
                            <Skeleton.Input active size="small" style={{ width: '60%' }} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Skeleton.Avatar active size="large" shape="circle" />
                                            <div className="w-full">
                                                <Skeleton.Input active style={{ width: '60%' }} />
                                                <div className="mt-2">
                                                    <Skeleton.Input active size="small" style={{ width: '40%' }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Skeleton active paragraph={{ rows: 2 }} />
                                            <Skeleton active paragraph={{ rows: 2 }} />
                                        </div>
                                    </div>
                                    <Skeleton.Button active shape="round" />
                                </div>
                            </div>
                        ))}
                    </div>
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