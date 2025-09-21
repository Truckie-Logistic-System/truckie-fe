import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Card, Skeleton, message, Row, Col, Typography, Badge, Select } from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    EyeOutlined,
    InboxOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    FileOutlined,
    UserOutlined,
    LockOutlined,
    CarOutlined,
    DollarOutlined,
    RollbackOutlined,
    ShoppingCartOutlined,
    FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import orderService from '@/services/order/orderService';
import type { Order } from '@/models/Order';
import { OrderStatusEnum } from '@/constants/enums';
import dayjs from 'dayjs';
import { DateSelectGroup, OrderStatusTag } from '@/components/common';
import { useMediaQuery } from 'react-responsive';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

const OrderList: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const navigate = useNavigate();

    // Responsive design
    const isMobile = useMediaQuery({ maxWidth: 768 });

    // Lấy danh sách đơn hàng khi component mount
    useEffect(() => {
        fetchOrders();
    }, []);

    // Hàm lấy danh sách đơn hàng từ API
    const fetchOrders = async () => {
        setLoading(true);
        setIsFetching(true);
        try {
            const data = await orderService.getAllOrders();
            setOrders(data);
        } catch (error) {
            message.error('Không thể tải danh sách đơn hàng');
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    };

    // Xử lý khi click vào nút xem chi tiết
    const handleViewDetails = (orderId: string) => {
        navigate(`/staff/orders/${orderId}`);
    };

    // Lọc đơn hàng theo từ khóa tìm kiếm
    const filteredOrders = orders.filter(order => {
        const matchesSearch = (
            order.orderCode.toLowerCase().includes(searchText.toLowerCase()) ||
            order.receiverName.toLowerCase().includes(searchText.toLowerCase()) ||
            order.receiverPhone.toLowerCase().includes(searchText.toLowerCase())
        );

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Thống kê đơn hàng theo trạng thái
    const getOrderStats = () => {
        const pendingOrders = orders.filter(order =>
            [OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING, OrderStatusEnum.CONTRACT_DRAFT].includes(order.status as OrderStatusEnum)).length;

        const inProgressOrders = orders.filter(order =>
            [OrderStatusEnum.ON_PLANNING, OrderStatusEnum.ASSIGNED_TO_DRIVER, OrderStatusEnum.DRIVER_CONFIRM,
            OrderStatusEnum.PICKED_UP, OrderStatusEnum.ON_DELIVERED, OrderStatusEnum.ONGOING_DELIVERED,
            OrderStatusEnum.IN_DELIVERED].includes(order.status as OrderStatusEnum)).length;

        const completedOrders = orders.filter(order =>
            [OrderStatusEnum.DELIVERED, OrderStatusEnum.SUCCESSFUL].includes(order.status as OrderStatusEnum)).length;

        const issueOrders = orders.filter(order =>
            [OrderStatusEnum.CANCELLED, OrderStatusEnum.REJECT_ORDER, OrderStatusEnum.IN_TROUBLES,
            OrderStatusEnum.RETURNING, OrderStatusEnum.RETURNED].includes(order.status as OrderStatusEnum)).length;

        return { pendingOrders, inProgressOrders, completedOrders, issueOrders };
    };

    const stats = getOrderStats();

    // Tính toán số lượng đơn hàng theo trạng thái cho filter
    const getStatusCounts = () => {
        const counts: Record<OrderStatusEnum, number> = {} as Record<OrderStatusEnum, number>;

        orders.forEach(order => {
            const status = order.status as OrderStatusEnum;
            counts[status] = (counts[status] || 0) + 1;
        });

        return counts;
    };

    // Định nghĩa các cột cho bảng
    const getColumns = () => {
        const baseColumns: ColumnsType<Order> = [
            {
                title: 'Mã đơn hàng',
                dataIndex: 'orderCode',
                key: 'orderCode',
                sorter: (a: Order, b: Order) => a.orderCode.localeCompare(b.orderCode),
                ellipsis: true,
                render: (text: string, record: Order) => (
                    <a
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => handleViewDetails(record.id)}
                    >
                        {text}
                    </a>
                ),
            },
            {
                title: 'Người nhận',
                dataIndex: 'receiverName',
                key: 'receiverName',
                ellipsis: true,
                responsive: ['md'],
            },
            {
                title: 'Số điện thoại',
                dataIndex: 'receiverPhone',
                key: 'receiverPhone',
                ellipsis: true,
                responsive: ['lg'],
            },
            {
                title: 'Tổng KL',
                dataIndex: 'totalWeight',
                key: 'totalWeight',
                render: (weight: number | null) => weight !== null ? `${weight} kg` : '0 kg',
                sorter: (a: Order, b: Order) => (a.totalWeight || 0) - (b.totalWeight || 0),
                width: 100,
                responsive: ['md'],
            },
            {
                title: 'Tổng tiền',
                dataIndex: 'totalPrice',
                key: 'totalPrice',
                render: (price: number | null) => (
                    <span className="font-medium text-blue-600">
                        {price !== null ? `${price.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                    </span>
                ),
                sorter: (a: Order, b: Order) => (a.totalPrice || 0) - (b.totalPrice || 0),
                width: 150,
            },
            {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => <OrderStatusTag status={status as OrderStatusEnum} />,
                width: 150,
            },
            {
                title: 'Ngày tạo',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date: string) => (
                    <span className="text-gray-600">
                        {dayjs(date).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss')}
                    </span>
                ),
                sorter: (a: Order, b: Order) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
                width: 150,
                responsive: ['lg'],
            },
        ];

        // Thêm cột thao tác nếu cần
        const actionColumn = {
            title: 'Thao tác',
            key: 'action',
            width: 100,
            render: (_: any, record: Order) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(record.id);
                    }}
                >
                    Chi tiết
                </Button>
            ),
        };

        if (isMobile) {
            return [...baseColumns, actionColumn];
        }

        return baseColumns;
    };

    // Render stats card theo layout của Admin
    const renderStatCards = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đơn chờ xử lý</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-orange-800">{stats.pendingOrders}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : stats.pendingOrders} color="orange" showZero>
                        <div className="bg-orange-200 p-2 rounded-full">
                            <ClockCircleOutlined className="text-3xl text-orange-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Đang vận chuyển</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-blue-800">{stats.inProgressOrders}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : stats.inProgressOrders} color="blue" showZero>
                        <div className="bg-blue-200 p-2 rounded-full">
                            <CarOutlined className="text-3xl text-blue-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Hoàn thành</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-green-700">{stats.completedOrders}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : stats.completedOrders} color="green" showZero>
                        <div className="bg-green-200 p-2 rounded-full">
                            <CheckCircleOutlined className="text-3xl text-green-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                    <div>
                        <Text className="text-gray-600 block">Có vấn đề</Text>
                        {loading ? (
                            <Skeleton.Input style={{ width: 60 }} active size="small" />
                        ) : (
                            <Title level={3} className="m-0 text-red-700">{stats.issueOrders}</Title>
                        )}
                    </div>
                    <Badge count={loading ? 0 : stats.issueOrders} color="red" showZero>
                        <div className="bg-red-200 p-2 rounded-full">
                            <ExclamationCircleOutlined className="text-3xl text-red-600" />
                        </div>
                    </Badge>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2} className="flex items-center m-0 text-blue-800">
                            <ShoppingCartOutlined className="mr-3 text-blue-600" /> Quản lý đơn hàng
                        </Title>
                        <Text type="secondary">Quản lý thông tin và trạng thái của các đơn hàng trong hệ thống</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined spin={isFetching} />}
                        onClick={fetchOrders}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="large"
                        loading={isFetching}
                    >
                        Làm mới
                    </Button>
                </div>

                {renderStatCards()}

                <Card className="shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                        <Title level={4} className="m-0 mb-4 md:mb-0">Danh sách đơn hàng</Title>
                        <div className="flex w-full md:w-auto gap-2">
                            <Input
                                placeholder="Tìm kiếm theo mã đơn, tên người nhận, số điện thoại..."
                                prefix={<SearchOutlined />}
                                className="w-full md:w-64"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                disabled={loading}
                            />
                            <Select
                                defaultValue="all"
                                style={{ width: 200 }}
                                onChange={(value) => setStatusFilter(value)}
                                className="rounded-md"
                                disabled={loading}
                            >
                                <Option value="all">Tất cả trạng thái</Option>
                                <Option value="PENDING">Chờ xử lý</Option>
                                <Option value="PROCESSING">Đang xử lý</Option>
                                <Option value="CONTRACT_DRAFT">Bản nháp hợp đồng</Option>
                                <Option value="CONTRACT_SIGNED">Hợp đồng đã ký</Option>
                                <Option value="ON_PLANNING">Đang lập kế hoạch</Option>
                                <Option value="ASSIGNED_TO_DRIVER">Đã phân công tài xế</Option>
                                <Option value="PICKED_UP">Đã lấy hàng</Option>
                                <Option value="ON_DELIVERED">Đang vận chuyển</Option>
                                <Option value="DELIVERED">Đã giao hàng</Option>
                                <Option value="SUCCESSFUL">Hoàn thành</Option>
                                <Option value="CANCELLED">Đã hủy</Option>
                                <Option value="RETURNED">Đã hoàn trả</Option>
                            </Select>
                        </div>
                    </div>

                    <Table
                        columns={getColumns()}
                        dataSource={filteredOrders}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            showTotal: (total) => `Tổng ${total} đơn hàng`
                        }}
                        loading={{
                            spinning: loading,
                            indicator: <></>
                        }}
                        className="order-table"
                        rowClassName="hover:bg-blue-50 transition-colors"
                        locale={{
                            emptyText: loading ? (
                                <div className="py-5">
                                    <Skeleton active paragraph={{ rows: 5 }} />
                                </div>
                            ) : 'Không có dữ liệu'
                        }}
                        scroll={{ x: 'max-content' }}
                        onRow={(record) => ({
                            onClick: () => handleViewDetails(record.id),
                            style: { cursor: 'pointer' }
                        })}
                    />
                </Card>
            </div>
        </div>
    );
};

export default OrderList; 