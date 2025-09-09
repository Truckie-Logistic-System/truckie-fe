import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, App } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import orderService from '../../services/order/orderService';
import type { Order } from '../../models';
import {
    OrderDetailSkeleton,
    OrderStatusCard,
    OrderInfoCard,
    AddressCard,
    SenderInfoCard,
    OrderDetailsTable,
    OrderSizeCard,
    VehicleAssignmentCard
} from '../../components/features/order';

const { confirm } = Modal;

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const messageApi = App.useApp().message;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

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
                    navigate('/orders');
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
        navigate(`/orders/${id}/edit`);
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
                    <Button type="primary" onClick={() => navigate('/orders')}>
                        Quay lại danh sách đơn hàng
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header section with gradient background */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="mb-4 md:mb-0">
                            <div className="flex items-center">
                                <Button
                                    type="default"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={() => navigate('/orders')}
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
            </div>
        </div>
    );
};

export default OrderDetailPage; 