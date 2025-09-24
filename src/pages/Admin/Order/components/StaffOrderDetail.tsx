import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { App, Button, Typography, Skeleton, Empty, Tabs, Card, Row, Col, Tag, Divider, List } from "antd";
import {
    ArrowLeftOutlined,
    InfoCircleOutlined,
    CarOutlined,
    ProfileOutlined,
    ClockCircleOutlined,
    NumberOutlined,
    DollarOutlined,
    EnvironmentOutlined,
    UserOutlined,
    PhoneOutlined,
    ShopOutlined,
    IdcardOutlined,
    FileTextOutlined,
    BoxPlotOutlined,
    ColumnWidthOutlined,
    TagOutlined,
    ToolOutlined,
    HistoryOutlined,
    CalendarOutlined,
    DashboardOutlined,
    CameraOutlined,
    FireOutlined
} from "@ant-design/icons";
import orderService from "../../../../services/order/orderService";
import type { StaffOrderDetailResponse } from "../../../../services/order/types";
import OrderStatusSection from "./StaffOrderDetail/OrderStatusSection";
import AddressSection from "./StaffOrderDetail/AddressSection";
import VehicleInfoSection from "./StaffOrderDetail/VehicleInfoSection";
import ContractSection from "../../../Orders/components/CustomerOrderDetail/ContractSection";
import TransactionSection from "../../../Orders/components/CustomerOrderDetail/TransactionSection";
import VehicleAssignmentModal from "./VehicleAssignmentModal";
import { OrderStatusEnum } from "../../../../constants/enums";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import type { StaffOrderDetailItem } from "../../../../models/Order";
import { Image, Timeline } from "antd";

dayjs.extend(timezone);

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const StaffOrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const messageApi = App.useApp().message;
    const [orderData, setOrderData] = useState<StaffOrderDetailResponse["data"] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeMainTab, setActiveMainTab] = useState<string>("basic");
    const [activeDetailTab, setActiveDetailTab] = useState<string>("0");
    const [vehicleAssignmentModalVisible, setVehicleAssignmentModalVisible] = useState<boolean>(false);

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

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Chưa có thông tin";
        return dayjs(dateString).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss");
    };

    const handleVehicleAssignmentSuccess = () => {
        if (id) {
            fetchOrderDetails(id);
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
                <div className="mb-6">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                    >
                        Quay lại
                    </Button>
                </div>
                <Empty description="Không tìm thấy thông tin đơn hàng" />
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

                {/* Vehicle Assignment Button for ON_PLANNING status */}
                {order.status === OrderStatusEnum.ON_PLANNING && (
                    <div className="mb-6">
                        <Button
                            type="primary"
                            icon={<CarOutlined />}
                            onClick={() => setVehicleAssignmentModalVisible(true)}
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            Phân công xe và tài xế
                        </Button>
                    </div>
                )}

                {/* Order Information */}
                <Card
                    className="mb-6 shadow-md rounded-xl"
                    title={
                        <div className="flex items-center">
                            <InfoCircleOutlined className="mr-2 text-blue-500" />
                            <span className="font-medium">Thông tin đơn hàng</span>
                        </div>
                    }
                >
                    <Row gutter={[24, 16]}>
                        <Col xs={24} md={12}>
                            <div className="mb-4">
                                <div className="flex items-center mb-1">
                                    <NumberOutlined className="mr-2 text-blue-500" />
                                    <Text strong>Mã theo dõi:</Text>
                                </div>
                                <div className="ml-6">{order.orderCode || "Chưa có"}</div>
                            </div>
                            <div className="mb-4">
                                <div className="flex items-center mb-1">
                                    <FileTextOutlined className="mr-2 text-blue-500" />
                                    <Text strong>Ghi chú:</Text>
                                </div>
                                <div className="ml-6">{order.notes || "Không có ghi chú"}</div>
                            </div>
                        </Col>
                        <Col xs={24} md={12}>
                            <div className="mb-4">
                                <div className="flex items-center mb-1">
                                    <BoxPlotOutlined className="mr-2 text-blue-500" />
                                    <Text strong>Loại đơn hàng:</Text>
                                </div>
                                <div className="ml-6">{order.packageDescription || "Không xác định"}</div>
                            </div>
                            <div className="mb-4">
                                <div className="flex items-center mb-1">
                                    <ColumnWidthOutlined className="mr-2 text-blue-500" />
                                    <Text strong>Số lượng:</Text>
                                </div>
                                <div className="ml-6">{order.totalQuantity || "Không xác định"}</div>
                            </div>
                        </Col>
                    </Row>
                </Card>

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
            </div>
        );
    };

    // Tab 2: Chi tiết vận chuyển
    const renderOrderDetailTab = () => {
        if (!order.orderDetails || order.orderDetails.length === 0) {
            return <Empty description="Không có thông tin chi tiết vận chuyển" />;
        }

        // Kiểm tra xem đơn hàng đã được phân công cho tài xế chưa
        const isAssignedToDriver = order.status === OrderStatusEnum.ASSIGNED_TO_DRIVER ||
            order.status === OrderStatusEnum.DRIVER_CONFIRM ||
            order.status === OrderStatusEnum.PICKED_UP ||
            order.status === OrderStatusEnum.SEALED_COMPLETED ||
            order.status === OrderStatusEnum.ON_DELIVERED ||
            order.status === OrderStatusEnum.ONGOING_DELIVERED ||
            order.status === OrderStatusEnum.IN_DELIVERED;

        // Nếu đã phân công cho tài xế, hiển thị theo vehicle assignment
        if (isAssignedToDriver) {
            // Nhóm các order details theo vehicle assignment
            interface VehicleAssignmentGroup {
                vehicleAssignment: StaffOrderDetailItem['vehicleAssignment'];
                orderDetails: StaffOrderDetailItem[];
            }

            const vehicleAssignmentMap = new Map<string, VehicleAssignmentGroup>();

            order.orderDetails.forEach(detail => {
                if (detail.vehicleAssignment) {
                    const vaId = detail.vehicleAssignment.id;
                    if (!vehicleAssignmentMap.has(vaId)) {
                        vehicleAssignmentMap.set(vaId, {
                            vehicleAssignment: detail.vehicleAssignment,
                            orderDetails: []
                        });
                    }
                    vehicleAssignmentMap.get(vaId)?.orderDetails.push(detail);
                }
            });

            const vehicleAssignments = Array.from(vehicleAssignmentMap.values());

            if (vehicleAssignments.length === 0) {
                return (
                    <Card className="shadow-md rounded-xl">
                        <Empty description="Chưa có thông tin phân công xe" />
                    </Card>
                );
            }

            return (
                <Tabs
                    activeKey={activeDetailTab}
                    onChange={setActiveDetailTab}
                    type="card"
                    className="order-detail-tabs"
                >
                    {vehicleAssignments.map((vaGroup, index) => (
                        <TabPane
                            tab={`Chuyến xe #${index + 1} - ${(vaGroup.vehicleAssignment as any)?.trackingCode || "Chưa có mã"}`}
                            key={index.toString()}
                        >
                            {/* Thông tin cơ bản của phương tiện */}
                            <Card
                                className="mb-6 shadow-md rounded-xl"
                                title={
                                    <div className="flex items-center">
                                        <CarOutlined className="mr-2 text-blue-500" />
                                        <span className="font-medium">Thông tin phương tiện</span>
                                    </div>
                                }
                            >
                                <div className="p-2">
                                    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                                        {vaGroup.vehicleAssignment?.vehicle ? (
                                            <>
                                                <div className="flex items-center mb-3">
                                                    <CarOutlined className="text-xl text-blue-500 mr-3" />
                                                    <span className="text-lg font-medium">{vaGroup.vehicleAssignment?.vehicle?.licensePlateNumber || "Chưa có thông tin"}</span>
                                                    <Tag className="ml-3" color={
                                                        vaGroup.vehicleAssignment?.status === "ACTIVE" ? "green" :
                                                            vaGroup.vehicleAssignment?.status === "INACTIVE" ? "red" : "blue"
                                                    }>
                                                        {vaGroup.vehicleAssignment?.status}
                                                    </Tag>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="flex items-center">
                                                        <TagOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Nhà sản xuất:</span>
                                                        <span>{vaGroup.vehicleAssignment?.vehicle?.manufacturer || "Chưa có thông tin"}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <CarOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Mẫu xe:</span>
                                                        <span>{vaGroup.vehicleAssignment?.vehicle?.model || "Chưa có thông tin"}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <TagOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Loại xe:</span>
                                                        <span>{vaGroup.vehicleAssignment?.vehicle?.vehicleType || "Chưa có thông tin"}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-2">
                                                <p className="text-gray-500">Chưa có thông tin phương tiện</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <div className="flex items-center mb-2">
                                                <UserOutlined className="text-green-500 mr-2" />
                                                <span className="font-medium">Tài xế chính</span>
                                            </div>
                                            {vaGroup.vehicleAssignment?.primaryDriver ? (
                                                <div className="ml-6">
                                                    <div className="flex items-center mb-1">
                                                        <UserOutlined className="mr-2 text-gray-500" />
                                                        <span>{vaGroup.vehicleAssignment.primaryDriver.fullName}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <PhoneOutlined className="mr-2 text-gray-500" />
                                                        <span>{vaGroup.vehicleAssignment.primaryDriver.phoneNumber}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                                            )}
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <div className="flex items-center mb-2">
                                                <UserOutlined className="text-blue-500 mr-2" />
                                                <span className="font-medium">Tài xế phụ</span>
                                            </div>
                                            {vaGroup.vehicleAssignment?.secondaryDriver ? (
                                                <div className="ml-6">
                                                    <div className="flex items-center mb-1">
                                                        <UserOutlined className="mr-2 text-gray-500" />
                                                        <span>{vaGroup.vehicleAssignment.secondaryDriver.fullName}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <PhoneOutlined className="mr-2 text-gray-500" />
                                                        <span>{vaGroup.vehicleAssignment.secondaryDriver.phoneNumber}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Tabs cho các thông tin chi tiết */}
                            <Card className="mb-6 shadow-md rounded-xl">
                                <Tabs defaultActiveKey="orderDetails">
                                    {/* Tab danh sách lô hàng */}
                                    <TabPane
                                        tab={
                                            <span>
                                                <BoxPlotOutlined /> Danh sách lô hàng
                                            </span>
                                        }
                                        key="orderDetails"
                                    >
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                                            Mã theo dõi
                                                        </th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                                            Trạng thái
                                                        </th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                                            Trọng lượng
                                                        </th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                                            Mô tả
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vaGroup.orderDetails.map((detail: StaffOrderDetailItem, detailIndex) => (
                                                        <tr key={detail.id}>
                                                            <td className="border border-gray-300 p-2">
                                                                <div className="flex items-center">
                                                                    <NumberOutlined className="mr-2 text-blue-500" />
                                                                    {detail.trackingCode || "Chưa có"}
                                                                </div>
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                <Tag color={
                                                                    detail.status === "PENDING" ? "orange" :
                                                                        detail.status === "PROCESSING" ? "blue" :
                                                                            detail.status === "DELIVERED" || detail.status === "SUCCESSFUL" ? "green" :
                                                                                detail.status === "CANCELLED" || detail.status === "IN_TROUBLES" ? "red" :
                                                                                    "default"
                                                                }>
                                                                    {detail.status}
                                                                </Tag>
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                <div className="flex items-center">
                                                                    <ColumnWidthOutlined className="mr-2 text-blue-500" />
                                                                    {detail.weightBaseUnit} {detail.unit}
                                                                </div>
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                <div className="flex items-center">
                                                                    <FileTextOutlined className="mr-2 text-blue-500" />
                                                                    {detail.description || "Không có mô tả"}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </TabPane>

                                    {/* Tab lịch sử hành trình */}
                                    <TabPane
                                        tab={
                                            <span>
                                                <HistoryOutlined /> Lịch sử hành trình
                                            </span>
                                        }
                                        key="journey"
                                    >
                                        {vaGroup.vehicleAssignment?.journeyHistories && vaGroup.vehicleAssignment.journeyHistories.length > 0 ? (
                                            <Timeline
                                                mode="left"
                                                items={vaGroup.vehicleAssignment.journeyHistories.map((journey) => ({
                                                    label: formatDate(journey.startTime),
                                                    children: (
                                                        <div className="bg-blue-50 p-3 rounded-lg">
                                                            <div className="flex items-center mb-2">
                                                                <TagOutlined className="mr-2 text-blue-500" />
                                                                <span className="font-medium mr-1">Trạng thái:</span>
                                                                <Tag color={
                                                                    journey.status === "COMPLETED" ? "green" :
                                                                        journey.status === "IN_PROGRESS" ? "blue" : "orange"
                                                                }>
                                                                    {journey.status}
                                                                </Tag>
                                                            </div>
                                                            <div className="flex items-center mb-2">
                                                                <CalendarOutlined className="mr-2 text-gray-500" />
                                                                <span className="font-medium mr-1">Thời gian kết thúc:</span>
                                                                <span>{formatDate(journey.endTime)}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <DashboardOutlined className="mr-2 text-gray-500" />
                                                                <span className="font-medium mr-1">Tổng quãng đường:</span>
                                                                <span>{journey.totalDistance} km</span>
                                                            </div>
                                                            {journey.isReportedIncident && (
                                                                <div className="mt-2">
                                                                    <Tag color="red" icon={<ToolOutlined />}>Có báo cáo sự cố</Tag>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ),
                                                }))}
                                            />
                                        ) : (
                                            <Empty description="Không có lịch sử hành trình nào" />
                                        )}
                                    </TabPane>

                                    {/* Tab hình ảnh hoàn thành */}
                                    <TabPane
                                        tab={
                                            <span>
                                                <CameraOutlined /> Hình ảnh hoàn thành
                                            </span>
                                        }
                                        key="photos"
                                    >
                                        {(vaGroup.vehicleAssignment as any)?.photoCompletions && (vaGroup.vehicleAssignment as any).photoCompletions.length > 0 ? (
                                            <div className="p-2">
                                                <div className="flex items-center mb-3">
                                                    <CameraOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Hình ảnh hoàn thành:</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(vaGroup.vehicleAssignment as any).photoCompletions.map((url: string, photoIdx: number) => (
                                                        <Image
                                                            key={photoIdx}
                                                            src={url}
                                                            alt={`Completion photo ${photoIdx + 1}`}
                                                            width={100}
                                                            height={100}
                                                            className="object-cover rounded"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <Empty description="Không có hình ảnh hoàn thành" />
                                        )}
                                    </TabPane>

                                    {/* Tab sự cố */}
                                    <TabPane
                                        tab={
                                            <span>
                                                <ToolOutlined /> Sự cố
                                            </span>
                                        }
                                        key="issues"
                                    >
                                        {vaGroup.vehicleAssignment?.issues && vaGroup.vehicleAssignment.issues.length > 0 ? (
                                            vaGroup.vehicleAssignment.issues.map((issueItem, idx) => (
                                                <div key={issueItem.issue.id} className={idx > 0 ? "mt-6 pt-6 border-t" : ""}>
                                                    <div className="bg-red-50 p-4 rounded-lg mb-3">
                                                        <div className="flex items-center mb-3">
                                                            <ToolOutlined className="text-red-500 mr-2" />
                                                            <span className="font-medium">Mô tả sự cố:</span>
                                                            <span className="ml-2">{issueItem.issue.description}</span>
                                                            <Tag className="ml-2" color={
                                                                issueItem.issue.status === "ACTIVE" ? "green" :
                                                                    issueItem.issue.status === "RESOLVED" ? "blue" : "red"
                                                            }>
                                                                {issueItem.issue.status}
                                                            </Tag>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="flex items-center">
                                                                <TagOutlined className="mr-2 text-gray-500" />
                                                                <span className="font-medium mr-1">Loại sự cố:</span>
                                                                <span>{issueItem.issue.issueTypeName}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <UserOutlined className="mr-2 text-gray-500" />
                                                                <span className="font-medium mr-1">Nhân viên xử lý:</span>
                                                                <span>{issueItem.issue.staff.name}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <PhoneOutlined className="mr-2 text-gray-500" />
                                                                <span className="font-medium mr-1">Liên hệ:</span>
                                                                <span>{issueItem.issue.staff.phone}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <EnvironmentOutlined className="mr-2 text-gray-500" />
                                                                <span className="font-medium mr-1">Vị trí:</span>
                                                                <span>{issueItem.issue.locationLatitude}, {issueItem.issue.locationLongitude}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {issueItem.imageUrls && issueItem.imageUrls.length > 0 ? (
                                                        <div className="mt-4">
                                                            <div className="flex items-center mb-2">
                                                                <CameraOutlined className="mr-2 text-blue-500" />
                                                                <span className="font-medium">Hình ảnh:</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {issueItem.imageUrls.map((url, imgIdx) => (
                                                                    <Image
                                                                        key={imgIdx}
                                                                        src={url}
                                                                        alt={`Issue image ${imgIdx + 1}`}
                                                                        width={100}
                                                                        height={100}
                                                                        className="object-cover rounded"
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4 text-gray-500">
                                                            <CameraOutlined className="mr-2" />
                                                            <span>Chưa có hình ảnh</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <Empty description="Không có sự cố nào được ghi nhận" />
                                        )}
                                    </TabPane>

                                    {/* Tab niêm phong */}
                                    <TabPane
                                        tab={
                                            <span>
                                                <FileTextOutlined /> Niêm phong
                                            </span>
                                        }
                                        key="seals"
                                    >
                                        {vaGroup.vehicleAssignment?.orderSeals && vaGroup.vehicleAssignment.orderSeals.length > 0 ? (
                                            vaGroup.vehicleAssignment.orderSeals.map((seal, sealIdx) => (
                                                <div key={seal.id} className={`${sealIdx > 0 ? "mt-3" : ""} bg-gray-50 p-4 rounded-lg`}>
                                                    <div className="flex items-center mb-2">
                                                        <FileTextOutlined className="mr-2 text-blue-500" />
                                                        <span className="font-medium mr-1">Mô tả:</span>
                                                        <span>{seal.description}</span>
                                                    </div>
                                                    <div className="flex items-center mb-2">
                                                        <CalendarOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Ngày niêm phong:</span>
                                                        <span>{formatDate(seal.sealDate)}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <TagOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Trạng thái:</span>
                                                        <Tag color={
                                                            seal.status === "ACTIVE" ? "green" :
                                                                seal.status === "BROKEN" ? "red" : "blue"
                                                        }>
                                                            {seal.status}
                                                        </Tag>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <Empty description="Không có thông tin niêm phong" />
                                        )}
                                    </TabPane>

                                    {/* Tab tiêu thụ nhiên liệu */}
                                    <TabPane
                                        tab={
                                            <span>
                                                <FireOutlined /> Tiêu thụ nhiên liệu
                                            </span>
                                        }
                                        key="fuel"
                                    >
                                        {vaGroup.vehicleAssignment?.fuelConsumption ? (
                                            <div className="p-2">
                                                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="flex items-center">
                                                            <DashboardOutlined className="mr-2 text-gray-500" />
                                                            <span className="font-medium mr-1">Chỉ số đồng hồ khi nạp:</span>
                                                            <span>{vaGroup.vehicleAssignment.fuelConsumption.odometerReadingAtRefuel} km</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <FireOutlined className="mr-2 text-gray-500" />
                                                            <span className="font-medium mr-1">Loại nhiên liệu:</span>
                                                            <span>{vaGroup.vehicleAssignment.fuelConsumption.fuelTypeName}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <FileTextOutlined className="mr-2 text-gray-500" />
                                                            <span className="font-medium mr-1">Mô tả nhiên liệu:</span>
                                                            <span>{vaGroup.vehicleAssignment.fuelConsumption.fuelTypeDescription}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <CalendarOutlined className="mr-2 text-gray-500" />
                                                            <span className="font-medium mr-1">Ngày ghi nhận:</span>
                                                            <span>{formatDate(vaGroup.vehicleAssignment.fuelConsumption.dateRecorded)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3">
                                                        <div className="flex items-start">
                                                            <FileTextOutlined className="mr-2 text-gray-500 mt-1" />
                                                            <span className="font-medium mr-1">Ghi chú:</span>
                                                            <span>{vaGroup.vehicleAssignment.fuelConsumption.notes || "Không có ghi chú"}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {vaGroup.vehicleAssignment.fuelConsumption.odometerAtStartUrl && (
                                                        <div>
                                                            <div className="flex items-center mb-2">
                                                                <DashboardOutlined className="mr-2 text-blue-500" />
                                                                <span className="font-medium">Đồng hồ khi bắt đầu</span>
                                                            </div>
                                                            <Image
                                                                src={vaGroup.vehicleAssignment.fuelConsumption.odometerAtStartUrl}
                                                                alt="Odometer at start"
                                                                className="object-cover rounded"
                                                            />
                                                        </div>
                                                    )}
                                                    {vaGroup.vehicleAssignment.fuelConsumption.odometerAtFinishUrl && (
                                                        <div>
                                                            <div className="flex items-center mb-2">
                                                                <DashboardOutlined className="mr-2 text-blue-500" />
                                                                <span className="font-medium">Đồng hồ khi hoàn thành</span>
                                                            </div>
                                                            <Image
                                                                src={vaGroup.vehicleAssignment.fuelConsumption.odometerAtFinishUrl}
                                                                alt="Odometer at finish"
                                                                className="object-cover rounded"
                                                            />
                                                        </div>
                                                    )}
                                                    {vaGroup.vehicleAssignment.fuelConsumption.odometerAtEndUrl && (
                                                        <div>
                                                            <div className="flex items-center mb-2">
                                                                <DashboardOutlined className="mr-2 text-blue-500" />
                                                                <span className="font-medium">Đồng hồ khi kết thúc</span>
                                                            </div>
                                                            <Image
                                                                src={vaGroup.vehicleAssignment.fuelConsumption.odometerAtEndUrl}
                                                                alt="Odometer at end"
                                                                className="object-cover rounded"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <Empty description="Không có dữ liệu tiêu thụ nhiên liệu" />
                                        )}
                                    </TabPane>

                                    {/* Tab theo dõi camera */}
                                    <TabPane
                                        tab={
                                            <span>
                                                <CameraOutlined /> Theo dõi camera
                                            </span>
                                        }
                                        key="camera"
                                    >
                                        {vaGroup.vehicleAssignment?.cameraTrackings && vaGroup.vehicleAssignment.cameraTrackings.length > 0 ? (
                                            vaGroup.vehicleAssignment.cameraTrackings.map((tracking, trackIdx) => (
                                                <div key={tracking.id} className={`${trackIdx > 0 ? "mt-4" : ""} bg-gray-50 p-4 rounded-lg`}>
                                                    <div className="flex items-center mb-2">
                                                        <CameraOutlined className="mr-2 text-blue-500" />
                                                        <span className="font-medium mr-1">Thiết bị:</span>
                                                        <span>{tracking.deviceName}</span>
                                                    </div>
                                                    <div className="flex items-center mb-2">
                                                        <CalendarOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Thời gian:</span>
                                                        <span>{formatDate(tracking.trackingAt)}</span>
                                                    </div>
                                                    <div className="flex items-center mb-2">
                                                        <TagOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Trạng thái:</span>
                                                        <Tag color={
                                                            tracking.status === "ACTIVE" ? "green" :
                                                                tracking.status === "INACTIVE" ? "red" : "blue"
                                                        }>
                                                            {tracking.status}
                                                        </Tag>
                                                    </div>
                                                    {tracking.videoUrl && (
                                                        <div className="mt-2">
                                                            <a href={tracking.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center">
                                                                <CameraOutlined className="mr-2" />
                                                                Xem video
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <Empty description="Không có dữ liệu camera" />
                                        )}
                                    </TabPane>
                                </Tabs>
                            </Card>
                        </TabPane>
                    ))}
                </Tabs>
            );
        }

        // Nếu chưa phân công, hiển thị theo từng order detail như cũ
        return (
            <Tabs
                activeKey={activeDetailTab}
                onChange={setActiveDetailTab}
                type="card"
                className="order-detail-tabs"
            >
                {order.orderDetails.map((detail: StaffOrderDetailItem, index) => (
                    <TabPane
                        tab={`Kiện ${index + 1} - ${detail.trackingCode || ""}`}
                        key={index.toString()}
                    >
                        <Card
                            className="mb-6 shadow-md rounded-xl"
                            title={
                                <div className="flex items-center">
                                    <InfoCircleOutlined className="mr-2 text-blue-500" />
                                    <span className="font-medium">Thông tin chi tiết vận chuyển</span>
                                </div>
                            }
                        >
                            <Row gutter={[24, 16]}>
                                <Col xs={24} md={12}>
                                    <Card
                                        className="mb-4 h-full"
                                        size="small"
                                        title={
                                            <div className="flex items-center">
                                                <FileTextOutlined className="mr-2 text-blue-500" />
                                                <span className="font-medium">Thông tin cơ bản</span>
                                            </div>
                                        }
                                    >
                                        <div className="mb-3">
                                            <div className="flex items-center mb-1">
                                                <NumberOutlined className="mr-2 text-blue-500" />
                                                <Text strong>Mã theo dõi:</Text>
                                            </div>
                                            <div className="ml-6">{detail.trackingCode || "Chưa có"}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex items-center mb-1">
                                                <InfoCircleOutlined className="mr-2 text-blue-500" />
                                                <Text strong>Trạng thái:</Text>
                                            </div>
                                            <div className="ml-6">
                                                <Tag color={
                                                    detail.status === "PENDING" ? "orange" :
                                                        detail.status === "PROCESSING" ? "blue" :
                                                            detail.status === "DELIVERED" || detail.status === "SUCCESSFUL" ? "green" :
                                                                detail.status === "CANCELLED" || detail.status === "IN_TROUBLES" ? "red" :
                                                                    "default"
                                                }>
                                                    {detail.status}
                                                </Tag>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex items-center mb-1">
                                                <ColumnWidthOutlined className="mr-2 text-blue-500" />
                                                <Text strong>Trọng lượng:</Text>
                                            </div>
                                            <div className="ml-6">{detail.weightBaseUnit} {detail.unit}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex items-center mb-1">
                                                <FileTextOutlined className="mr-2 text-blue-500" />
                                                <Text strong>Mô tả:</Text>
                                            </div>
                                            <div className="ml-6">{detail.description || "Không có mô tả"}</div>
                                        </div>
                                    </Card>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Card
                                        className="mb-4 h-full"
                                        size="small"
                                        title={
                                            <div className="flex items-center">
                                                <ClockCircleOutlined className="mr-2 text-blue-500" />
                                                <span className="font-medium">Thông tin thời gian</span>
                                            </div>
                                        }
                                    >
                                        <div className="mb-3">
                                            <div className="flex items-center mb-1">
                                                <ClockCircleOutlined className="mr-2 text-blue-500" />
                                                <Text strong>Thời gian bắt đầu:</Text>
                                            </div>
                                            <div className="ml-6">{formatDate(detail.startTime)}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex items-center mb-1">
                                                <ClockCircleOutlined className="mr-2 text-blue-500" />
                                                <Text strong>Thời gian kết thúc:</Text>
                                            </div>
                                            <div className="ml-6">{formatDate(detail.endTime)}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex items-center mb-1">
                                                <ClockCircleOutlined className="mr-2 text-blue-500" />
                                                <Text strong>Thời gian dự kiến bắt đầu:</Text>
                                            </div>
                                            <div className="ml-6">{formatDate(detail.estimatedStartTime)}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="flex items-center mb-1">
                                                <ClockCircleOutlined className="mr-2 text-blue-500" />
                                                <Text strong>Thời gian dự kiến kết thúc:</Text>
                                            </div>
                                            <div className="ml-6">{formatDate(detail.estimatedEndTime)}</div>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>

                            <Divider />

                            <Row gutter={[24, 16]}>
                                <Col xs={24} md={12}>
                                    {/* Order Size Information */}
                                    {detail.orderSize && (
                                        <Card
                                            className="mb-4"
                                            size="small"
                                            title={
                                                <div className="flex items-center">
                                                    <BoxPlotOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Thông tin kích thước</span>
                                                </div>
                                            }
                                        >
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
                                </Col>

                                <Col xs={24} md={12}>
                                    {/* Placeholder for any additional information */}
                                    {/* You can add more information here if needed */}
                                </Col>
                            </Row>

                            {/* Vehicle Assignment Information in a separate row */}
                            <Row>
                                <Col xs={24}>
                                    {detail.vehicleAssignment ? (
                                        <VehicleInfoSection vehicleAssignment={detail.vehicleAssignment} />
                                    ) : (
                                        <Card
                                            className="mb-4"
                                            size="small"
                                            title={
                                                <div className="flex items-center">
                                                    <CarOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Thông tin phương tiện vận chuyển</span>
                                                </div>
                                            }
                                        >
                                            <div className="text-center py-4">
                                                <p className="text-gray-500 mb-4">Chưa có thông tin phân công xe</p>
                                                {order.status === OrderStatusEnum.ON_PLANNING && (
                                                    <Button
                                                        type="primary"
                                                        icon={<CarOutlined />}
                                                        onClick={() => setVehicleAssignmentModalVisible(true)}
                                                        className="bg-blue-500 hover:bg-blue-600"
                                                    >
                                                        Phân công xe
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    )}
                                </Col>
                            </Row>
                        </Card>
                    </TabPane>
                ))}
            </Tabs>
        );
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="mb-6 flex flex-wrap items-center justify-between">
                <div className="flex items-center mb-2 md:mb-0">
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate(-1)}
                        className="mr-4"
                    >
                        Quay lại
                    </Button>
                    <Title level={2} className="m-0">
                        Chi tiết đơn hàng {order.orderCode}
                    </Title>
                </div>
            </div>

            <Tabs
                activeKey={activeMainTab}
                onChange={setActiveMainTab}
                type="card"
                className="order-main-tabs"
            >
                <TabPane
                    tab={
                        <span>
                            <InfoCircleOutlined /> Thông tin cơ bản
                        </span>
                    }
                    key="basic"
                >
                    {renderBasicInfoTab()}
                </TabPane>
                <TabPane
                    tab={
                        <span>
                            <CarOutlined /> Chi tiết vận chuyển
                        </span>
                    }
                    key="detail"
                >
                    {renderOrderDetailTab()}
                </TabPane>
                <TabPane
                    tab={
                        <span>
                            <ProfileOutlined /> Hợp đồng & Thanh toán
                        </span>
                    }
                    key="history"
                >
                    <div>
                        {/* Contract Information */}
                        {contract && <ContractSection contract={contract} />}

                        {/* Transaction Information */}
                        {transactions && transactions.length > 0 ? (
                            <TransactionSection transactions={transactions} />
                        ) : (
                            <Card className="shadow-md rounded-xl">
                                <Empty description="Không có thông tin giao dịch" />
                            </Card>
                        )}
                    </div>
                </TabPane>
            </Tabs>

            {/* Vehicle Assignment Modal */}
            {id && orderData && orderData.order && orderData.order.orderDetails && (
                <VehicleAssignmentModal
                    visible={vehicleAssignmentModalVisible}
                    orderId={id}
                    orderDetails={orderData.order.orderDetails}
                    onClose={() => setVehicleAssignmentModalVisible(false)}
                    onSuccess={handleVehicleAssignmentSuccess}
                />
            )}
        </div>
    );
};

export default StaffOrderDetail; 