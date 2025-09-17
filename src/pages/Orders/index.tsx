import React, { useState, useEffect } from "react";
import { OrdersHeader, OrdersContent, OrdersFilter } from "./components";
import orderService from "../../services/order";
import type { Order } from "../../models/Order";
import { Skeleton, Alert, App } from "antd";
import { useAuth } from "../../context";

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { message } = App.useApp();
    const { user } = useAuth();
    const [filters, setFilters] = useState<{
        year?: number;
        quarter?: number;
        status?: string;
        addressId?: string;
    }>({});

    useEffect(() => {
        fetchOrders();
    }, [user]);

    // Apply client-side filtering whenever filters change
    useEffect(() => {
        if (allOrders.length > 0) {
            applyFilters();
        }
    }, [filters, allOrders]);

    const fetchOrders = async () => {
        try {
            setLoading(true);

            // Kiểm tra xem có userId không
            const userId = user?.id || localStorage.getItem('userId');
            if (!userId) {
                throw new Error("Không tìm thấy thông tin người dùng");
            }

            // Always get all orders first
            const data = await orderService.getOrdersByUserId(userId);
            setAllOrders(data);

            // Initially set orders to all orders
            setOrders(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Không thể tải danh sách đơn hàng");
            message.error(err.message || "Không thể tải danh sách đơn hàng");
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    };

    // Apply filters client-side
    const applyFilters = () => {
        let filteredOrders = [...allOrders];

        // Apply year filter
        if (filters.year !== undefined) {
            filteredOrders = filteredOrders.filter(order => {
                const createdAt = order.createdAt;
                if (!createdAt) return false;
                const orderDate = new Date(createdAt);
                return orderDate.getFullYear() === filters.year;
            });
        }

        // Apply quarter filter
        if (filters.quarter !== undefined) {
            filteredOrders = filteredOrders.filter(order => {
                const createdAt = order.createdAt;
                if (!createdAt) return false;
                const orderDate = new Date(createdAt);
                const month = orderDate.getMonth() + 1; // getMonth() returns 0-11
                const orderQuarter = Math.ceil(month / 3);
                return orderQuarter === filters.quarter;
            });
        }

        // Apply status filter
        if (filters.status) {
            filteredOrders = filteredOrders.filter(order => order.status === filters.status);
        }

        // Apply addressId filter
        if (filters.addressId) {
            filteredOrders = filteredOrders.filter(order => {
                // Check if the address ID matches either pickup or delivery address
                return (
                    order.pickupAddressId === filters.addressId ||
                    (order.deliveryAddress && order.deliveryAddress.id === filters.addressId)
                );
            });
        }

        setOrders(filteredOrders);
    };

    const handleFilterChange = (newFilters: {
        year?: number;
        quarter?: number;
        status?: string;
        addressId?: string;
    }) => {
        setFilters(newFilters);
    };

    // Handle quick status filter from header
    const handleStatusFilterClick = (status: string) => {
        setFilters(prev => ({
            ...prev,
            status: status || undefined
        }));
    };

    return (
        <>
            <OrdersHeader
                onStatusFilterClick={handleStatusFilterClick}
                activeStatus={filters.status}
            />
            <div className="max-w-6xl mx-auto px-4 py-6">
                <OrdersFilter onFilterChange={handleFilterChange} />

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
            </div>
        </>
    );
};

export default OrdersPage; 