import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Input, Select, Card, Spin, message, Modal, Skeleton, Space, Row, Col, Statistic } from 'antd';
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
    RollbackOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import orderService from '@/services/order/orderService';
import type { Order, OrderStatus } from '@/models';
import dayjs from 'dayjs';
import { DateSelectGroup } from '@/components/common';
import { useMediaQuery } from 'react-responsive';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

const OrderList: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
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
        try {
            const data = await orderService.getAllOrders();
            setOrders(data);
        } catch (error) {
            message.error('Không thể tải danh sách đơn hàng');
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý khi click vào nút xem chi tiết
    const handleViewDetails = (orderId: string) => {
        navigate(`/admin/orders/${orderId}`);
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
                    await orderService.deleteOrder(orderId);
                    message.success('Đã xóa đơn hàng thành công');
                    fetchOrders(); // Refresh the list
                } catch (error) {
                    message.error('Không thể xóa đơn hàng');
                }
            },
        });
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
            ['PENDING', 'PROCESSING', 'CONTRACT_DRAFT'].includes(order.status)).length;

        const inProgressOrders = orders.filter(order =>
            ['ON_PLANNING', 'ASSIGNED_TO_DRIVER', 'DRIVER_CONFIRM', 'PICKED_UP', 'ON_DELIVERED', 'ONGOING_DELIVERED', 'IN_DELIVERED'].includes(order.status)).length;

        const completedOrders = orders.filter(order =>
            ['DELIVERED', 'SUCCESSFUL'].includes(order.status)).length;

        const issueOrders = orders.filter(order =>
            ['CANCELLED', 'REJECT_ORDER', 'IN_TROUBLES', 'RETURNING', 'RETURNED'].includes(order.status)).length;

        return { pendingOrders, inProgressOrders, completedOrders, issueOrders };
    };

    const stats = getOrderStats();

    // Render trạng thái đơn hàng
    const renderOrderStatus = (status: OrderStatus) => {
        let color = 'default';
        let label: string = status;
        let icon = null;

        switch (status) {
            // Trạng thái ban đầu
            case 'PENDING':
                color = 'orange';
                label = 'Chờ xử lý';
                icon = <ClockCircleOutlined />;
                break;
            case 'PROCESSING':
                color = 'blue';
                label = 'Đang xử lý';
                icon = <ClockCircleOutlined />;
                break;
            case 'CANCELLED':
                color = 'red';
                label = 'Đã hủy';
                icon = <ExclamationCircleOutlined />;
                break;

            // Trạng thái hợp đồng
            case 'CONTRACT_DRAFT':
                color = 'cyan';
                label = 'Bản nháp hợp đồng';
                icon = <FileOutlined />;
                break;
            case 'CONTRACT_DENIED':
                color = 'red';
                label = 'Hợp đồng bị từ chối';
                icon = <ExclamationCircleOutlined />;
                break;
            case 'CONTRACT_SIGNED':
                color = 'green';
                label = 'Hợp đồng đã ký';
                icon = <CheckCircleOutlined />;
                break;

            // Trạng thái lập kế hoạch và phân công
            case 'ON_PLANNING':
                color = 'purple';
                label = 'Đang lập kế hoạch';
                icon = <ClockCircleOutlined />;
                break;
            case 'ASSIGNED_TO_DRIVER':
                color = 'geekblue';
                label = 'Đã phân công cho tài xế';
                icon = <UserOutlined />;
                break;
            case 'DRIVER_CONFIRM':
                color = 'blue';
                label = 'Tài xế đã xác nhận';
                icon = <CheckCircleOutlined />;
                break;

            // Trạng thái vận chuyển
            case 'PICKED_UP':
                color = 'cyan';
                label = 'Đã lấy hàng';
                icon = <InboxOutlined />;
                break;
            case 'SEALED_COMPLETED':
                color = 'cyan';
                label = 'Đã niêm phong';
                icon = <LockOutlined />;
                break;
            case 'ON_DELIVERED':
                color = 'blue';
                label = 'Đang vận chuyển';
                icon = <CarOutlined />;
                break;
            case 'ONGOING_DELIVERED':
                color = 'blue';
                label = 'Đang giao hàng';
                icon = <CarOutlined />;
                break;
            case 'IN_DELIVERED':
                color = 'blue';
                label = 'Đang giao hàng';
                icon = <CarOutlined />;
                break;

            // Trạng thái vấn đề
            case 'IN_TROUBLES':
                color = 'red';
                label = 'Gặp sự cố';
                icon = <ExclamationCircleOutlined />;
                break;
            case 'RESOLVED':
                color = 'green';
                label = 'Đã giải quyết';
                icon = <CheckCircleOutlined />;
                break;
            case 'COMPENSATION':
                color = 'orange';
                label = 'Đang bồi thường';
                icon = <DollarOutlined />;
                break;

            // Trạng thái hoàn thành
            case 'DELIVERED':
                color = 'green';
                label = 'Đã giao hàng';
                icon = <CheckCircleOutlined />;
                break;
            case 'SUCCESSFUL':
                color = 'green';
                label = 'Hoàn thành';
                icon = <CheckCircleOutlined />;
                break;

            // Trạng thái từ chối và hoàn trả
            case 'REJECT_ORDER':
                color = 'red';
                label = 'Đơn hàng bị từ chối';
                icon = <ExclamationCircleOutlined />;
                break;
            case 'RETURNING':
                color = 'orange';
                label = 'Đang hoàn trả';
                icon = <RollbackOutlined />;
                break;
            case 'RETURNED':
                color = 'volcano';
                label = 'Đã hoàn trả';
                icon = <RollbackOutlined />;
                break;

            default:
                color = 'default';
                label = status;
        }

        return (
            <Tag color={color} icon={icon} className="py-1 px-2 text-sm font-medium">
                {label}
            </Tag>
        );
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
                render: (status: OrderStatus) => renderOrderStatus(status),
                width: 150,
            },
            {
                title: 'Ngày tạo',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date: string) => (
                    <span className="text-gray-600">
                        {dayjs(date).format('DD/MM/YYYY HH:mm')}
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

    return (
        <div className="p-6">
            <div className="mb-6">
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
                            <Statistic
                                title={<span className="text-orange-700 font-medium">Đơn chờ xử lý</span>}
                                value={stats.pendingOrders}
                                valueStyle={{ color: '#d97706' }}
                                prefix={<ClockCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                            <Statistic
                                title={<span className="text-blue-700 font-medium">Đang vận chuyển</span>}
                                value={stats.inProgressOrders}
                                valueStyle={{ color: '#2563eb' }}
                                prefix={<CarOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                            <Statistic
                                title={<span className="text-green-700 font-medium">Hoàn thành</span>}
                                value={stats.completedOrders}
                                valueStyle={{ color: '#059669' }}
                                prefix={<CheckCircleOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                            <Statistic
                                title={<span className="text-red-700 font-medium">Có vấn đề</span>}
                                value={stats.issueOrders}
                                valueStyle={{ color: '#dc2626' }}
                                prefix={<ExclamationCircleOutlined />}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            <Card
                title={
                    <div className="flex items-center">
                        <InboxOutlined className="mr-2 text-blue-500" />
                        <span>Quản lý đơn hàng</span>
                    </div>
                }
                className="shadow-md overflow-hidden border-0 rounded-lg"
                headStyle={{ borderBottom: '2px solid #f0f0f0', padding: '16px 24px' }}
                bodyStyle={{ padding: '24px' }}
            >
                <div className="mb-6 flex flex-wrap gap-4 items-center">
                    <Input
                        placeholder="Tìm kiếm theo mã đơn, tên người nhận, số điện thoại..."
                        prefix={<SearchOutlined className="text-gray-400" />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                        className="rounded-md"
                    />

                    <Select
                        defaultValue="all"
                        style={{ width: 200 }}
                        onChange={(value) => setStatusFilter(value)}
                        className="rounded-md"
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

                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={fetchOrders}
                        className="rounded-md"
                    >
                        Làm mới
                    </Button>
                </div>

                <Spin spinning={loading}>
                    <div className="overflow-x-auto">
                        <Table
                            columns={getColumns()}
                            dataSource={filteredOrders}
                            rowKey="id"
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50'],
                                showTotal: (total) => `Tổng số ${total} đơn hàng`
                            }}
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
                            rowClassName={(record) => {
                                // Highlight rows based on status
                                if (['DELIVERED', 'SUCCESSFUL'].includes(record.status)) {
                                    return 'bg-green-50 hover:bg-green-100';
                                }
                                if (['IN_TROUBLES', 'CANCELLED', 'REJECT_ORDER'].includes(record.status)) {
                                    return 'bg-red-50 hover:bg-red-100';
                                }
                                if (['PENDING', 'PROCESSING'].includes(record.status)) {
                                    return 'bg-yellow-50 hover:bg-yellow-100';
                                }
                                return 'hover:bg-blue-50';
                            }}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                        />
                    </div>
                </Spin>
            </Card>
        </div>
    );
};

export default OrderList; 