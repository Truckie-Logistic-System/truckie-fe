import React, { useState, useMemo } from "react";
import { Empty, Tabs, Card, Tag } from "antd";
import { BoxPlotOutlined, CarOutlined, FileTextOutlined, ToolOutlined, CameraOutlined, EnvironmentOutlined, UserOutlined, PhoneOutlined, TagOutlined } from "@ant-design/icons";
import type { StaffOrderDetailItem } from "../../../../../models/Order";
import AdditionalNavTabs from "./AdditionalNavTabs";
import { OrderStatusEnum } from "../../../../../constants/enums/OrderStatusEnum";
import { useVehicleTracking } from "../../../../../hooks/useVehicleTracking";
import RouteMapWithRealTimeTracking from "./RouteMapWithRealTimeTracking";

// Import missing components that need to be created
import OrderDetailPackageTab from "./OrderDetailPackageTab";

const { TabPane } = Tabs;

interface VehicleAssignmentGroup {
    vehicleAssignment: any;
    orderDetails: StaffOrderDetailItem[];
}

interface OrderDetailTabsProps {
    order: any;
    formatDate: (dateString?: string) => string;
    setVehicleAssignmentModalVisible: (visible: boolean) => void;
}

const OrderDetailTabs: React.FC<OrderDetailTabsProps> = ({
    order,
    formatDate,
    setVehicleAssignmentModalVisible,
}) => {
    const [activeDetailTab, setActiveDetailTab] = useState<string>("0");

    // Kiểm tra xem có nên hiển thị tracking thời gian thực không (từ PICKING_UP trở đi)
    const shouldShowRealTimeTracking = useMemo(() => {
        if (!order?.status) return false;
        
        // Danh sách các trạng thái từ PICKING_UP trở về sau
        const trackingStatuses = [
            OrderStatusEnum.PICKING_UP,
            OrderStatusEnum.SEALED_COMPLETED,
            OrderStatusEnum.ON_DELIVERED,
            OrderStatusEnum.ONGOING_DELIVERED,
            OrderStatusEnum.IN_DELIVERED,
            OrderStatusEnum.IN_TROUBLES,
            OrderStatusEnum.RESOLVED,
            OrderStatusEnum.COMPENSATION,
            OrderStatusEnum.DELIVERED,
            OrderStatusEnum.SUCCESSFUL,
            OrderStatusEnum.RETURNING,
            OrderStatusEnum.RETURNED
        ];
        
        return trackingStatuses.includes(order.status as OrderStatusEnum);
    }, [order?.status]);

    // Sử dụng WebSocket hook cho tracking xe
    const {
        vehicleLocations,
        isConnected,
        isConnecting,
        error: trackingError,
    } = useVehicleTracking({
        orderId: shouldShowRealTimeTracking ? order?.id : undefined,
        autoConnect: shouldShowRealTimeTracking,
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
    });

    console.log('[OrderDetailTabs] Real-time tracking status (from PICKING_UP):', {
        shouldShowRealTimeTracking,
        orderStatus: order?.status,
        orderId: order?.id,
        isConnected,
        isConnecting,
        vehicleLocationsCount: vehicleLocations.length,
        trackingError
    });

    if (!order.orderDetails || order.orderDetails.length === 0) {
        return <Empty description="Không có thông tin chi tiết vận chuyển" />;
    }

    // Kiểm tra xem có vehicle assignment không
    const hasVehicleAssignment = order.orderDetails.some((detail: StaffOrderDetailItem) => detail.vehicleAssignment);

    // Nếu có vehicle assignment, hiển thị theo vehicle assignment
    if (hasVehicleAssignment) {
        const vehicleAssignmentMap = new Map<string, VehicleAssignmentGroup>();

        order.orderDetails.forEach((detail: StaffOrderDetailItem) => {
            if (detail.vehicleAssignment) {
                const vaId = detail.vehicleAssignment.id;
                if (!vehicleAssignmentMap.has(vaId)) {
                    vehicleAssignmentMap.set(vaId, {
                        vehicleAssignment: detail.vehicleAssignment,
                        orderDetails: [],
                    });
                }
                vehicleAssignmentMap.get(vaId)?.orderDetails.push(detail);
            }
        });

        const vehicleAssignments = Array.from(vehicleAssignmentMap.values());

        if (vehicleAssignments.length === 0) {
            return <Empty description="Chưa có thông tin phân công xe" />;
        }

        const getStatusColor = (status: string) => {
            switch (status) {
                case "PENDING":
                    return "orange";
                case "PROCESSING":
                case "IN_PROGRESS":
                    return "blue";
                case "DELIVERED":
                case "SUCCESSFUL":
                case "COMPLETED":
                    return "green";
                case "CANCELLED":
                case "IN_TROUBLES":
                    return "red";
                default:
                    return "default";
            }
        };

        return (
            <>
                <Tabs
                    activeKey={activeDetailTab}
                    onChange={setActiveDetailTab}
                    type="card"
                    className="order-detail-tabs"
                >
                    {vehicleAssignments.map((vaGroup, index) => (
                        <TabPane
                            tab={
                                <span>
                                    <CarOutlined /> Chuyến xe #{index + 1} -{" "}
                                    {vaGroup.vehicleAssignment.trackingCode || "Chưa có mã"}
                                </span>
                            }
                            key={index.toString()}
                        >
                            {/* Thông tin phương tiện */}
                            <Card
                                className="shadow-md mb-6 rounded-xl"
                                size="small"
                            >
                                <div className="p-2">
                                    <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center mb-3">
                                            <CarOutlined className="text-xl text-blue-500 mr-3" />
                                            <span className="text-lg font-medium">
                                                {vaGroup.vehicleAssignment.vehicle?.licensePlateNumber || "Chưa có thông tin"}
                                            </span>
                                            <Tag
                                                className="ml-3"
                                                color={getStatusColor(vaGroup.vehicleAssignment.status || "")}
                                            >
                                                {vaGroup.vehicleAssignment.status}
                                            </Tag>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="flex items-center">
                                                <TagOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Nhà sản xuất:</span>
                                                <span>
                                                    {vaGroup.vehicleAssignment.vehicle?.manufacturer || "Chưa có thông tin"}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <CarOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Mẫu xe:</span>
                                                <span>
                                                    {vaGroup.vehicleAssignment.vehicle?.model || "Chưa có thông tin"}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <TagOutlined className="mr-2 text-gray-500" />
                                                <span className="font-medium mr-1">Loại xe:</span>
                                                <span>
                                                    {vaGroup.vehicleAssignment.vehicle?.vehicleType || "Chưa có thông tin"}
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
                                            {vaGroup.vehicleAssignment.primaryDriver ? (
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
                                            {vaGroup.vehicleAssignment.secondaryDriver ? (
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

                            {/* Thông tin chi tiết của các order details */}
                            {vaGroup.orderDetails.map((detail: StaffOrderDetailItem, detailIdx: number) => (
                                <Card key={detail.id} className="mb-6 shadow-md rounded-xl">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-blue-600">
                                            Kiện {detailIdx + 1} - {detail.trackingCode || "Chưa có mã"}
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Thông tin cơ bản */}
                                        <Card
                                            className="h-full"
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
                                                    <TagOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Mã theo dõi:</span>
                                                </div>
                                                <div className="ml-6">
                                                    {detail.trackingCode || "Chưa có"}
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <div className="flex items-center mb-1">
                                                    <TagOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Trạng thái:</span>
                                                </div>
                                                <div className="ml-6">
                                                    <Tag color={getStatusColor(detail.status)}>
                                                        {detail.status}
                                                    </Tag>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <div className="flex items-center mb-1">
                                                    <TagOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Trọng lượng:</span>
                                                </div>
                                                <div className="ml-6">
                                                    {detail.weightBaseUnit} {detail.unit}
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <div className="flex items-center mb-1">
                                                    <FileTextOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Mô tả:</span>
                                                </div>
                                                <div className="ml-6">
                                                    {detail.description || "Không có mô tả"}
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Thông tin thời gian */}
                                        <Card
                                            className="h-full"
                                            size="small"
                                            title={
                                                <div className="flex items-center">
                                                    <TagOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Thông tin thời gian</span>
                                                </div>
                                            }
                                        >
                                            <div className="mb-3">
                                                <div className="flex items-center mb-1">
                                                    <TagOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Thời gian bắt đầu:</span>
                                                </div>
                                                <div className="ml-6">{formatDate(detail.startTime)}</div>
                                            </div>
                                            <div className="mb-3">
                                                <div className="flex items-center mb-1">
                                                    <TagOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Thời gian kết thúc:</span>
                                                </div>
                                                <div className="ml-6">{formatDate(detail.endTime)}</div>
                                            </div>
                                            <div className="mb-3">
                                                <div className="flex items-center mb-1">
                                                    <TagOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Thời gian dự kiến bắt đầu:</span>
                                                </div>
                                                <div className="ml-6">
                                                    {formatDate(detail.estimatedStartTime)}
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <div className="flex items-center mb-1">
                                                    <TagOutlined className="mr-2 text-blue-500" />
                                                    <span className="font-medium">Thời gian dự kiến kết thúc:</span>
                                                </div>
                                                <div className="ml-6">
                                                    {formatDate(detail.estimatedEndTime)}
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Thông tin kích thước */}
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
                                </Card>
                            ))}

                            {/* Tabs chi tiết */}
                            <Card className="mb-6 shadow-md rounded-xl">
                                <Tabs defaultActiveKey="orderDetails" type="card">
                                    {/* Tab danh sách lô hàng */}
                                    <Tabs.TabPane
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
                                                    {vaGroup.orderDetails.map((detail: StaffOrderDetailItem) => (
                                                        <tr key={detail.id}>
                                                            <td className="border border-gray-300 p-2">
                                                                {detail.trackingCode || "Chưa có"}
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                <Tag color={getStatusColor(detail.status)}>
                                                                    {detail.status}
                                                                </Tag>
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                {detail.weightBaseUnit} {detail.unit}
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                {detail.description || "Không có mô tả"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </Tabs.TabPane>

                                    {/* Tab lộ trình vận chuyển */}
                                    <Tabs.TabPane
                                        tab={
                                            <span>
                                                <EnvironmentOutlined /> Lộ trình vận chuyển
                                            </span>
                                        }
                                        key="journey"
                                    >
                                        <div className="space-y-4">
                                            {/* Hiển thị bản đồ với real-time tracking */}
                                            {vaGroup.vehicleAssignment.journeyHistories && vaGroup.vehicleAssignment.journeyHistories.length > 0 ? (
                                                <div className="p-2">
                                                    {vaGroup.vehicleAssignment.journeyHistories.map((journey: any, journeyIdx: number) => (
                                                        <div
                                                            key={journey.id || `journey-${journeyIdx}`}
                                                            className={journeyIdx > 0 ? "mt-4 pt-4 border-t border-gray-200" : ""}
                                                        >
                                                            {journey.journeySegments && journey.journeySegments.length > 0 && (
                                                                <RouteMapWithRealTimeTracking
                                                                    journeySegments={journey.journeySegments}
                                                                    journeyInfo={journey}
                                                                    orderId={order.id}
                                                                    shouldShowRealTimeTracking={shouldShowRealTimeTracking}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Empty description="Không có lịch sử hành trình nào" />
                                            )}
                                        </div>
                                    </Tabs.TabPane>

                                    {/* Tab sự cố */}
                                    <Tabs.TabPane
                                        tab={
                                            <span>
                                                <ToolOutlined /> Sự cố
                                            </span>
                                        }
                                        key="issues"
                                    >
                                        {vaGroup.vehicleAssignment.issues && vaGroup.vehicleAssignment.issues.length > 0 ? (
                                            <div className="p-2">
                                                {vaGroup.vehicleAssignment.issues.map((issueItem: any, issueIdx: number) => (
                                                    <div key={issueIdx} className="bg-red-50 p-4 rounded-lg mb-3">
                                                        <div className="flex items-center mb-3">
                                                            <span className="font-medium">Mô tả sự cố:</span>
                                                            <span className="ml-2">{issueItem.issue.description}</span>
                                                            <Tag
                                                                className="ml-2"
                                                                color={getStatusColor(issueItem.issue.status)}
                                                            >
                                                                {issueItem.issue.status}
                                                            </Tag>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {issueItem.issue.issueTypeName && (
                                                                <div className="flex items-center">
                                                                    <span className="font-medium mr-1">Loại sự cố:</span>
                                                                    <span>{issueItem.issue.issueTypeName}</span>
                                                                </div>
                                                            )}
                                                            {issueItem.issue.staff && (
                                                                <>
                                                                    <div className="flex items-center">
                                                                        <span className="font-medium mr-1">Nhân viên xử lý:</span>
                                                                        <span>{issueItem.issue.staff.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <span className="font-medium mr-1">Liên hệ:</span>
                                                                        <span>{issueItem.issue.staff.phone}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {issueItem.imageUrls && issueItem.imageUrls.length > 0 ? (
                                                            <div className="mt-4">
                                                                <div className="flex items-center mb-2">
                                                                    <span className="font-medium">Hình ảnh:</span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {issueItem.imageUrls.map((url: string, idx: number) => (
                                                                        <img
                                                                            key={idx}
                                                                            src={url}
                                                                            alt={`Issue image ${idx + 1}`}
                                                                            width={100}
                                                                            height={100}
                                                                            className="object-cover rounded"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-4 text-gray-500">
                                                                <span>Chưa có hình ảnh</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <Empty description="Không có sự cố nào được ghi nhận" />
                                        )}
                                    </Tabs.TabPane>

                                    {/* Tab niêm phong */}
                                    <Tabs.TabPane
                                        tab={
                                            <span>
                                                <FileTextOutlined /> Niêm phong
                                            </span>
                                        }
                                        key="seals"
                                    >
                                        {vaGroup.vehicleAssignment.orderSeals && vaGroup.vehicleAssignment.orderSeals.length > 0 ? (
                                            <div className="p-2">
                                                {vaGroup.vehicleAssignment.orderSeals.map((seal: any, sealIdx: number) => (
                                                    <div
                                                        key={seal.id}
                                                        className={`${sealIdx > 0 ? "mt-3" : ""} bg-gray-50 p-4 rounded-lg`}
                                                    >
                                                        <div className="flex items-center mb-2">
                                                            <span className="font-medium mr-1">Mô tả:</span>
                                                            <span>{seal.description}</span>
                                                        </div>
                                                        <div className="flex items-center mb-2">
                                                            <span className="font-medium mr-1">Ngày niêm phong:</span>
                                                            <span>{formatDate(seal.sealDate)}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <span className="font-medium mr-1">Trạng thái:</span>
                                                            <Tag color={getStatusColor(seal.status)}>{seal.status}</Tag>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <Empty description="Không có thông tin niêm phong" />
                                        )}
                                    </Tabs.TabPane>

                                    {/* Tab hình ảnh hoàn thành */}
                                    <Tabs.TabPane
                                        tab={
                                            <span>
                                                <CameraOutlined /> Hình ảnh hoàn thành
                                            </span>
                                        }
                                        key="photos"
                                    >
                                        {vaGroup.vehicleAssignment.photoCompletions && vaGroup.vehicleAssignment.photoCompletions.length > 0 ? (
                                            <div className="p-2">
                                                <div className="flex items-center mb-3">
                                                    <span className="font-medium">Hình ảnh hoàn thành:</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {vaGroup.vehicleAssignment.photoCompletions.map((url: string, idx: number) => (
                                                        <img
                                                            key={idx}
                                                            src={url}
                                                            alt={`Completion photo ${idx + 1}`}
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
                                    </Tabs.TabPane>
                                </Tabs>
                            </Card>
                        </TabPane>
                    ))}
                </Tabs>

                {/* Hiển thị AdditionalNavTabs */}
                <AdditionalNavTabs
                    orderData={{
                        order: order,
                    }}
                    formatDate={formatDate}
                />
            </>
        );
    }

    // Nếu chưa phân công, hiển thị theo từng order detail như cũ
    return (
        <>
            <Tabs
                activeKey={activeDetailTab}
                onChange={setActiveDetailTab}
                type="card"
                className="order-detail-tabs"
            >
                {order.orderDetails.map((detail: StaffOrderDetailItem, index: number) => (
                    <TabPane
                        tab={
                            <span>
                                <BoxPlotOutlined /> Kiện {index + 1}{" "}
                                {detail.trackingCode ? `- ${detail.trackingCode} ` : ""}
                            </span>
                        }
                        key={index.toString()}
                    >
                        <OrderDetailPackageTab
                            detail={detail}
                            formatDate={formatDate}
                            setVehicleAssignmentModalVisible={setVehicleAssignmentModalVisible}
                            order={order}
                        />
                    </TabPane>
                ))}
            </Tabs>

            {/* Hiển thị AdditionalNavTabs */}
            <AdditionalNavTabs
                orderData={{
                    order: order,
                }}
                formatDate={formatDate}
            />
        </>
    );
};

export default OrderDetailTabs; 