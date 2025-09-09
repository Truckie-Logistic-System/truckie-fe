import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, App, Tabs, Timeline, Card, Steps } from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    CarOutlined,
    HistoryOutlined,
    ToolOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import orderService from '@/services/order/orderService';
import type { Order } from '@/models/Order';
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
const { Step } = Steps;

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

    // Xử lý khi click nút cập nhật trạng thái
    const handleUpdateStatus = (status: string) => {
        if (!id) return;
        messageApi.info(`Đã cập nhật trạng thái đơn hàng thành: ${status}`);
        // Implement status update functionality
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

    // Render tiến trình vận chuyển
    const renderDeliveryProgress = () => {
        // Xác định bước hiện tại dựa trên trạng thái đơn hàng
        let currentStep = 0;
        if (order) {
            switch (order.status) {
                case 'PENDING':
                    currentStep = 0;
                    break;
                case 'PROCESSING':
                case 'CONTRACT_DRAFT':
                case 'CONTRACT_SIGNED':
                    currentStep = 1;
                    break;
                case 'ASSIGNED_TO_DRIVER':
                case 'DRIVER_CONFIRM':
                    currentStep = 2;
                    break;
                case 'PICKED_UP':
                case 'SEALED_COMPLETED':
                case 'ON_DELIVERED':
                    currentStep = 3;
                    break;
                case 'DELIVERED':
                case 'SUCCESSFUL':
                    currentStep = 4;
                    break;
                default:
                    currentStep = 0;
            }
        }

        return (
            <Card className="shadow-md rounded-xl mb-6">
                <div className="p-4">
                    <Steps
                        current={currentStep}
                        items={[
                            {
                                title: 'Đơn hàng mới',
                                description: 'Đơn hàng đã được tạo',
                            },
                            {
                                title: 'Xác nhận',
                                description: 'Đơn hàng được xác nhận',
                            },
                            {
                                title: 'Phân công',
                                description: 'Đã phân công tài xế',
                            },
                            {
                                title: 'Vận chuyển',
                                description: 'Đang vận chuyển',
                            },
                            {
                                title: 'Hoàn thành',
                                description: 'Giao hàng thành công',
                            },
                        ]}
                    />
                </div>
            </Card>
        );
    };

    // Render công cụ quản lý cho nhân viên
    const renderStaffTools = () => {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Cập nhật trạng thái" className="shadow-md">
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="font-medium mb-1">Trạng thái hiện tại</p>
                            <p className="text-blue-600">{order?.status || 'Chưa xác định'}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleUpdateStatus('DELIVERED')}
                            >
                                Xác nhận đã giao hàng
                            </Button>
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                onClick={() => handleUpdateStatus('IN_TROUBLES')}
                            >
                                Báo cáo sự cố
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card title="Thông tin liên hệ" className="shadow-md">
                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-medium mb-1">Người nhận</p>
                            <p>{order?.receiverName || 'Không có thông tin'}</p>
                            <p>{order?.receiverPhone || 'Không có số điện thoại'}</p>
                        </div>
                        <Button
                            type="primary"
                            block
                            onClick={() => messageApi.info('Tính năng đang được phát triển')}
                        >
                            Liên hệ khách hàng
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
                    <Button type="primary" onClick={() => navigate('/staff/orders')}>
                        Quay lại danh sách đơn hàng
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header section with gradient background */}
            <div className="bg-gradient-to-r from-blue-600 to-teal-500 text-white">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="mb-4 md:mb-0">
                            <div className="flex items-center">
                                <Button
                                    type="default"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate('/staff/orders')}
                                    className="mr-2 bg-white"
                                >
                                    Quay lại
                                </Button>
                                <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
                            </div>
                            <p className="text-blue-100 mt-1">Mã đơn hàng: {order.orderCode}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="primary"
                                icon={<CarOutlined />}
                                onClick={() => messageApi.info('Tính năng đang được phát triển')}
                            >
                                Theo dõi vận chuyển
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rest of the content */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Order Status Card */}
                <OrderStatusCard order={order} />

                {/* Delivery Progress */}
                {renderDeliveryProgress()}

                {/* Staff Tabs */}
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
                                    <ToolOutlined /> Công cụ hỗ trợ
                                </span>
                            }
                            key="tools"
                        >
                            {activeTab === "tools" && renderStaffTools()}
                        </TabPane>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage; 