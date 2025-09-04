import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Form,
    Input,
    Button,
    Card,
    Select,
    DatePicker,
    InputNumber,
    Space,
    Divider,
    message,
    Spin,
    Typography,
    Row,
    Col,
    Table,
    Popconfirm
} from 'antd';
import {
    ArrowLeftOutlined,
    SaveOutlined,
    PlusOutlined,
    DeleteOutlined,
    MinusCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Define types
interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
}

interface Order {
    id: string;
    orderCode: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    pickupAddress: string;
    deliveryAddress: string;
    status: 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
    estimatedDeliveryTime?: string;
    actualDeliveryTime?: string;
    totalAmount: number;
    paymentMethod: 'cash' | 'credit_card' | 'bank_transfer' | 'e_wallet';
    paymentStatus: 'paid' | 'unpaid' | 'partial';
    notes?: string;
    items: OrderItem[];
    driverId?: string;
    driverName?: string;
    driverPhone?: string;
    vehicleInfo?: string;
}

interface Driver {
    id: string;
    name: string;
    phone: string;
    vehicleInfo: string;
    status: 'available' | 'busy' | 'offline';
}

const OrderEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(true);
    const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [newItem, setNewItem] = useState<{ name: string; quantity: number; price: number }>({
        name: '',
        quantity: 1,
        price: 0
    });

    // Fetch order data
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                setLoading(true);
                // Replace with your actual API call
                // const response = await orderService.getOrderById(id);
                // const orderData = response.data;

                // Mock data for development
                setTimeout(() => {
                    // Create a mock order for development
                    const mockOrder: Order = {
                        id: id || 'order-1',
                        orderCode: `ORD-${100000 + parseInt(id?.split('-')[1] || '1')}`,
                        customerId: 'cust-123',
                        customerName: 'Nguyễn Văn A',
                        customerPhone: '0901234567',
                        pickupAddress: 'Số 123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
                        deliveryAddress: 'Số 456 Đường Lê Lợi, Quận 3, TP.HCM',
                        status: 'delivering',
                        createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
                        updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
                        estimatedDeliveryTime: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
                        totalAmount: 350000,
                        paymentMethod: 'cash',
                        paymentStatus: 'unpaid',
                        notes: 'Gọi trước khi giao hàng',
                        items: [
                            {
                                id: 'item-1',
                                name: 'Sản phẩm A',
                                quantity: 2,
                                price: 100000,
                                total: 200000
                            },
                            {
                                id: 'item-2',
                                name: 'Sản phẩm B',
                                quantity: 1,
                                price: 150000,
                                total: 150000
                            }
                        ],
                        driverId: 'driver-1',
                        driverName: 'Tài xế C',
                        driverPhone: '0909123456',
                        vehicleInfo: 'Honda Wave - 59P1-12345'
                    };

                    // Set form values
                    form.setFieldsValue({
                        orderCode: mockOrder.orderCode,
                        customerName: mockOrder.customerName,
                        customerPhone: mockOrder.customerPhone,
                        pickupAddress: mockOrder.pickupAddress,
                        deliveryAddress: mockOrder.deliveryAddress,
                        status: mockOrder.status,
                        estimatedDeliveryTime: mockOrder.estimatedDeliveryTime ? dayjs(mockOrder.estimatedDeliveryTime) : undefined,
                        actualDeliveryTime: mockOrder.actualDeliveryTime ? dayjs(mockOrder.actualDeliveryTime) : undefined,
                        paymentMethod: mockOrder.paymentMethod,
                        paymentStatus: mockOrder.paymentStatus,
                        notes: mockOrder.notes,
                        driverId: mockOrder.driverId
                    });

                    setOrderItems(mockOrder.items);
                    setLoading(false);
                }, 800);

                // Mock available drivers
                const mockDrivers: Driver[] = [
                    {
                        id: 'driver-1',
                        name: 'Tài xế C',
                        phone: '0909123456',
                        vehicleInfo: 'Honda Wave - 59P1-12345',
                        status: 'busy'
                    },
                    {
                        id: 'driver-2',
                        name: 'Tài xế D',
                        phone: '0909123457',
                        vehicleInfo: 'Yamaha Sirius - 59P2-12346',
                        status: 'available'
                    },
                    {
                        id: 'driver-3',
                        name: 'Tài xế E',
                        phone: '0909123458',
                        vehicleInfo: 'Honda Air Blade - 59P3-12347',
                        status: 'available'
                    }
                ];
                setAvailableDrivers(mockDrivers);
            } catch (error) {
                message.error('Không thể tải thông tin đơn hàng');
                setLoading(false);
            }
        };

        if (id) {
            fetchOrderDetails();
        }
    }, [id, form]);

    // Handle form submit
    const handleSubmit = async (values: any) => {
        try {
            if (orderItems.length === 0) {
                message.error('Đơn hàng phải có ít nhất một sản phẩm');
                return;
            }

            // Calculate total amount
            const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

            const updatedOrder = {
                ...values,
                id,
                items: orderItems,
                totalAmount,
                estimatedDeliveryTime: values.estimatedDeliveryTime?.format('YYYY-MM-DD HH:mm:ss'),
                actualDeliveryTime: values.actualDeliveryTime?.format('YYYY-MM-DD HH:mm:ss'),
                updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };

            // Replace with your actual API call
            // await orderService.updateOrder(id, updatedOrder);

            message.success('Cập nhật đơn hàng thành công');
            navigate(`/admin/orders/${id}`);
        } catch (error) {
            message.error('Không thể cập nhật đơn hàng');
        }
    };

    // Handle add new item
    const handleAddItem = () => {
        if (!newItem.name || newItem.quantity <= 0 || newItem.price <= 0) {
            message.error('Vui lòng nhập đầy đủ thông tin sản phẩm');
            return;
        }

        const total = newItem.quantity * newItem.price;
        const item: OrderItem = {
            id: `item-${Date.now()}`,
            name: newItem.name,
            quantity: newItem.quantity,
            price: newItem.price,
            total
        };

        setOrderItems([...orderItems, item]);
        setNewItem({ name: '', quantity: 1, price: 0 });
    };

    // Handle remove item
    const handleRemoveItem = (itemId: string) => {
        setOrderItems(orderItems.filter(item => item.id !== itemId));
    };

    // Table columns for order items
    const columns: ColumnsType<OrderItem> = [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `${price.toLocaleString('vi-VN')} đ`,
        },
        {
            title: 'Thành tiền',
            dataIndex: 'total',
            key: 'total',
            render: (total) => `${total.toLocaleString('vi-VN')} đ`,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title="Xóa sản phẩm này?"
                    onConfirm={() => handleRemoveItem(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full p-8">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(`/admin/orders/${id}`)}
                        className="mr-4"
                    >
                        Quay lại
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>
                        Chỉnh sửa đơn hàng
                    </Title>
                </div>
                <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => form.submit()}
                >
                    Lưu thay đổi
                </Button>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
            >
                <Row gutter={16}>
                    <Col span={16}>
                        {/* Order Information */}
                        <Card title="Thông tin đơn hàng" className="mb-6">
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Form.Item
                                        name="orderCode"
                                        label="Mã đơn hàng"
                                        rules={[{ required: true, message: 'Vui lòng nhập mã đơn hàng' }]}
                                    >
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="status"
                                        label="Trạng thái"
                                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                                    >
                                        <Select>
                                            <Option value="pending">Chờ xử lý</Option>
                                            <Option value="processing">Đang xử lý</Option>
                                            <Option value="delivering">Đang giao hàng</Option>
                                            <Option value="completed">Hoàn thành</Option>
                                            <Option value="cancelled">Đã hủy</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="driverId"
                                        label="Tài xế"
                                    >
                                        <Select placeholder="Chọn tài xế" allowClear>
                                            {availableDrivers.map(driver => (
                                                <Option key={driver.id} value={driver.id}>
                                                    {driver.name} - {driver.vehicleInfo}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="estimatedDeliveryTime"
                                        label="Thời gian giao hàng dự kiến"
                                    >
                                        <DatePicker
                                            showTime
                                            format="DD/MM/YYYY HH:mm"
                                            placeholder="Chọn thời gian"
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="actualDeliveryTime"
                                        label="Thời gian giao hàng thực tế"
                                    >
                                        <DatePicker
                                            showTime
                                            format="DD/MM/YYYY HH:mm"
                                            placeholder="Chọn thời gian"
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="paymentMethod"
                                        label="Phương thức thanh toán"
                                        rules={[{ required: true, message: 'Vui lòng chọn phương thức thanh toán' }]}
                                    >
                                        <Select>
                                            <Option value="cash">Tiền mặt</Option>
                                            <Option value="credit_card">Thẻ tín dụng</Option>
                                            <Option value="bank_transfer">Chuyển khoản</Option>
                                            <Option value="e_wallet">Ví điện tử</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="paymentStatus"
                                        label="Trạng thái thanh toán"
                                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái thanh toán' }]}
                                    >
                                        <Select>
                                            <Option value="paid">Đã thanh toán</Option>
                                            <Option value="unpaid">Chưa thanh toán</Option>
                                            <Option value="partial">Thanh toán một phần</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="notes"
                                label="Ghi chú"
                            >
                                <TextArea rows={3} placeholder="Nhập ghi chú cho đơn hàng" />
                            </Form.Item>
                        </Card>

                        {/* Order Items */}
                        <Card title="Danh sách sản phẩm" className="mb-6">
                            <Table
                                columns={columns}
                                dataSource={orderItems}
                                rowKey="id"
                                pagination={false}
                                summary={(pageData) => {
                                    const total = pageData.reduce((sum, item) => sum + item.total, 0);
                                    return (
                                        <>
                                            <Table.Summary.Row>
                                                <Table.Summary.Cell index={0} colSpan={3} className="text-right font-bold">
                                                    Tổng cộng:
                                                </Table.Summary.Cell>
                                                <Table.Summary.Cell index={1} colSpan={2} className="font-bold">
                                                    {total.toLocaleString('vi-VN')} đ
                                                </Table.Summary.Cell>
                                            </Table.Summary.Row>
                                        </>
                                    );
                                }}
                            />

                            <Divider>Thêm sản phẩm mới</Divider>

                            <div className="flex space-x-2 items-end">
                                <div className="flex-1">
                                    <Form.Item label="Tên sản phẩm" className="mb-0">
                                        <Input
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                            placeholder="Nhập tên sản phẩm"
                                        />
                                    </Form.Item>
                                </div>
                                <div className="w-24">
                                    <Form.Item label="Số lượng" className="mb-0">
                                        <InputNumber
                                            min={1}
                                            value={newItem.quantity}
                                            onChange={(value) => setNewItem({ ...newItem, quantity: value || 1 })}
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </div>
                                <div className="w-32">
                                    <Form.Item label="Đơn giá" className="mb-0">
                                        <InputNumber
                                            min={0}
                                            value={newItem.price}
                                            onChange={(value) => setNewItem({ ...newItem, price: value || 0 })}
                                            addonAfter="đ"
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </div>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddItem}
                                >
                                    Thêm
                                </Button>
                            </div>
                        </Card>
                    </Col>

                    <Col span={8}>
                        {/* Customer Information */}
                        <Card title="Thông tin khách hàng" className="mb-6">
                            <Form.Item
                                name="customerName"
                                label="Tên khách hàng"
                                rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                            >
                                <Input placeholder="Nhập tên khách hàng" />
                            </Form.Item>

                            <Form.Item
                                name="customerPhone"
                                label="Số điện thoại"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                                ]}
                            >
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>
                        </Card>

                        {/* Address Information */}
                        <Card title="Thông tin địa chỉ" className="mb-6">
                            <Form.Item
                                name="pickupAddress"
                                label="Địa chỉ lấy hàng"
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ lấy hàng' }]}
                            >
                                <TextArea rows={3} placeholder="Nhập địa chỉ lấy hàng" />
                            </Form.Item>

                            <Form.Item
                                name="deliveryAddress"
                                label="Địa chỉ giao hàng"
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao hàng' }]}
                            >
                                <TextArea rows={3} placeholder="Nhập địa chỉ giao hàng" />
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default OrderEdit; 