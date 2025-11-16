import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, App, Tabs, Card, Skeleton, Typography, Timeline } from 'antd';
import { ArrowLeftOutlined, CarOutlined, HistoryOutlined, ToolOutlined, InfoCircleOutlined } from '@ant-design/icons';
import orderService from '@/services/order/orderService';
import type { Order } from '@/models';
import dayjs from 'dayjs';
import {
    OrderStatusCard,
    OrderInfoCard,
    AddressCard,
    SenderInfoCard,
    OrderDetailsTable,
    OrderSizeCard,
    VehicleAssignmentCard
} from '@/components/features/order';
import OrderStatusBreakdown from '@/components/common/OrderStatusBreakdown';

const { TabPane } = Tabs;
const { Title } = Typography;

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const messageApi = App.useApp().message;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>(() => {
        // Restore active tab from sessionStorage on initial load
        return sessionStorage.getItem(`orderDetail_activeTab_${id}`) || "info";
    });

    // Save active tab to sessionStorage whenever it changes
    useEffect(() => {
        if (id) {
            sessionStorage.setItem(`orderDetail_activeTab_${id}`, activeTab);
        }
    }, [activeTab, id]);

    // Hàm lấy thông tin chi tiết đơn hàng từ API
    const fetchOrderDetails = useCallback(async (orderId: string) => {
        setLoading(true);
        try {
            const orderData = await orderService.getOrderById(orderId);
            setOrder(orderData);
        } catch (error) {
            messageApi.error('Không thể tải thông tin đơn hàng');
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        };
    }, [messageApi]);

    // Lấy thông tin đơn hàng khi component mount
    useEffect(() => {
        if (id) {
            fetchOrderDetails(id);
        }
    }, [id, fetchOrderDetails]);

    // Xử lý khi click nút phân công tài xế
    const handleAssignDriver = () => {
        if (!id) return;
        messageApi.info('Tính năng đang được phát triển');
        // Implement driver assignment functionality
    };

    // Render lịch sử đơn hàng
    const renderOrderHistory = () => {
        return (
            <Timeline
                mode="left"
                items={[
                    {
                        label: dayjs().subtract(3, 'day').format('DD/MM/YYYY HH:mm'),
                        children: 'Đơn hàng được tạo',
                        color: 'blue',
                    },
                    {
                        label: dayjs().subtract(2, 'day').format('DD/MM/YYYY HH:mm'),
                        children: 'Đơn hàng được xác nhận',
                        color: 'green',
                    },
                    {
                        label: dayjs().subtract(1, 'day').format('DD/MM/YYYY HH:mm'),
                        children: 'Đã phân công tài xế',
                        color: 'blue',
                    },
                    {
                        label: dayjs().subtract(12, 'hour').format('DD/MM/YYYY HH:mm'),
                        children: 'Đã lấy hàng',
                        color: 'blue',
                    },
                    {
                        label: dayjs().subtract(6, 'hour').format('DD/MM/YYYY HH:mm'),
                        children: 'Đang vận chuyển',
                        color: 'orange',
                    },
                ]}
            />
        );
    };

    // Render công cụ quản lý
    const renderManagementTools = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Quản lý vận chuyển" className="shadow-md">
                    <div className="space-y-4">
                        <Button
                            type="primary"
                            icon={<CarOutlined />}
                            block
                            onClick={handleAssignDriver}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Phân công tài xế
                        </Button>
                        <Button
                            type="default"
                            icon={<ToolOutlined />}
                            block
                            onClick={() => messageApi.info('Tính năng đang được phát triển')}
                        >
                            Cập nhật trạng thái
                        </Button>
                    </div>
                </Card>

                <Card title="Quản lý thanh toán" className="shadow-md">
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="font-medium mb-1">Trạng thái thanh toán</p>
                            <p className="text-blue-600">Chưa thanh toán</p>
                        </div>
                        <Button
                            type="primary"
                            block
                            onClick={() => messageApi.info('Tính năng đang được phát triển')}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Xác nhận thanh toán
                        </Button>
                    </div>
                </Card>
            </div>
        );
    };

    // Render skeleton loading
    const renderSkeletonLoading = () => {
        return (
            <div className="p-6">
                <div className="flex items-center mb-6">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/admin/orders')}
                        className="mr-4"
                    >
                        Quay lại
                    </Button>
                    <Skeleton.Input style={{ width: 300 }} active size="large" />
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="mb-4 md:mb-0">
                            <Skeleton.Input style={{ width: 120 }} active size="small" className="mb-2" />
                            <Skeleton.Input style={{ width: 200 }} active size="default" />
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                            <Skeleton.Input style={{ width: 100 }} active size="default" />
                            <Skeleton.Input style={{ width: 100 }} active size="default" />
                            <Skeleton.Input style={{ width: 100 }} active size="default" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md mb-6">
                    <div className="p-4 border-b">
                        <Skeleton.Input style={{ width: 200 }} active size="default" />
                    </div>
                    <div className="p-6">
                        <Skeleton active paragraph={{ rows: 8 }} />
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return renderSkeletonLoading();
    }

    if (!order) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                    <h2 className="text-xl font-semibold mb-2">Không tìm thấy đơn hàng</h2>
                    <p className="text-gray-500 mb-4">Đơn hàng không tồn tại hoặc đã bị xóa</p>
                    <Button type="primary" onClick={() => navigate('/admin/orders')} className="bg-blue-600 hover:bg-blue-700">
                        Quay lại danh sách đơn hàng
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header section */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                    <div className="mb-4 md:mb-0">
                        <div className="flex items-center">
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate('/admin/orders')}
                                className="mr-4"
                            >
                                Quay lại
                            </Button>
                            <Title level={2} className="m-0">Quản lý đơn hàng</Title>
                        </div>
                        <p className="text-gray-500 mt-1">Mã đơn hàng: {order.orderCode}</p>
                    </div>
                </div>
            </div>

            {/* Rest of the content */}
            <div className="max-w-full">
                {/* Order Status Card */}
                <OrderStatusCard order={order} />

                {/* Order Status Breakdown - Show detailed breakdown if order has multiple details */}
                {order && order.orderDetails && order.orderDetails.length > 0 && (
                    <div className="mb-6">
                        <OrderStatusBreakdown 
                            orderDetails={order.orderDetails}
                            currentOrderStatus={order.status}
                            showExplanation={true}
                            showWarning={true}
                        />
                    </div>
                )}

                {/* Admin Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-6">
                    <Tabs
                        defaultActiveKey="info"
                        onChange={setActiveTab}
                        type="card"
                        className="order-detail-tabs"
                    >
                        <TabPane
                            tab={
                                <span>
                                    <InfoCircleOutlined /> Thông tin đơn hàng
                                </span>
                            }
                            key="info"
                        >
                            {activeTab === "info" && (
                                <>
                                    {/* Order Information Card */}
                                    <OrderInfoCard order={order} />

                                    {/* Address Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Pickup Address */}
                                        {order.pickupAddress && (
                                            <AddressCard
                                                address={order.pickupAddress}
                                                title="Địa chỉ lấy hàng"
                                                isPickup={true}
                                            />
                                        )}

                                        {/* Delivery Address */}
                                        {order.deliveryAddress && (
                                            <AddressCard
                                                address={order.deliveryAddress}
                                                title="Địa chỉ giao hàng"
                                                isPickup={false}
                                            />
                                        )}
                                    </div>

                                    {/* Sender Information */}
                                    {order.sender && (
                                        <SenderInfoCard order={order} />
                                    )}

                                    {/* Chi tiết vận chuyển */}
                                    {order.orderDetails && order.orderDetails.length > 0 && (
                                        <OrderDetailsTable
                                            order={order}
                                            showAssignButton={true}
                                            onRefresh={() => fetchOrderDetails(id as string)}
                                            assigningVehicle={loading}
                                        />
                                    )}

                                    {/* Order Size Information */}
                                    {order.orderDetails && order.orderDetails.length > 0 && order.orderDetails[0].orderSizeId && (
                                        <OrderSizeCard order={order} />
                                    )}

                                    {/* Vehicle Assignment Information */}
                                    {order.orderDetails && order.orderDetails.length > 0 && order.orderDetails[0].vehicleAssignmentId && (
                                        <VehicleAssignmentCard order={order} onAssignDriver={handleAssignDriver} />
                                    )}
                                </>
                            )}
                        </TabPane>
                        <TabPane
                            tab={
                                <span>
                                    <HistoryOutlined /> Lịch sử đơn hàng
                                </span>
                            }
                            key="history"
                        >
                            {activeTab === "history" && (
                                <Card className="shadow-md rounded-xl mb-6">
                                    <div className="p-4">
                                        {renderOrderHistory()}
                                    </div>
                                </Card>
                            )}
                        </TabPane>
                        <TabPane
                            tab={
                                <span>
                                    <ToolOutlined /> Công cụ quản lý
                                </span>
                            }
                            key="management"
                        >
                            {activeTab === "management" && renderManagementTools()}
                        </TabPane>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage; 