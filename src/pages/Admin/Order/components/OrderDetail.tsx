import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Skeleton, message, Tag, Divider, Table, Timeline, Modal } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import orderService from '@/services/order/orderService';
import type { Order, OrderDetail, OrderStatus } from '@/models';
import dayjs from 'dayjs';

const { confirm } = Modal;

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
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
            const [orderData, detailsData] = await Promise.all([
                orderService.getOrderById(orderId),
                orderService.getOrderDetailsByOrderId(orderId)
            ]);

            setOrder(orderData);
            setOrderDetails(detailsData);
        } catch (error) {
            message.error('Không thể tải thông tin đơn hàng');
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
                    message.success('Đơn hàng đã được xóa thành công');
                    navigate('/admin/orders');
                } catch (error) {
                    message.error('Không thể xóa đơn hàng');
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

    // Định nghĩa các cột cho bảng chi tiết đơn hàng
    const orderDetailColumns = [
        {
            title: 'Mã theo dõi',
            dataIndex: 'trackingCode',
            key: 'trackingCode',
        },
        {
            title: 'Khối lượng',
            dataIndex: 'weight',
            key: 'weight',
            render: (weight: number) => `${weight} kg`,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (description: string) => description || 'Không có mô tả',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => renderOrderStatus(status),
        },
        {
            title: 'Thời gian bắt đầu',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Chưa bắt đầu',
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Chưa kết thúc',
        },
    ];

    // Render trạng thái đơn hàng
    const renderOrderStatus = (status: string) => {
        let color = 'default';
        let label = status;

        switch (status) {
            // Trạng thái ban đầu
            case 'PENDING':
                color = 'orange';
                label = 'Chờ xử lý';
                break;
            case 'PROCESSING':
                color = 'blue';
                label = 'Đang xử lý';
                break;
            case 'CANCELLED':
                color = 'red';
                label = 'Đã hủy';
                break;

            // Trạng thái hợp đồng
            case 'CONTRACT_DRAFT':
                color = 'cyan';
                label = 'Bản nháp hợp đồng';
                break;
            case 'CONTRACT_DENIED':
                color = 'red';
                label = 'Hợp đồng bị từ chối';
                break;
            case 'CONTRACT_SIGNED':
                color = 'green';
                label = 'Hợp đồng đã ký';
                break;

            // Trạng thái lập kế hoạch và phân công
            case 'ON_PLANNING':
                color = 'purple';
                label = 'Đang lập kế hoạch';
                break;
            case 'ASSIGNED_TO_DRIVER':
                color = 'geekblue';
                label = 'Đã phân công cho tài xế';
                break;
            case 'DRIVER_CONFIRM':
                color = 'blue';
                label = 'Tài xế đã xác nhận';
                break;

            // Trạng thái vận chuyển
            case 'PICKED_UP':
                color = 'cyan';
                label = 'Đã lấy hàng';
                break;
            case 'SEALED_COMPLETED':
                color = 'cyan';
                label = 'Đã niêm phong';
                break;
            case 'ON_DELIVERED':
                color = 'blue';
                label = 'Đang vận chuyển';
                break;
            case 'ONGOING_DELIVERED':
                color = 'blue';
                label = 'Đang giao hàng';
                break;
            case 'IN_DELIVERED':
                color = 'blue';
                label = 'Đang giao hàng';
                break;

            // Trạng thái vấn đề
            case 'IN_TROUBLES':
                color = 'red';
                label = 'Gặp sự cố';
                break;
            case 'RESOLVED':
                color = 'green';
                label = 'Đã giải quyết';
                break;
            case 'COMPENSATION':
                color = 'orange';
                label = 'Đang bồi thường';
                break;

            // Trạng thái hoàn thành
            case 'DELIVERED':
                color = 'green';
                label = 'Đã giao hàng';
                break;
            case 'SUCCESSFUL':
                color = 'green';
                label = 'Hoàn thành';
                break;

            // Trạng thái từ chối và hoàn trả
            case 'REJECT_ORDER':
                color = 'red';
                label = 'Đơn hàng bị từ chối';
                break;
            case 'RETURNING':
                color = 'orange';
                label = 'Đang hoàn trả';
                break;
            case 'RETURNED':
                color = 'volcano';
                label = 'Đã hoàn trả';
                break;

            default:
                color = 'default';
                label = status;
        }

        return <Tag color={color}>{label}</Tag>;
    };

    if (loading) {
        return (
            <div className="p-6">
                {/* Header skeleton */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <Skeleton.Button active size="large" shape="round" className="mr-4" />
                        <Skeleton.Input active size="large" style={{ width: 200 }} />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton.Button active size="default" shape="round" />
                        <Skeleton.Button active size="default" shape="round" />
                    </div>
                </div>

                {/* Order info skeleton */}
                <Card className="shadow-md mb-4">
                    <Skeleton active paragraph={{ rows: 6 }} />
                </Card>

                {/* Order details skeleton */}
                <Card className="shadow-md">
                    <Skeleton active paragraph={{ rows: 6 }} />
                </Card>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-6">
                <Card>
                    <div className="text-center py-8">
                        <h2 className="text-xl font-semibold mb-2">Không tìm thấy đơn hàng</h2>
                        <p className="text-gray-500 mb-4">Đơn hàng không tồn tại hoặc đã bị xóa</p>
                        <Button type="primary" onClick={() => navigate('/admin/orders')}>
                            Quay lại danh sách đơn hàng
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-4 flex justify-between items-center">
                <Button
                    type="default"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/admin/orders')}
                >
                    Quay lại danh sách
                </Button>
                <div>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                        className="mr-2"
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

            <Card title={`Chi tiết đơn hàng: ${order.orderCode}`} className="shadow-md mb-4">
                <Descriptions bordered column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}>
                    <Descriptions.Item label="Mã đơn hàng">{order.orderCode}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">{renderOrderStatus(order.status)}</Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                    <Descriptions.Item label="Người nhận">{order.receiverName}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{order.receiverPhone}</Descriptions.Item>
                    <Descriptions.Item label="Tổng khối lượng">{order.totalWeight} kg</Descriptions.Item>
                    <Descriptions.Item label="Tổng số lượng">{order.totalQuantity}</Descriptions.Item>
                    <Descriptions.Item label="Tổng tiền">{(order.totalPrice !== null && order.totalPrice !== undefined) ? order.totalPrice.toLocaleString('vi-VN') : '0'} VNĐ</Descriptions.Item>
                    <Descriptions.Item label="Mô tả gói hàng">{order.packageDescription || 'Không có mô tả'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú" span={3}>{order.notes || 'Không có ghi chú'}</Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="Chi tiết vận chuyển" className="shadow-md">
                <Table
                    columns={orderDetailColumns}
                    dataSource={orderDetails}
                    rowKey="trackingCode"
                    pagination={false}
                />
            </Card>
        </div>
    );
};

export default OrderDetailPage; 