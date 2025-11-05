import React from "react";
import { Empty, Tabs, Card, Typography, Tag } from "antd";
import {
    BoxPlotOutlined,
    CarOutlined,
    TagOutlined,
    UserOutlined,
    PhoneOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import OrderLiveTrackingOnly from "./OrderLiveTrackingOnly";
import VehicleAssignmentSection from "./VehicleAssignmentSection";
import OrderDetailStatusCard from "../../../../components/common/OrderDetailStatusCard";
import { OrderStatusEnum } from "../../../../constants/enums";

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

    // Memoize shouldShowRealTimeTracking to prevent unnecessary re-renders of OrderLiveTrackingOnly
    const shouldShowRealTimeTracking = React.useMemo(
        () => REAL_TIME_TRACKING_STATUSES.includes(order.status as OrderStatusEnum),
        [order.status]
    );

    // Auto scroll to live tracking when component mounts or order status changes to tracking status
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
            // Delay to ensure component is fully rendered
            setTimeout(() => {
                liveTrackingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }, [order.status]); // Re-run when order status changes

    if (!order.orderDetails || order.orderDetails.length === 0) {
        return <Empty description="Chưa có thông tin chi tiết vận chuyển" />;
    }

    // Kiểm tra xem có vehicle assignment không
    const hasVehicleAssignment = order.vehicleAssignments && order.vehicleAssignments.length > 0;

    // Nếu có vehicle assignment, hiển thị theo vehicle assignment
    if (hasVehicleAssignment) {
        return (
            <>
                {/* Gộp thông tin chuyến xe + các tab chi tiết */}
                <VehicleAssignmentSection
                    vehicleAssignments={order.vehicleAssignments}
                    orderDetails={order.orderDetails}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                />
            </>
        );
    }

    // Nếu chưa phân công, hiển thị theo từng order detail như cũ
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
                    {/* Thông tin chi tiết vận chuyển */}
                    <Card className="mb-6 shadow-md rounded-xl">
                        <Title level={5} className="mb-4">
                            Thông tin chi tiết vận chuyển
                        </Title>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="mb-4">
                                <h3 className="text-md font-medium mb-3 text-gray-700">
                                    Thông tin cơ bản
                                </h3>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                                Thông tin
                                            </th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                                Chi tiết
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-2">Mã theo dõi</td>
                                            <td className="border border-gray-300 p-2">
                                                {detail.trackingCode || "Chưa có"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 p-2">Trạng thái</td>
                                            <td className="border border-gray-300 p-2">
                                                <OrderDetailStatusCard status={detail.status} />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 p-2">Trọng lượng</td>
                                            <td className="border border-gray-300 p-2">
                                                {detail.weightBaseUnit} {detail.unit}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 p-2">Mô tả</td>
                                            <td className="border border-gray-300 p-2">
                                                {detail.description || "Không có mô tả"}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-md font-medium mb-3 text-gray-700">
                                    Thông tin thời gian
                                </h3>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                                Thời gian
                                            </th>
                                            <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                                Ngày giờ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-2">
                                                Thời gian bắt đầu
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {detail.startTime
                                                    ? formatDate(detail.startTime)
                                                    : "Chưa có thông tin"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 p-2">
                                                Thời gian kết thúc
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {detail.endTime
                                                    ? formatDate(detail.endTime)
                                                    : "Chưa có thông tin"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 p-2">
                                                Thời gian dự kiến bắt đầu
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {detail.estimatedStartTime
                                                    ? formatDate(detail.estimatedStartTime)
                                                    : "Chưa có thông tin"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="border border-gray-300 p-2">
                                                Thời gian dự kiến kết thúc
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {detail.estimatedEndTime
                                                    ? formatDate(detail.estimatedEndTime)
                                                    : "Chưa có thông tin"}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Card>

                    {/* Thông tin kích thước */}
                    {detail.orderSize && (
                        <Card className="mb-6 shadow-md rounded-xl">
                            <Title level={5} className="mb-4">
                                Thông tin kích thước
                            </Title>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                            Mô tả
                                        </th>
                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">
                                            Kích thước (Dài x Rộng x Cao)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 p-2">
                                            {detail.orderSize.description}
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            {`${detail.orderSize.minLength} x ${detail.orderSize.minWidth} x ${detail.orderSize.minHeight} m - 
                      ${detail.orderSize.maxLength} x ${detail.orderSize.maxWidth} x ${detail.orderSize.maxHeight} m`}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Card>
                    )}

                    {/* Thông tin chuyến xe */}
                    {detail.vehicleAssignment ? (
                        <Card className="mb-6 shadow-md rounded-xl">
                            <Title level={5} className="mb-4">
                                Thông tin chuyến xe
                            </Title>
                            <div className="p-2">
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
                                                {detail.vehicleAssignment.vehicle?.vehicleType || "Chưa có thông tin"}
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
                            </div>
                        </Card>
                    ) : (
                        <Card className="mb-6 shadow-md rounded-xl">
                            <Title level={5} className="mb-4">
                                Thông tin chuyến xe
                            </Title>

                            <div className="text-center py-8">
                                <Empty
                                    description={
                                        <div>
                                            <p className="text-gray-500 mb-2">Chưa có Thông tin chuyến xe</p>
                                            <p className="text-gray-400 text-sm">
                                                Đơn hàng sẽ được gán phương tiện vận chuyển trong thời gian
                                                tới
                                            </p>
                                        </div>
                                    }
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                />
                            </div>
                        </Card>
                    )}
                </TabPane>
            ))}
        </Tabs>
    );
};

export default React.memo(OrderDetailsTab, (prevProps, nextProps) => {
    // Return TRUE to SKIP re-render, FALSE to DO re-render
    if (prevProps.order?.id !== nextProps.order?.id) return false;
    if (prevProps.order?.status !== nextProps.order?.status) return false;
    if (prevProps.order?.vehicleAssignments?.length !== nextProps.order?.vehicleAssignments?.length) return false;
    if (prevProps.activeDetailTab !== nextProps.activeDetailTab) return false;
    
    // All checks passed - props are the same, SKIP re-render
    return true;
}); 