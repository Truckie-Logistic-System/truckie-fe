import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Skeleton, Tag, Divider, Table, Timeline, Modal, App } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined, EnvironmentOutlined, PhoneOutlined, UserOutlined, ClockCircleOutlined, FileTextOutlined, DollarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import orderService from '../../services/order/orderService';
import type { Order, OrderDetail, OrderStatus } from '../../models';
import dayjs from 'dayjs';

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

    // Định nghĩa các cột cho bảng chi tiết đơn hàng
    const orderDetailColumns = [
        {
            title: 'Mã theo dõi',
            dataIndex: 'trackingCode',
            key: 'trackingCode',
            render: (text: string) => (
                <span className="font-medium text-blue-600">{text}</span>
            ),
        },
        {
            title: 'Khối lượng',
            dataIndex: 'weight',
            key: 'weight',
            render: (weight: number) => (
                <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <span>{weight} kg</span>
                </div>
            ),
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
            render: (date: string) => (
                <div className="flex items-center">
                    <ClockCircleOutlined className="text-blue-500 mr-1" />
                    <span>{date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Chưa bắt đầu'}</span>
                </div>
            ),
        },
        {
            title: 'Thời gian kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (date: string) => (
                <div className="flex items-center">
                    <ClockCircleOutlined className="text-green-500 mr-1" />
                    <span>{date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Chưa kết thúc'}</span>
                </div>
            ),
        },
    ];

    // Render trạng thái đơn hàng
    const renderOrderStatus = (status: string) => {
        let color = 'default';
        let label = status;
        let bgColor = '';

        switch (status) {
            // Trạng thái ban đầu
            case 'PENDING':
                color = 'orange';
                bgColor = 'bg-gradient-to-r from-yellow-500 to-orange-500';
                label = 'Chờ xử lý';
                break;
            case 'PROCESSING':
                color = 'blue';
                bgColor = 'bg-gradient-to-r from-blue-400 to-blue-500';
                label = 'Đang xử lý';
                break;
            case 'CANCELLED':
                color = 'red';
                bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
                label = 'Đã hủy';
                break;

            // Trạng thái hợp đồng
            case 'CONTRACT_DRAFT':
                color = 'cyan';
                bgColor = 'bg-gradient-to-r from-cyan-500 to-blue-400';
                label = 'Bản nháp hợp đồng';
                break;
            case 'CONTRACT_DENIED':
                color = 'red';
                bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
                label = 'Hợp đồng bị từ chối';
                break;
            case 'CONTRACT_SIGNED':
                color = 'green';
                bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
                label = 'Hợp đồng đã ký';
                break;

            // Trạng thái lập kế hoạch và phân công
            case 'ON_PLANNING':
                color = 'purple';
                bgColor = 'bg-gradient-to-r from-purple-500 to-indigo-500';
                label = 'Đang lập kế hoạch';
                break;
            case 'ASSIGNED_TO_DRIVER':
                color = 'geekblue';
                bgColor = 'bg-gradient-to-r from-blue-500 to-indigo-500';
                label = 'Đã phân công cho tài xế';
                break;
            case 'DRIVER_CONFIRM':
                color = 'blue';
                bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
                label = 'Tài xế đã xác nhận';
                break;

            // Trạng thái vận chuyển
            case 'PICKED_UP':
                color = 'cyan';
                bgColor = 'bg-gradient-to-r from-cyan-500 to-blue-500';
                label = 'Đã lấy hàng';
                break;
            case 'SEALED_COMPLETED':
                color = 'cyan';
                bgColor = 'bg-gradient-to-r from-cyan-500 to-blue-500';
                label = 'Đã niêm phong';
                break;
            case 'ON_DELIVERED':
                color = 'blue';
                bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
                label = 'Đang vận chuyển';
                break;
            case 'ONGOING_DELIVERED':
                color = 'blue';
                bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
                label = 'Đang giao hàng';
                break;
            case 'IN_DELIVERED':
                color = 'blue';
                bgColor = 'bg-gradient-to-r from-blue-500 to-cyan-500';
                label = 'Đang giao hàng';
                break;

            // Trạng thái vấn đề
            case 'IN_TROUBLES':
                color = 'red';
                bgColor = 'bg-gradient-to-r from-red-600 to-orange-500';
                label = 'Gặp sự cố';
                break;
            case 'RESOLVED':
                color = 'green';
                bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
                label = 'Đã giải quyết';
                break;
            case 'COMPENSATION':
                color = 'orange';
                bgColor = 'bg-gradient-to-r from-orange-500 to-amber-500';
                label = 'Đang bồi thường';
                break;

            // Trạng thái hoàn thành
            case 'DELIVERED':
                color = 'green';
                bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
                label = 'Đã giao hàng';
                break;
            case 'SUCCESSFUL':
                color = 'green';
                bgColor = 'bg-gradient-to-r from-green-500 to-emerald-500';
                label = 'Hoàn thành';
                break;

            // Trạng thái từ chối và hoàn trả
            case 'REJECT_ORDER':
                color = 'red';
                bgColor = 'bg-gradient-to-r from-red-500 to-pink-500';
                label = 'Đơn hàng bị từ chối';
                break;
            case 'RETURNING':
                color = 'orange';
                bgColor = 'bg-gradient-to-r from-purple-500 to-pink-500';
                label = 'Đang hoàn trả';
                break;
            case 'RETURNED':
                color = 'volcano';
                bgColor = 'bg-gradient-to-r from-purple-500 to-pink-500';
                label = 'Đã hoàn trả';
                break;

            default:
                color = 'default';
                bgColor = 'bg-gradient-to-r from-gray-500 to-slate-500';
                label = status;
        }

        return (
            <div className={`${bgColor} text-white px-4 py-2 rounded-full inline-flex items-center shadow-md`}>
                <span className="font-medium">{label}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-6">
                {/* Header skeleton */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-6">
                    <div className="max-w-6xl mx-auto px-4 py-6">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                            <div className="mb-4 md:mb-0">
                                <Skeleton.Button active size="large" shape="round" className="mr-2" />
                                <Skeleton.Input active size="large" className="bg-opacity-20" style={{ width: 200 }} />
                            </div>
                            <div className="flex gap-3">
                                <Skeleton.Button active size="default" shape="round" />
                                <Skeleton.Button active size="default" shape="round" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order status skeleton */}
                <div className="max-w-6xl mx-auto px-4">
                    <Skeleton active paragraph={{ rows: 1 }} className="mb-6" />

                    {/* Order info skeleton */}
                    <Card className="mb-6">
                        <Skeleton active paragraph={{ rows: 4 }} />
                    </Card>

                    {/* Address skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card>
                            <Skeleton active paragraph={{ rows: 3 }} />
                        </Card>
                        <Card>
                            <Skeleton active paragraph={{ rows: 3 }} />
                        </Card>
                    </div>

                    {/* Sender info skeleton */}
                    <Card className="mb-6">
                        <Skeleton active paragraph={{ rows: 4 }} />
                    </Card>

                    {/* Order details skeleton */}
                    <Card className="mb-6">
                        <Skeleton active paragraph={{ rows: 6 }} />
                    </Card>
                </div>
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
                        <Button type="primary" onClick={() => navigate('/orders')}>
                            Quay lại danh sách đơn hàng
                        </Button>
                    </div>
                </Card>
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
                <div className="mb-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div className="mb-4 md:mb-0">
                                <p className="text-gray-500 mb-1">Trạng thái đơn hàng</p>
                                <div className="flex items-center">
                                    {renderOrderStatus(order.status)}
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

                {/* Order Information Card */}
                <Card
                    title={
                        <div className="flex items-center">
                            <InfoCircleOutlined className="mr-2 text-blue-500" />
                            <span>Thông tin đơn hàng</span>
                        </div>
                    }
                    className="shadow-md mb-6 rounded-xl"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                                <UserOutlined className="mr-2 text-blue-500" /> Thông tin người nhận
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="mb-2"><span className="font-medium">Họ tên:</span> {order.receiverName}</p>
                                <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {order.receiverPhone}</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                                <FileTextOutlined className="mr-2 text-blue-500" /> Thông tin gói hàng
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="mb-2"><span className="font-medium">Mô tả:</span> {order.packageDescription || 'Không có mô tả'}</p>
                                <p className="mb-2"><span className="font-medium">Số lượng:</span> {order.totalQuantity}</p>
                                {order.totalWeight && (
                                    <p className="mb-0"><span className="font-medium">Tổng khối lượng:</span> {order.totalWeight} kg</p>
                                )}
                            </div>
                        </div>
                    </div>
                    {order.notes && (
                        <div className="mt-6">
                            <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                                <InfoCircleOutlined className="mr-2 text-blue-500" /> Ghi chú
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="mb-0">{order.notes}</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Address Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Pickup Address */}
                    {order.pickupAddress && (
                        <Card
                            title={
                                <div className="flex items-center">
                                    <EnvironmentOutlined className="mr-2 text-blue-500" />
                                    <span>Địa chỉ lấy hàng</span>
                                </div>
                            }
                            className="shadow-md rounded-xl h-full"
                        >
                            <div className="flex flex-col h-full">
                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                    <div className="flex items-start">
                                        <EnvironmentOutlined className="text-blue-500 mt-1 mr-3 text-xl" />
                                        <div>
                                            <p className="font-medium text-lg mb-1">{order.pickupAddress.street}</p>
                                            <p className="text-gray-600">{order.pickupAddress.ward}, {order.pickupAddress.province}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-500 mb-1">Vĩ độ</p>
                                            <p className="font-medium">{order.pickupAddress.latitude}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-500 mb-1">Kinh độ</p>
                                            <p className="font-medium">{order.pickupAddress.longitude}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                        <Card
                            title={
                                <div className="flex items-center">
                                    <EnvironmentOutlined className="mr-2 text-red-500" />
                                    <span>Địa chỉ giao hàng</span>
                                </div>
                            }
                            className="shadow-md rounded-xl h-full"
                        >
                            <div className="flex flex-col h-full">
                                <div className="bg-red-50 p-4 rounded-lg mb-4">
                                    <div className="flex items-start">
                                        <EnvironmentOutlined className="text-red-500 mt-1 mr-3 text-xl" />
                                        <div>
                                            <p className="font-medium text-lg mb-1">{order.deliveryAddress.street}</p>
                                            <p className="text-gray-600">{order.deliveryAddress.ward}, {order.deliveryAddress.province}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-500 mb-1">Vĩ độ</p>
                                            <p className="font-medium">{order.deliveryAddress.latitude}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-gray-500 mb-1">Kinh độ</p>
                                            <p className="font-medium">{order.deliveryAddress.longitude}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sender Information */}
                {order.sender && (
                    <Card
                        title={
                            <div className="flex items-center">
                                <UserOutlined className="mr-2 text-green-500" />
                                <span>Thông tin người gửi</span>
                            </div>
                        }
                        className="shadow-md mb-6 rounded-xl"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Company Information */}
                            <div>
                                <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                                    <FileTextOutlined className="mr-2 text-green-500" /> Thông tin doanh nghiệp
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    {order.sender.companyName && (
                                        <p className="mb-2"><span className="font-medium">Tên công ty:</span> {order.sender.companyName}</p>
                                    )}
                                    {order.sender.representativeName && (
                                        <p className="mb-2"><span className="font-medium">Người đại diện:</span> {order.sender.representativeName}</p>
                                    )}
                                    {order.sender.representativePhone && (
                                        <p className="mb-2"><span className="font-medium">SĐT người đại diện:</span> {order.sender.representativePhone}</p>
                                    )}
                                    {order.sender.businessLicenseNumber && (
                                        <p className="mb-2"><span className="font-medium">Số giấy phép kinh doanh:</span> {order.sender.businessLicenseNumber}</p>
                                    )}
                                    {order.sender.businessAddress && (
                                        <p className="mb-0"><span className="font-medium">Địa chỉ kinh doanh:</span> {order.sender.businessAddress}</p>
                                    )}
                                    {!order.sender.companyName && !order.sender.representativeName && !order.sender.businessLicenseNumber && (
                                        <p className="text-gray-500">Không có thông tin doanh nghiệp</p>
                                    )}
                                </div>
                            </div>

                            {/* User Information */}
                            {order.sender.userResponse && (
                                <div>
                                    <h3 className="text-lg font-medium mb-3 text-gray-700 flex items-center">
                                        <UserOutlined className="mr-2 text-green-500" /> Thông tin người dùng
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="mb-2"><span className="font-medium">Tên đầy đủ:</span> {order.sender.userResponse.fullName}</p>
                                        <p className="mb-2"><span className="font-medium">Email:</span> {order.sender.userResponse.email}</p>
                                        <p className="mb-2"><span className="font-medium">Số điện thoại:</span> {order.sender.userResponse.phoneNumber}</p>
                                        <p className="mb-0"><span className="font-medium">Vai trò:</span> {order.sender.userResponse.role.roleName}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Chi tiết vận chuyển */}
                {order.orderDetails && order.orderDetails.length > 0 && (
                    <Card
                        title={
                            <div className="flex items-center">
                                <FileTextOutlined className="mr-2 text-blue-500" />
                                <span>Chi tiết vận chuyển</span>
                            </div>
                        }
                        className="shadow-md rounded-xl mb-6"
                    >
                        <Table
                            columns={orderDetailColumns}
                            dataSource={order.orderDetails}
                            rowKey="trackingCode"
                            pagination={false}
                            className="border rounded-lg overflow-hidden"
                            rowClassName="hover:bg-blue-50"
                        />
                    </Card>
                )}

                {/* Order Size Information */}
                {order.orderDetails && order.orderDetails.length > 0 && order.orderDetails[0].orderSizeId && (
                    <Card
                        title={
                            <div className="flex items-center">
                                <InfoCircleOutlined className="mr-2 text-purple-500" />
                                <span>Thông tin kích thước</span>
                            </div>
                        }
                        className="shadow-md rounded-xl mb-6"
                    >
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <h4 className="text-sm text-gray-500 mb-1">Khối lượng</h4>
                                    <p className="font-medium">
                                        {order.orderDetails[0].orderSizeId.minWeight} - {order.orderDetails[0].orderSizeId.maxWeight} kg
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <h4 className="text-sm text-gray-500 mb-1">Chiều dài</h4>
                                    <p className="font-medium">
                                        {order.orderDetails[0].orderSizeId.minLength} - {order.orderDetails[0].orderSizeId.maxLength} cm
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <h4 className="text-sm text-gray-500 mb-1">Chiều cao</h4>
                                    <p className="font-medium">
                                        {order.orderDetails[0].orderSizeId.minHeight} - {order.orderDetails[0].orderSizeId.maxHeight} cm
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <h4 className="text-sm text-gray-500 mb-1">Chiều rộng</h4>
                                    <p className="font-medium">
                                        {order.orderDetails[0].orderSizeId.minWidth} - {order.orderDetails[0].orderSizeId.maxWidth} cm
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm col-span-1 md:col-span-2">
                                    <h4 className="text-sm text-gray-500 mb-1">Mô tả</h4>
                                    <p className="font-medium">
                                        {order.orderDetails[0].orderSizeId.description || 'Không có mô tả'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Vehicle Assignment Information */}
                {order.orderDetails && order.orderDetails.length > 0 && order.orderDetails[0].vehicleAssignmentId && (
                    <Card
                        title={
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <span>Thông tin phân công</span>
                            </div>
                        }
                        className="shadow-md rounded-xl"
                    >
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <h4 className="text-sm text-gray-500 mb-1">ID phương tiện</h4>
                                    <p className="font-medium">{order.orderDetails[0].vehicleAssignmentId.vehicleId}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <h4 className="text-sm text-gray-500 mb-1">ID tài xế</h4>
                                    <p className="font-medium">{order.orderDetails[0].vehicleAssignmentId.driverId}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <h4 className="text-sm text-gray-500 mb-1">Trạng thái</h4>
                                    <p className="font-medium">{order.orderDetails[0].vehicleAssignmentId.status}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <h4 className="text-sm text-gray-500 mb-1">Mô tả</h4>
                                    <p className="font-medium">{order.orderDetails[0].vehicleAssignmentId.description || 'Không có mô tả'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default OrderDetailPage; 