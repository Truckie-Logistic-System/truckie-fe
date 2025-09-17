import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, App, Tabs, Card } from 'antd';
import {
    ArrowLeftOutlined,
    InfoCircleOutlined,
    HistoryOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import orderService from '../../services/order/orderService';
import {
    OrderDetailSkeleton,
    OrderStatusCard,
    OrderInfoCard,
    AddressCard,
    SenderInfoCard,
    OrderDetailsTable,
    OrderSizeCard,
    VehicleAssignmentCard,
    ContractCard,
    TransactionsCard,
    IssueImagesCard,
    CompletionPhotosCard
} from '../../components/features/order';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

const { TabPane } = Tabs;

const OrderDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const messageApi = App.useApp().message;
    const [orderData, setOrderData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>("info");

    // Fetch order details when component mounts
    useEffect(() => {
        if (id) {
            fetchOrderDetails(id);
        }
    }, [id]);

    // Function to fetch order details from API
    const fetchOrderDetails = async (orderId: string) => {
        setLoading(true);
        try {
            const data = await orderService.getOrderForCustomerByOrderId(orderId);
            setOrderData(data);
        } catch (error) {
            messageApi.error('Không thể tải thông tin đơn hàng');
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <OrderDetailSkeleton />;
    }

    if (!orderData || !orderData.getOrderResponse) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                    <h2 className="text-xl font-semibold mb-2">Không tìm thấy đơn hàng</h2>
                    <p className="text-gray-500 mb-4">Đơn hàng không tồn tại hoặc đã bị xóa</p>
                    <Button type="primary" onClick={() => navigate('/orders')} className="bg-blue-600 hover:bg-blue-700">
                        Quay lại danh sách đơn hàng
                    </Button>
                </div>
            </div>
        );
    }

    const order = orderData.getOrderResponse;

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
                    </div>
                </div>
            </div>

            {/* Content section */}
            <div className="max-w-6xl mx-auto px-4 py-6">
                {/* Order Status Card */}
                <OrderStatusCard order={order} />

                {/* Tabs for different sections */}
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
                                        <AddressCard
                                            address={order.pickupAddress || {}}
                                            title="Địa chỉ lấy hàng"
                                            type="pickup"
                                        />

                                        {/* Delivery Address */}
                                        <AddressCard
                                            address={order.deliveryAddress || {}}
                                            title="Địa chỉ giao hàng"
                                            type="delivery"
                                        />
                                    </div>

                                    {/* Sender Information */}
                                    <SenderInfoCard sender={order.sender || {}} />

                                    {/* Order Details Table */}
                                    <OrderDetailsTable orderDetails={order.orderDetails || []} />

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
                                    <HistoryOutlined /> Lịch sử vận chuyển
                                </span>
                            }
                            key="history"
                        >
                            {activeTab === "history" && (
                                <div className="p-4">
                                    {/* Issue Images */}
                                    {orderData.getIssueImageResponse && orderData.getIssueImageResponse.length > 0 && (
                                        <div className="mb-6">
                                            <IssueImagesCard issueImages={orderData.getIssueImageResponse} />
                                        </div>
                                    )}

                                    {/* Completion Photos */}
                                    {orderData.photoCompletionResponse && Object.keys(orderData.photoCompletionResponse).length > 0 && (
                                        <div className="mb-6">
                                            <CompletionPhotosCard photoCompletion={orderData.photoCompletionResponse} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabPane>
                        <TabPane
                            tab={
                                <span>
                                    <FileTextOutlined /> Hợp đồng & Thanh toán
                                </span>
                            }
                            key="contract"
                        >
                            {activeTab === "contract" && (
                                <div className="p-4">
                                    {/* Contract Information */}
                                    <ContractCard contract={orderData.contractResponse} />

                                    {/* Transactions Information */}
                                    <TransactionsCard transactions={orderData.transactionResponse} />
                                </div>
                            )}
                        </TabPane>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage; 