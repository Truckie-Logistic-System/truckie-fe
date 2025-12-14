import React from "react";
import { Empty, Tabs, Card, Typography, Tag, Row, Col, Divider } from "antd";
import {
    BoxPlotOutlined,
    CarOutlined,
    TagOutlined,
    UserOutlined,
    PhoneOutlined,
    NumberOutlined,
    InfoCircleOutlined,
    ClockCircleOutlined,
    FileTextOutlined,
    ColumnWidthOutlined,
    ExpandOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import OrderLiveTrackingOnly from "./OrderLiveTrackingOnly";
import VehicleAssignmentSection from "./VehicleAssignmentSection";
import OrderDetailStatusCard from "../../../../components/common/OrderDetailStatusCard";
import OrderSizeBadge from "../../../../components/common/OrderSizeBadge";
import { OrderStatusEnum, getOrderSizeLabel } from "../../../../constants/enums";

dayjs.extend(utc);
dayjs.extend(timezone);

const { TabPane } = Tabs;
const { Title } = Typography;

// STABLE CONSTANTS - prevent re-renders
const REAL_TIME_TRACKING_STATUSES = [
    OrderStatusEnum.PICKING_UP,
    OrderStatusEnum.ON_DELIVERED,
    OrderStatusEnum.ONGOING_DELIVERED,
    OrderStatusEnum.DELIVERED,
    OrderStatusEnum.IN_TROUBLES,
    OrderStatusEnum.RESOLVED,
    OrderStatusEnum.COMPENSATION,
    OrderStatusEnum.SUCCESSFUL,
    OrderStatusEnum.RETURNING,
    OrderStatusEnum.RETURNED
];

interface OrderDetailsTabProps {
    order: any;
    activeDetailTab: string;
    onTabChange: (key: string) => void;
    formatDate: (date?: string) => string;
    getStatusColor: (status: string) => string;
}

const OrderDetailsTab: React.FC<OrderDetailsTabProps> = ({
    order,
    activeDetailTab,
    onTabChange,
    formatDate,
    getStatusColor,
}) => {
    const liveTrackingRef = React.useRef<HTMLDivElement>(null);

    const shouldShowRealTimeTracking = React.useMemo(
        () => REAL_TIME_TRACKING_STATUSES.includes(order.status as OrderStatusEnum),
        [order.status]
    );

    React.useEffect(() => {
        const REAL_TIME_TRACKING_STATUSES = [
            'PICKING_UP',
            'ON_DELIVERED',
            'ONGOING_DELIVERED',
            'DELIVERED',
            'IN_TROUBLES',
            'RESOLVED',
            'COMPENSATION',
            'SUCCESSFUL',
            'RETURNING',
            'RETURNED'
        ];

        if (
            liveTrackingRef.current &&
            REAL_TIME_TRACKING_STATUSES.includes(order.status)
        ) {
            setTimeout(() => {
                liveTrackingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [order.status]);

    if (!order.orderDetails || order.orderDetails.length === 0) {
        return <Empty description="Chưa có thông tin chi tiết vận chuyển" />;
    }

    const hasVehicleAssignment = order.vehicleAssignments && order.vehicleAssignments.length > 0;

    if (hasVehicleAssignment) {
        return (
            <>
                <VehicleAssignmentSection
                    vehicleAssignments={order.vehicleAssignments}
                    orderDetails={order.orderDetails}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                />
            </>
        );
    }

    return (
        <Tabs
            activeKey={activeDetailTab}
            onChange={onTabChange}
            type="card"
            className="order-detail-tabs"
        >
            {order.orderDetails.map((detail: any, index: number) => (
                <TabPane
                    tab={
                        <span>
                            <BoxPlotOutlined /> Kiện {index + 1}{" "}
                            {detail.trackingCode ? `- ${detail.trackingCode} ` : ""}
                        </span>
                    }
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
                            <Col xs={24}>
                                <Card
                                    className="h-full border border-blue-100"
                                    size="small"
                                    title={
                                        <div className="flex items-center">
                                            <FileTextOutlined className="mr-2 text-blue-500" />
                                            <span className="font-medium text-blue-700">Thông tin cơ bản</span>
                                        </div>
                                    }
                                >
                                    <div className="space-y-4">
                                        {/* Tracking Code */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                                            <div className="flex items-center mb-2">
                                                <NumberOutlined className="mr-2 text-blue-600" />
                                                <span className="font-medium text-gray-700 text-sm">Mã theo dõi</span>
                                            </div>
                                            <div className="ml-6">
                                                <span className="font-mono text-lg font-semibold text-blue-800">
                                                    {detail.trackingCode || "Chưa có"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100">
                                            <div className="flex items-center mb-2">
                                                <InfoCircleOutlined className="mr-2 text-purple-600" />
                                                <span className="font-medium text-gray-700 text-sm">Trạng thái</span>
                                            </div>
                                            <div className="ml-6">
                                                <OrderDetailStatusCard status={detail.status} />
                                            </div>
                                        </div>

                                        {/* Weight */}
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                                            <div className="flex items-center mb-2">
                                                <ColumnWidthOutlined className="mr-2 text-green-600" />
                                                <span className="font-medium text-gray-700 text-sm">Trọng lượng</span>
                                            </div>
                                            <div className="ml-6">
                                                <span className="font-semibold text-green-800 text-lg">
                                                    {detail.weightBaseUnit} {detail.unit}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
                                            <div className="flex items-center mb-2">
                                                <FileTextOutlined className="mr-2 text-amber-600" />
                                                <span className="font-medium text-gray-700 text-sm">Mô tả</span>
                                            </div>
                                            <div className="ml-6">
                                                <span className="text-gray-700">
                                                    {detail.description || "Không có mô tả"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Estimated Start Time */}
                                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-100">
                                            <div className="flex items-center mb-2">
                                                <ClockCircleOutlined className="mr-2 text-blue-600" />
                                                <span className="font-medium text-gray-700 text-sm">Thời gian dự kiến bắt đầu</span>
                                            </div>
                                            <div className="ml-6">
                                                {detail.estimatedStartTime ? (
                                                    <div>
                                                        <span className="font-semibold text-blue-800">
                                                            {formatDate(detail.estimatedStartTime)}
                                                        </span>
                                                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                            Dự kiến
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 italic">Chưa có thông tin</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        </Row>

                        <Divider />

                        <Row gutter={[24, 16]}>
                            <Col xs={24} md={12}>
                                {detail.orderSize && (
                                    <Card
                                        size="small"
                                        title={
                                            <div className="flex items-center">
                                                <BoxPlotOutlined className="mr-2 text-blue-500" />
                                                <span className="font-medium">Thông tin kích thước</span>
                                            </div>
                                        }
                                    >
                                        <div className="mb-4">
                                            <div className="flex items-center mb-2">
                                                <TagOutlined className="mr-2 text-blue-500" />
                                                <span className="font-medium text-gray-700">Loại kích thước:</span>
                                            </div>
                                            <div className="ml-6">
                                                <OrderSizeBadge
                                                    description={detail.orderSize.description}
                                                    size="medium"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center mb-2">
                                                <ExpandOutlined className="mr-2 text-blue-500" />
                                                <span className="font-medium text-gray-700">Phạm vi kích thước:</span>
                                            </div>
                                            <div className="ml-6 text-gray-600">
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <div className="bg-gray-50 p-2 rounded text-center">
                                                        <div className="text-gray-500 text-xs">Dài</div>
                                                        <div className="font-medium">{detail.orderSize.minLength} - {detail.orderSize.maxLength} m</div>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded text-center">
                                                        <div className="text-gray-500 text-xs">Rộng</div>
                                                        <div className="font-medium">{detail.orderSize.minWidth} - {detail.orderSize.maxWidth} m</div>
                                                    </div>
                                                    <div className="bg-gray-50 p-2 rounded text-center">
                                                        <div className="text-gray-500 text-xs">Cao</div>
                                                        <div className="font-medium">{detail.orderSize.minHeight} - {detail.orderSize.maxHeight} m</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                )}
                            </Col>
                            <Col xs={24} md={12}>
                                {/* Placeholder for future content or balance layout */}
                            </Col>
                        </Row>

                        <Divider />

                        <Row>
                            <Col xs={24}>
                                {detail.vehicleAssignment ? (
                                    <Card
                                        size="small"
                                        title={
                                            <div className="flex items-center">
                                                <CarOutlined className="mr-2 text-blue-500" />
                                                <span className="font-medium">Thông tin chuyến xe</span>
                                            </div>
                                        }
                                    >
                                        <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                                            <div className="flex items-center mb-3">
                                                <CarOutlined className="text-xl text-blue-500 mr-3" />
                                                <span className="text-lg font-medium">
                                                    {detail.vehicleAssignment.vehicle?.licensePlateNumber || "Chưa có thông tin"}
                                                </span>
                                                <Tag
                                                    className="ml-3"
                                                    color={getStatusColor(detail.vehicleAssignment.status || "")}
                                                >
                                                    {detail.vehicleAssignment.status}
                                                </Tag>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="flex items-center">
                                                    <TagOutlined className="mr-2 text-gray-500" />
                                                    <span className="font-medium mr-1">Nhà sản xuất:</span>
                                                    <span>
                                                        {detail.vehicleAssignment.vehicle?.manufacturer || "Chưa có thông tin"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <CarOutlined className="mr-2 text-gray-500" />
                                                    <span className="font-medium mr-1">Mẫu xe:</span>
                                                    <span>
                                                        {detail.vehicleAssignment.vehicle?.model || "Chưa có thông tin"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <TagOutlined className="mr-2 text-gray-500" />
                                                    <span className="font-medium mr-1">Loại xe:</span>
                                                    <span>
                                                        {detail.vehicleAssignment.vehicle?.vehicleTypeDescription || "Chưa có thông tin"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <div className="flex items-center mb-2">
                                                    <UserOutlined className="text-green-500 mr-2" />
                                                    <span className="font-medium">Tài xế chính</span>
                                                </div>
                                                {detail.vehicleAssignment.primaryDriver ? (
                                                    <div className="ml-6">
                                                        <div className="flex items-center mb-1">
                                                            <UserOutlined className="mr-2 text-gray-500" />
                                                            <span>{detail.vehicleAssignment.primaryDriver.fullName}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <PhoneOutlined className="mr-2 text-gray-500" />
                                                            <span>{detail.vehicleAssignment.primaryDriver.phoneNumber}</span>
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
                                                {detail.vehicleAssignment.secondaryDriver ? (
                                                    <div className="ml-6">
                                                        <div className="flex items-center mb-1">
                                                            <UserOutlined className="mr-2 text-gray-500" />
                                                            <span>{detail.vehicleAssignment.secondaryDriver.fullName}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <PhoneOutlined className="mr-2 text-gray-500" />
                                                            <span>{detail.vehicleAssignment.secondaryDriver.phoneNumber}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="ml-6 text-gray-500">Chưa có thông tin</div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ) : (
                                    <Card
                                        size="small"
                                        title={
                                            <div className="flex items-center">
                                                <CarOutlined className="mr-2 text-blue-500" />
                                                <span className="font-medium">Thông tin chuyến xe</span>
                                            </div>
                                        }
                                    >
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <div className="mb-4">
                                                <CarOutlined className="text-4xl text-gray-300" />
                                            </div>
                                            <p className="text-gray-500 mb-2 font-medium">Chưa có thông tin chuyến xe</p>
                                            <p className="text-gray-400 text-sm">
                                                Đơn hàng sẽ được gán phương tiện vận chuyển trong thời gian tới
                                            </p>
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

export default React.memo(OrderDetailsTab, (prevProps, nextProps) => {
    if (prevProps.order?.id !== nextProps.order?.id) return false;
    if (prevProps.order?.status !== nextProps.order?.status) return false;
    if (prevProps.order?.vehicleAssignments?.length !== nextProps.order?.vehicleAssignments?.length) return false;
    if (prevProps.activeDetailTab !== nextProps.activeDetailTab) return false;
    
    // All checks passed - props are the same, SKIP re-render
    return true;
}); 