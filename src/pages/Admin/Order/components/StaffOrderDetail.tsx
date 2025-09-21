import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { App, Button, Typography, Skeleton, Empty, Tabs, Card, Row, Col } from "antd";
import { ArrowLeftOutlined, InfoCircleOutlined, CarOutlined, ProfileOutlined } from "@ant-design/icons";
import orderService from "../../../../services/order/orderService";
import type { StaffOrderDetailResponse } from "../../../../services/order/types";
import OrderStatusSection from "./StaffOrderDetail/OrderStatusSection";
import AddressSection from "./StaffOrderDetail/AddressSection";
import VehicleInfoSection from "./StaffOrderDetail/VehicleInfoSection";
import ContractSection from "../../../Orders/components/CustomerOrderDetail/ContractSection";
import TransactionSection from "../../../Orders/components/CustomerOrderDetail/TransactionSection";

const { Title } = Typography;
const { TabPane } = Tabs;

const StaffOrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const messageApi = App.useApp().message;
    const [orderData, setOrderData] = useState<StaffOrderDetailResponse["data"] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeMainTab, setActiveMainTab] = useState<string>("basic");
    const [activeDetailTab, setActiveDetailTab] = useState<string>("0");

    useEffect(() => {
        if (id) {
            fetchOrderDetails(id);
        }
    }, [id]);

    const fetchOrderDetails = async (orderId: string) => {
        setLoading(true);
        try {
            const data = await orderService.getOrderForStaffByOrderId(orderId);
            setOrderData(data);
        } catch (error) {
            messageApi.error("Không thể tải thông tin đơn hàng");
            console.error("Error fetching order details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="mb-6 flex items-center">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                        className="mr-4"
                    >
                        Quay lại
                    </Button>
                    <Skeleton.Input style={{ width: 300 }} active />
                </div>
                <Skeleton active paragraph={{ rows: 6 }} />
                <Skeleton active paragraph={{ rows: 6 }} className="mt-6" />
                <Skeleton active paragraph={{ rows: 6 }} className="mt-6" />
            </div>
        );
    }

    if (!orderData || !orderData.order) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="mb-6 flex items-center">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                        className="mr-4"
                    >
                        Quay lại
                    </Button>
                    <Title level={3}>Chi tiết đơn hàng</Title>
                </div>
                <Empty
                    description="Không tìm thấy thông tin đơn hàng"
                    className="bg-white p-8 rounded-xl shadow-md"
                />
            </div>
        );
    }

    const { order, contract, transactions } = orderData;

    // Tab 1: Thông tin cơ bản
    const renderBasicInfoTab = () => {
        return (
            <div>
                {/* Order Status */}
                <OrderStatusSection
                    orderCode={order.orderCode}
                    status={order.status}
                    createdAt={order.createdAt}
                    totalPrice={order.totalPrice}
                />

                {/* Address and Contact Information */}
                <AddressSection
                    pickupAddress={order.pickupAddress}
                    deliveryAddress={order.deliveryAddress}
                    senderRepresentativeName={order.senderRepresentativeName}
                    senderRepresentativePhone={order.senderRepresentativePhone}
                    senderCompanyName={order.senderCompanyName}
                    receiverName={order.receiverName}
                    receiverPhone={order.receiverPhone}
                    receiverIdentity={order.receiverIdentity}
                />

                {/* Order Information */}
                <Card className="mb-6 shadow-md rounded-xl">
                    <Title level={4} className="mb-4">Thông tin đơn hàng</Title>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="mb-2">
                            <span className="font-medium">Mô tả:</span> {order.packageDescription || "Không có mô tả"}
                        </p>
                        <p className="mb-2">
                            <span className="font-medium">Số lượng:</span> {order.totalQuantity}
                        </p>
                        <p className="mb-0">
                            <span className="font-medium">Loại hàng:</span> {order.categoryName || "Chưa phân loại"}
                        </p>
                    </div>

                    {order.notes && (
                        <div className="mt-4">
                            <h3 className="text-md font-medium mb-2 text-gray-700 flex items-center">
                                <InfoCircleOutlined className="mr-2 text-blue-500" /> Ghi chú
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="mb-0">{order.notes}</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        );
    };

    // Tab 2: Chi tiết vận chuyển
    const renderOrderDetailTab = () => {
        if (!order.orderDetails || order.orderDetails.length === 0) {
            return <Empty description="Chưa có thông tin chi tiết vận chuyển" />;
        }

        return (
            <Tabs
                activeKey={activeDetailTab}
                onChange={setActiveDetailTab}
                type="card"
                className="order-detail-tabs"
            >
                {order.orderDetails.map((detail, index) => (
                    <TabPane
                        tab={
                            <span>
                                <CarOutlined /> Chi tiết {index + 1} {detail.trackingCode ? `(${detail.trackingCode})` : ''}
                            </span>
                        }
                        key={index.toString()}
                    >
                        {/* Thông tin chi tiết vận chuyển */}
                        <Card className="mb-6 shadow-md rounded-xl">
                            <Title level={5} className="mb-4">Thông tin chi tiết vận chuyển</Title>

                            <Row gutter={[24, 24]}>
                                <Col xs={24} md={12}>
                                    <div className="mb-4">
                                        <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                                            <InfoCircleOutlined className="mr-2 text-blue-500" /> Thông tin cơ bản
                                        </h3>
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-left">Thông tin</th>
                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-left">Chi tiết</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border border-gray-300 p-2">Mã theo dõi</td>
                                                    <td className="border border-gray-300 p-2">{detail.trackingCode || "Chưa có"}</td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-300 p-2">Trạng thái</td>
                                                    <td className="border border-gray-300 p-2">
                                                        <span className={`px-2 py-1 rounded text-white bg-${detail.status === "PENDING" ? "orange-500" :
                                                                detail.status === "PROCESSING" ? "blue-500" :
                                                                    detail.status === "DELIVERED" || detail.status === "SUCCESSFUL" ? "green-500" :
                                                                        detail.status === "CANCELLED" || detail.status === "IN_TROUBLES" ? "red-500" :
                                                                            "gray-500"
                                                            }`}>
                                                            {detail.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-300 p-2">Trọng lượng</td>
                                                    <td className="border border-gray-300 p-2">{detail.weightBaseUnit} {detail.unit}</td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-300 p-2">Mô tả</td>
                                                    <td className="border border-gray-300 p-2">{detail.description || "Không có mô tả"}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </Col>

                                <Col xs={24} md={12}>
                                    <div className="mb-4">
                                        <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                                            <InfoCircleOutlined className="mr-2 text-blue-500" /> Thông tin thời gian
                                        </h3>
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-left">Thời gian</th>
                                                    <th className="border border-gray-300 bg-gray-50 p-2 text-left">Ngày giờ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border border-gray-300 p-2">Thời gian bắt đầu</td>
                                                    <td className="border border-gray-300 p-2">
                                                        {detail.startTime ? new Date(detail.startTime).toLocaleString("vi-VN") : "Chưa có thông tin"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-300 p-2">Thời gian kết thúc</td>
                                                    <td className="border border-gray-300 p-2">
                                                        {detail.endTime ? new Date(detail.endTime).toLocaleString("vi-VN") : "Chưa có thông tin"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-300 p-2">Thời gian dự kiến bắt đầu</td>
                                                    <td className="border border-gray-300 p-2">
                                                        {detail.estimatedStartTime ? new Date(detail.estimatedStartTime).toLocaleString("vi-VN") : "Chưa có thông tin"}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-gray-300 p-2">Thời gian dự kiến kết thúc</td>
                                                    <td className="border border-gray-300 p-2">
                                                        {detail.estimatedEndTime ? new Date(detail.estimatedEndTime).toLocaleString("vi-VN") : "Chưa có thông tin"}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        {/* Thông tin kích thước */}
                        {detail.orderSize && (
                            <Card className="mb-6 shadow-md rounded-xl">
                                <Title level={5} className="mb-4">Thông tin kích thước</Title>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">Mô tả</th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">Kích thước (Dài x Rộng x Cao)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-2">{detail.orderSize.description}</td>
                                            <td className="border border-gray-300 p-2">
                                                {`${detail.orderSize.minLength} x ${detail.orderSize.minWidth} x ${detail.orderSize.minHeight} m - 
                        ${detail.orderSize.maxLength} x ${detail.orderSize.maxWidth} x ${detail.orderSize.maxHeight} m`}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </Card>
                        )}

                        {/* Thông tin phương tiện vận chuyển */}
                        <VehicleInfoSection vehicleAssignment={detail.vehicleAssignment} />
                    </TabPane>
                ))}
            </Tabs>
        );
    };

    // Tab 3: Hợp đồng và thanh toán
    const renderContractAndPaymentTab = () => {
        return (
            <div>
                {/* Contract Information */}
                <ContractSection contract={contract} />

                {/* Transaction Information */}
                <TransactionSection transactions={transactions} />
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="mb-6 flex items-center">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    className="mr-4"
                >
                    Quay lại
                </Button>
                <Title level={3}>Chi tiết đơn hàng {order.orderCode}</Title>
            </div>

            <Card className="mb-6 shadow-md rounded-xl">
                <Tabs
                    activeKey={activeMainTab}
                    onChange={setActiveMainTab}
                    type="card"
                    size="large"
                    className="order-main-tabs"
                >
                    <TabPane
                        tab={
                            <span className="px-2 py-1">
                                <InfoCircleOutlined className="mr-2" /> Thông tin cơ bản
                            </span>
                        }
                        key="basic"
                    >
                        {renderBasicInfoTab()}
                    </TabPane>
                    <TabPane
                        tab={
                            <span className="px-2 py-1">
                                <CarOutlined className="mr-2" /> Chi tiết vận chuyển
                            </span>
                        }
                        key="details"
                    >
                        {renderOrderDetailTab()}
                    </TabPane>
                    <TabPane
                        tab={
                            <span className="px-2 py-1">
                                <ProfileOutlined className="mr-2" /> Hợp đồng & Thanh toán
                            </span>
                        }
                        key="contract"
                    >
                        {renderContractAndPaymentTab()}
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
};

export default StaffOrderDetail; 