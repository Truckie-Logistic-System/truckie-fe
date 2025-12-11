import React from 'react';
import { Row, Col, Card, Badge, Typography, Skeleton } from 'antd';
import { 
    ClockCircleOutlined, 
    CarOutlined, 
    CheckCircleOutlined, 
    ExclamationCircleOutlined,
    FileTextOutlined,
    DollarCircleOutlined,
    TruckOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { OrderStatusEnum } from '@/constants/enums';

const { Title, Text } = Typography;

interface OrderStatCardsProps {
    orders: any[];
    loading: boolean;
}

const OrderStatCards: React.FC<OrderStatCardsProps> = ({ orders, loading }) => {
    // Nhóm các trạng thái theo quy trình xử lý đơn hàng
    
    // 1. Đơn chờ xử lý (Khởi tạo)
    const pendingOrders = orders.filter(order =>
        [OrderStatusEnum.PENDING, OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED].includes(order.status)
    );

    // 2. Đang xử lý hợp đồng & thanh toán
    const contractOrders = orders.filter(order =>
        [OrderStatusEnum.CONTRACT_DRAFT, OrderStatusEnum.CONTRACT_SIGNED, OrderStatusEnum.ON_PLANNING].includes(order.status)
    );

    // 3. Đang vận chuyển
    const inTransitOrders = orders.filter(order =>
        [OrderStatusEnum.ASSIGNED_TO_DRIVER, OrderStatusEnum.FULLY_PAID, OrderStatusEnum.PICKING_UP, 
         OrderStatusEnum.ON_DELIVERED, OrderStatusEnum.ONGOING_DELIVERED].includes(order.status)
    );

    // 4. Hoàn thành
    const completedOrders = orders.filter(order =>
        [OrderStatusEnum.DELIVERED, OrderStatusEnum.SUCCESSFUL].includes(order.status)
    );

    // 5. Sự cố & xử lý
    const issueOrders = orders.filter(order =>
        [OrderStatusEnum.IN_TROUBLES, OrderStatusEnum.RESOLVED, OrderStatusEnum.COMPENSATION].includes(order.status)
    );

    // 6. Từ chối & trả hàng
    const returnOrders = orders.filter(order =>
        [OrderStatusEnum.REJECT_ORDER, OrderStatusEnum.RETURNING, OrderStatusEnum.RETURNED].includes(order.status)
    );

    return (
        <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Chờ xử lý</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-orange-700">{pendingOrders.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : pendingOrders.length} color="orange" showZero>
                            <div className="bg-orange-200 p-2 rounded-full">
                                <ClockCircleOutlined className="text-2xl text-orange-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Hợp đồng</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-purple-700">{contractOrders.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : contractOrders.length} color="purple" showZero>
                            <div className="bg-purple-200 p-2 rounded-full">
                                <FileTextOutlined className="text-2xl text-purple-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Vận chuyển</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-blue-700">{inTransitOrders.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : inTransitOrders.length} color="blue" showZero>
                            <div className="bg-blue-200 p-2 rounded-full">
                                <TruckOutlined className="text-2xl text-blue-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Hoàn thành</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-green-700">{completedOrders.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : completedOrders.length} color="green" showZero>
                            <div className="bg-green-200 p-2 rounded-full">
                                <CheckCircleOutlined className="text-2xl text-green-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Sự cố</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-red-700">{issueOrders.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : issueOrders.length} color="red" showZero>
                            <div className="bg-red-200 p-2 rounded-full">
                                <ExclamationCircleOutlined className="text-2xl text-red-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={4}>
                <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="flex justify-between items-center h-full">
                        <div className="flex-1">
                            <Text className="text-gray-600 block text-xs">Trả hàng</Text>
                            {loading ? (
                                <Skeleton.Input style={{ width: 60 }} active size="small" />
                            ) : (
                                <Title level={3} className="m-0 text-yellow-700">{returnOrders.length}</Title>
                            )}
                        </div>
                        <Badge count={loading ? 0 : returnOrders.length} color="#eab308" showZero>
                            <div className="bg-yellow-200 p-2 rounded-full">
                                <WarningOutlined className="text-2xl text-yellow-600" />
                            </div>
                        </Badge>
                    </div>
                </Card>
            </Col>
        </Row>
    );
};

export default OrderStatCards;
