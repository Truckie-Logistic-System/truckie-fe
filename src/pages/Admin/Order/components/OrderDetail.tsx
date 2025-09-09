import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, App, Tabs, Timeline, Card } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, CarOutlined, HistoryOutlined, ToolOutlined, InfoCircleOutlined } from '@ant-design/icons';
import orderService from '@/services/order/orderService';
import type { Order } from '@/models';
import dayjs from 'dayjs';
import {
    OrderDetailSkeleton,
    OrderStatusCard,
    OrderInfoCard,
    AddressCard,
    SenderInfoCard,
    OrderDetailsTable,
    OrderSizeCard,
    VehicleAssignmentCard
} from '@/components/features/order';

const { confirm } = Modal;
const { TabPane } = Tabs;

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const messageApi = App.useApp().message;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>("info");

    // Lấy thông tin đơn hàng khi component mount
    useEffect(() => {
        if (id) {
            fetchOrderDetails(id);
        }
    }, [id]);

    // Hàm lấy thông tin chi tiết đơn hàng từ API
    const fetchOrderDetails = async (orderId: string) => {
        setLoading(true);
        try {
            const orderData = await orderService.getOrderById(orderId);
            setOrder(orderData);
        } catch (error) {
            messageApi.error('Không thể tải thông tin đơn hàng');
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý khi click nút xóa đơn hàng
    const handleDelete = () => {
        if (!id) return;

        confirm({
            title: 'Xác nhận xóa đơn hàng',
            icon: <ExclamationCircleOutlined />,
            content: 'Bạn có chắc chắn muốn xóa đơn hàng này không? Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await orderService.deleteOrder(id);
                    messageApi.success('Đơn hàng đã được xóa thành công');
                    navigate('/admin/orders');
                } catch (error) {
                    messageApi.error('Không thể xóa đơn hàng');
                    console.error('Error deleting order:', error);
                }
            },
        });
    };

    // Xử lý khi click nút sửa đơn hàng
    const handleEdit = () => {
        if (!id) return;
        navigate(`/admin/orders/${id}/edit`);
    };

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
                        >
                            Xác nhận thanh toán
                        </Button>
                    </div>
                </Card>
            </div>
        );
    };

    if (loading) {
        return <OrderDetailSkeleton />;
    }

    if (!order) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                    <h2 className="text-xl font-semibold mb-2">Không tìm thấy đơn hàng</h2>
                    <p className="text-gray-500 mb-4">Đơn hàng không tồn tại hoặc đã bị xóa</p>
                    <Button type="primary" onClick={() => navigate('/admin/orders')}>
                        Quay lại danh sách đơn hàng
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header section with gradient background */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="mb-4 md:mb-0">
                            <div className="flex items-center">
                                <Button
                                    type="default"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate('/admin/orders')}
                                    className="mr-2 bg-white"
                                >
                                    Quay lại
                                </Button>
                                <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
                            </div>
                            <p className="text-blue-100 mt-1">Mã đơn hàng: {order.orderCode}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={handleEdit}
                            >
                                Chỉnh sửa
                            </Button>
                            <Button
                                type="primary"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={handleDelete}
                            >
                                Xóa
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rest of the content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Order Status Card */}
                <OrderStatusCard order={order} />

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
                                                type="pickup"
                                            />
                                        )}

                                        {/* Delivery Address */}
                                        {order.deliveryAddress && (
                                            <AddressCard
                                                address={order.deliveryAddress}
                                                title="Địa chỉ giao hàng"
                                                type="delivery"
                                            />
                                        )}
                                    </div>

                                    {/* Sender Information */}
                                    {order.sender && (
                                        <SenderInfoCard sender={order.sender} />
                                    )}

                                    {/* Chi tiết vận chuyển */}
                                    {order.orderDetails && order.orderDetails.length > 0 && (
                                        <OrderDetailsTable orderDetails={order.orderDetails} />
                                    )}

                                    {/* Order Size Information */}
                                    {order.orderDetails && order.orderDetails.length > 0 && order.orderDetails[0].orderSizeId && (
                                        <OrderSizeCard orderSize={order.orderDetails[0].orderSizeId} />
                                    )}

                                    {/* Vehicle Assignment Information */}
                                    {order.orderDetails && order.orderDetails.length > 0 && order.orderDetails[0].vehicleAssignmentId && (
                                        <VehicleAssignmentCard vehicleAssignment={order.orderDetails[0].vehicleAssignmentId} />
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