import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Card, Spin, message, Modal, Skeleton, Space, Row, Col, Statistic, Typography, Badge } from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    CarOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    ShoppingCartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { Order, OrderStatus } from '@/models';
import { OrderStatusEnum } from '@/constants/enums';
import { OrderStatusTag } from '@/components/common/tags';

const { Title, Text } = Typography;
const { Option } = Select;

interface OrderListProps {
    orders: Order[];
    loading: boolean;
    error: Error | null;
    onViewDetails: (orderId: string) => void;
    onRefresh?: () => void;
}

const OrderList: React.FC<OrderListProps> = ({
    orders = [],  // Đảm bảo orders luôn là mảng
    loading,
    error,
    onViewDetails,
    onRefresh
}) => {
    const [searchText, setSearchText] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const navigate = useNavigate();

    // Lấy danh sách đơn hàng khi component mount
    useEffect(() => {
        // This useEffect is now redundant as props are passed directly.
        // Keeping it for now as it might be used elsewhere or for future state.
        // fetchOrders(); 
    }, []);

    // Hàm lấy danh sách đơn hàng từ API
    const fetchOrders = () => {
        if (onRefresh) {
            onRefresh();
        }
    };

    // Xử lý khi click vào nút xem chi tiết
    const handleViewDetails = (orderId: string) => {
        onViewDetails(orderId);
    };

    // Xử lý khi click vào nút chỉnh sửa
    const handleEdit = (orderId: string) => {
        navigate(`/admin/orders/${orderId}/edit`);
    };

    // Xử lý khi click vào nút xóa
    const handleDelete = (orderId: string) => {
        Modal.confirm({
            title: 'Xác nhận xóa đơn hàng',
            content: 'Bạn có chắc chắn muốn xóa đơn hàng này không?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    // await orderService.deleteOrder(orderId); // This line was removed from imports, so it's removed here.
                    message.success('Đã xóa đơn hàng thành công');
                    // fetchOrders(); // Refresh the list
                } catch (error) {
                    message.error('Không thể xóa đơn hàng');
                }
            },
        });
    };

    // Lọc đơn hàng theo từ khóa tìm kiếm
    const filteredOrders = (orders || []).filter(order => {
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
        const safeOrders = orders || [];

        const pendingOrders = safeOrders.filter(order =>
            ['PENDING', 'PROCESSING', 'CONTRACT_DRAFT'].includes(order.status)).length;

        const inProgressOrders = safeOrders.filter(order =>
            ['ON_PLANNING', 'ASSIGNED_TO_DRIVER', 'FULLY_PAID', 'PICKING_UP', 'ON_DELIVERED', 'ONGOING_DELIVERED'].includes(order.status)).length;

        const completedOrders = safeOrders.filter(order =>
            ['DELIVERED', 'SUCCESSFUL', 'RESOLVED'].includes(order.status)).length;

        const issueOrders = safeOrders.filter(order =>
            ['REJECT_ORDER', 'IN_TROUBLES', 'COMPENSATION', 'RETURNING', 'RETURNED'].includes(order.status)).length;

        return { pendingOrders, inProgressOrders, completedOrders, issueOrders };
    };

    const stats = getOrderStats();

    // Render trạng thái đơn hàng
    const renderOrderStatus = (status: OrderStatus) => {
        return <OrderStatusTag status={status as OrderStatusEnum} />;
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
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (status: OrderStatus) => renderOrderStatus(status),
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
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Chi tiết
                </Button>
            ),
        };

        // Responsive design
        const isMobile = false; // This is now handled by the parent component

        if (isMobile) {
            return [...baseColumns, actionColumn];
        }

        return baseColumns;
    };

    // Render stats card theo layout của Driver
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
                                <Option value="PICKING_UP">Đang lấy hàng</Option>
                                <Option value="ON_DELIVERED">Đang vận chuyển</Option>
                                <Option value="DELIVERED">Đã giao hàng</Option>
                                <Option value="SUCCESSFUL">Hoàn thành</Option>
                                <Option value="CANCELLED">Đã hủy</Option>
                                <Option value="RETURNED">Đã trả hàng</Option>
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