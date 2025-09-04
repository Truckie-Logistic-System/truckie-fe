import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Input, DatePicker, Select, Card, Spin, message, Modal } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import orderService from '@/services/order/orderService';
import type { Order, OrderStatus } from '@/models';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderList: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const navigate = useNavigate();

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

    // Render trạng thái đơn hàng
    const renderOrderStatus = (status: OrderStatus) => {
        let color = 'default';
        let label: string = status;

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

    // Định nghĩa các cột cho bảng
    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'orderCode',
            key: 'orderCode',
            sorter: (a: Order, b: Order) => a.orderCode.localeCompare(b.orderCode),
        },
        {
            title: 'Người nhận',
            dataIndex: 'receiverName',
            key: 'receiverName',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'receiverPhone',
            key: 'receiverPhone',
        },
        {
            title: 'Tổng khối lượng',
            dataIndex: 'totalWeight',
            key: 'totalWeight',
            render: (weight: number | null) => weight !== null ? `${weight} kg` : '0 kg',
            sorter: (a: Order, b: Order) => (a.totalWeight || 0) - (b.totalWeight || 0),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (price: number | null) => price !== null ? `${price.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ',
            sorter: (a: Order, b: Order) => (a.totalPrice || 0) - (b.totalPrice || 0),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: OrderStatus) => renderOrderStatus(status),
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
            sorter: (a: Order, b: Order) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Order) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetails(record.id)}
                    >
                        Chi tiết
                    </Button>
                    <Button
                        type="default"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record.id)}
                    >
                        Sửa
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    >
                        Xóa
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <Card title="Quản lý đơn hàng" className="shadow-md">
                <div className="mb-4 flex flex-wrap gap-4 items-center">
                    <Input
                        placeholder="Tìm kiếm theo mã đơn, tên người nhận, số điện thoại..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />

                    <Select
                        defaultValue="all"
                        style={{ width: 200 }}
                        onChange={(value) => setStatusFilter(value)}
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
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={fetchOrders}
                    >
                        Làm mới
                    </Button>
                </div>

                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredOrders}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                            showTotal: (total) => `Tổng số ${total} đơn hàng`
                        }}
                    />
                </Spin>
            </Card>
        </div>
    );
};

export default OrderList; 