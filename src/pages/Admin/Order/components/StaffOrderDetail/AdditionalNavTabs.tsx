    import React from "react";
import { Card, Tabs, Tag, Empty, Image } from "antd";
import {
    BoxPlotOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    FileTextOutlined,
    VideoCameraOutlined,
    FireOutlined,
    CameraOutlined,
    NumberOutlined,
    ColumnWidthOutlined,
    DashboardOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
} from "@ant-design/icons";
import RouteMapWithRealTimeTracking from "./RouteMapWithRealTimeTracking";
import { OrderStatusEnum } from "../../../../../constants/enums";
import type { StaffOrderDetail, StaffOrderDetailItem } from "../../../../../models/Order";
import { formatJourneyType, getJourneyStatusColor } from "../../../../../models/JourneyHistory";

const { TabPane } = Tabs;

interface AdditionalNavTabsProps {
    orderData: {
        order: StaffOrderDetail;
        contract?: any;
        transactions?: any[];
    };
    formatDate: (dateString?: string) => string;
}

const AdditionalNavTabs: React.FC<AdditionalNavTabsProps> = ({
    orderData,
    formatDate,
}) => {
    if (!orderData || !orderData.order || orderData.order.status === OrderStatusEnum.ON_PLANNING) {
        return null;
    }

    return (
        <Card className="mt-4 shadow-md rounded-xl">
            <Tabs defaultActiveKey="routemap" type="card">
                <TabPane
                    tab={
                        <span>
                            <BoxPlotOutlined /> Danh sách lô hàng
                        </span>
                    }
                    key="packageList"
                >
                    {/* Package list content */}
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
                                {orderData.order.orderDetails.map((detail: StaffOrderDetailItem) => (
                                    <tr key={detail.id}>
                                        <td className="border border-gray-300 p-2">
                                            <div className="flex items-center">
                                                <NumberOutlined className="mr-2 text-blue-500" />
                                                {detail.trackingCode || "Chưa có"}
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 p-2">
                                            <Tag
                                                color={
                                                    detail.status === "PENDING"
                                                        ? "orange"
                                                        : detail.status === "PROCESSING"
                                                            ? "blue"
                                                            : detail.status === "DELIVERED" ||
                                                                detail.status === "SUCCESSFUL"
                                                                ? "green"
                                                                : detail.status === "CANCELLED" ||
                                                                    detail.status === "IN_TROUBLES"
                                                                    ? "red"
                                                                    : "default"
                                                }
                                            >
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

                {/* Tab lộ trình vận chuyển */}
                <TabPane
                    tab={
                        <span>
                            <EnvironmentOutlined /> Lộ trình vận chuyển
                        </span>
                    }
                    key="routemap"
                >
                    {orderData.order.orderDetails.some((detail: StaffOrderDetailItem) =>
                        detail.vehicleAssignment &&
                        detail.vehicleAssignment.journeyHistories &&
                        detail.vehicleAssignment.journeyHistories.length > 0 &&
                        detail.vehicleAssignment.journeyHistories.some(journey =>
                            journey.journeySegments && journey.journeySegments.length > 0
                        )
                    ) ? (
                        <div>
                            {orderData.order.orderDetails
                                .filter((detail: StaffOrderDetailItem) =>
                                    detail.vehicleAssignment &&
                                    detail.vehicleAssignment.journeyHistories &&
                                    detail.vehicleAssignment.journeyHistories.length > 0 &&
                                    detail.vehicleAssignment.journeyHistories.some(journey =>
                                        journey.journeySegments && journey.journeySegments.length > 0
                                    )
                                )
                                .map((detail: StaffOrderDetailItem, idx: number) => {
                                    const va = detail.vehicleAssignment!;
                                    return (
                                        <div key={idx} className="mb-6">
                                            {va.journeyHistories!.map((journey: any, journeyIdx: number) => {
                                                if (!journey.journeySegments || journey.journeySegments.length === 0) {
                                                    return null;
                                                }
                                                // Check if order status allows real-time tracking
                                                const shouldShowRealTimeTracking = orderData.order?.status ? [
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
                                                ].includes(orderData.order.status as OrderStatusEnum) : false;

                                                return (
                                                    <div key={journey.id || `journey-${journeyIdx}`} className="mb-4">
                                                        <RouteMapWithRealTimeTracking
                                                            journeySegments={journey.journeySegments}
                                                            journeyInfo={journey}
                                                            orderId={orderData.order.id}
                                                            shouldShowRealTimeTracking={shouldShowRealTimeTracking}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <Empty description="Không có thông tin lộ trình" />
                    )}
                </TabPane>

                {/* Tab lịch sử hành trình - Frequently used */}
                <TabPane
                    tab={
                        <span>
                            <ClockCircleOutlined /> Lịch sử hành trình
                        </span>
                    }
                    key="journey"
                >
                    {orderData.order.orderDetails.some((detail: StaffOrderDetailItem) =>
                        detail.vehicleAssignment &&
                        detail.vehicleAssignment.journeyHistories &&
                        detail.vehicleAssignment.journeyHistories.length > 0
                    ) ? (
                        <div>
                            {orderData.order.orderDetails
                                .filter((detail: StaffOrderDetailItem) =>
                                    detail.vehicleAssignment &&
                                    detail.vehicleAssignment.journeyHistories &&
                                    detail.vehicleAssignment.journeyHistories.length > 0
                                )
                                .map((detail: StaffOrderDetailItem, idx: number) => {
                                    const va = detail.vehicleAssignment!;
                                    return (
                                        <div key={idx} className="mb-4">
                                            <h3 className="font-medium mb-2">Chuyến xe #{idx + 1} - {va.vehicle?.licensePlateNumber || "Chưa có mã"}</h3>
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Thời gian bắt đầu</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Thời gian kết thúc</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Trạng thái</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Quãng đường</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Báo cáo sự cố</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {va.journeyHistories!.map((journey: any) => (
                                                        <tr key={journey.id}>
                                                            <td className="border border-gray-300 p-2">
                                                                {formatDate(journey.startTime || journey.createdAt)}
                                                                {journey.journeyName && (
                                                                    <div className="mt-1">
                                                                        <Tag color="blue" className="text-xs">{journey.journeyName}</Tag>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                {formatDate(journey.endTime || journey.modifiedAt)}
                                                                {journey.journeyType && (
                                                                    <div className="mt-1">
                                                                        <Tag color="green" className="text-xs">{formatJourneyType(journey.journeyType)}</Tag>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                <Tag color={getJourneyStatusColor(journey.status)}>
                                                                    {journey.status}
                                                                </Tag>
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                {journey.totalDistance || 'N/A'} {journey.totalDistance ? 'km' : ''}
                                                                {journey.totalTollCount !== undefined && (
                                                                    <div className="mt-1">
                                                                        <Tag color="cyan" className="text-xs">{journey.totalTollCount} trạm thu phí</Tag>
                                                                    </div>
                                                                )}
                                                                {journey.totalTollFee !== undefined && journey.totalTollFee > 0 && (
                                                                    <div className="mt-1">
                                                                        <Tag color="purple" className="text-xs">{journey.totalTollFee.toLocaleString('vi-VN')} VNĐ</Tag>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                {journey.isReportedIncident ? (
                                                                    <Tag color="red">Có</Tag>
                                                                ) : (
                                                                    <Tag color="green">Không</Tag>
                                                                )}
                                                                {journey.reasonForReroute && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        {journey.reasonForReroute}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <Empty description="Không có lịch sử hành trình" />
                    )}
                </TabPane>

                {/* Tab sự cố - Important to monitor */}
                <TabPane
                    tab={
                        <span>
                            <InfoCircleOutlined /> Sự cố
                        </span>
                    }
                    key="issues"
                >
                    {orderData.order.orderDetails.some(detail =>
                        detail.vehicleAssignment &&
                        detail.vehicleAssignment.issues &&
                        detail.vehicleAssignment.issues.length > 0
                    ) ? (
                        <div className="p-2">
                            {orderData.order.orderDetails
                                .filter(detail =>
                                    detail.vehicleAssignment &&
                                    detail.vehicleAssignment.issues &&
                                    detail.vehicleAssignment.issues.length > 0
                                )
                                .map((detail, idx) => {
                                    const va = detail.vehicleAssignment!;
                                    return (
                                        <div key={idx} className="mb-4">
                                            <h3 className="font-medium mb-2">Chuyến xe #{idx + 1} - {va.vehicle?.licensePlateNumber || "Chưa có mã"}</h3>
                                            {va.issues!.map((issueItem, issueIdx) => (
                                                <div key={issueIdx} className="bg-red-50 p-4 rounded-lg mb-3">
                                                    <div className="flex items-center mb-3">
                                                        <InfoCircleOutlined className="text-red-500 mr-2" />
                                                        <span className="font-medium">Mô tả sự cố:</span>
                                                        <span className="ml-2">
                                                            {issueItem.issue.description}
                                                        </span>
                                                        <Tag
                                                            className="ml-2"
                                                            color={
                                                                issueItem.issue.status === "PENDING"
                                                                    ? "orange"
                                                                    : issueItem.issue.status === "PROCESSING"
                                                                        ? "blue"
                                                                        : issueItem.issue.status === "RESOLVED"
                                                                            ? "green"
                                                                            : "red"
                                                            }
                                                        >
                                                            {issueItem.issue.status}
                                                        </Tag>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="flex items-center">
                                                            <InfoCircleOutlined className="mr-2 text-gray-500" />
                                                            <span className="font-medium mr-1">
                                                                Loại sự cố:
                                                            </span>
                                                            <span>
                                                                {issueItem.issue.issueTypeName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <InfoCircleOutlined className="mr-2 text-gray-500" />
                                                            <span className="font-medium mr-1">
                                                                Nhân viên xử lý:
                                                            </span>
                                                            <span>
                                                                {issueItem.issue.staff.name}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {issueItem.imageUrls &&
                                                        issueItem.imageUrls.length > 0 ? (
                                                        <div className="mt-4">
                                                            <div className="flex items-center mb-2">
                                                                <CameraOutlined className="mr-2 text-blue-500" />
                                                                <span className="font-medium">Hình ảnh:</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {issueItem.imageUrls.map(
                                                                    (url: string, imgIdx: number) => (
                                                                        <Image
                                                                            key={imgIdx}
                                                                            src={url}
                                                                            alt={`Issue image ${imgIdx + 1}`}
                                                                            width={100}
                                                                            height={100}
                                                                            className="object-cover rounded"
                                                                        />
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-4 text-gray-500">
                                                            <CameraOutlined className="mr-2" />
                                                            <span>Chưa có hình ảnh</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <Empty description="Không có sự cố nào được ghi nhận" />
                    )}
                </TabPane>

                {/* Tab vi phạm & phạt - Important for management */}
                <TabPane
                    tab={
                        <span>
                            <WarningOutlined /> Vi phạm & Phạt
                        </span>
                    }
                    key="penalties"
                >
                    {orderData.order.orderDetails.some(detail =>
                        detail.vehicleAssignment &&
                        detail.vehicleAssignment.penalties &&
                        detail.vehicleAssignment.penalties.length > 0
                    ) ? (
                        <div className="p-2">
                            {orderData.order.orderDetails
                                .filter(detail =>
                                    detail.vehicleAssignment &&
                                    detail.vehicleAssignment.penalties &&
                                    detail.vehicleAssignment.penalties.length > 0
                                )
                                .map((detail, idx) => {
                                    const va = detail.vehicleAssignment!;
                                    return (
                                        <div key={idx} className="mb-4">
                                            <h3 className="font-medium mb-2">Chuyến xe #{idx + 1} - {va.vehicle?.licensePlateNumber || "Chưa có mã"}</h3>
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Loại vi phạm</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Mô tả</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Số tiền phạt</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Ngày vi phạm</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {va.penalties!.map((penalty: any) => (
                                                        <tr key={penalty.id}>
                                                            <td className="border border-gray-300 p-2">{penalty.violationType}</td>
                                                            <td className="border border-gray-300 p-2">{penalty.violationDescription}</td>
                                                            <td className="border border-gray-300 p-2">
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(penalty.penaltyAmount)}
                                                            </td>
                                                            <td className="border border-gray-300 p-2">{formatDate(penalty.penaltyDate)}</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <Tag color={
                                                                    penalty.status === "PAID"
                                                                        ? "green"
                                                                        : penalty.status === "PENDING"
                                                                            ? "orange"
                                                                            : "red"
                                                                }>
                                                                    {penalty.status}
                                                                </Tag>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <Empty description="Không có thông tin vi phạm" />
                    )}
                </TabPane>

                {/* Tab niêm phong - Important for delivery process */}
                <TabPane
                    tab={
                        <span>
                            <FileTextOutlined /> Niêm phong
                        </span>
                    }
                    key="seals"
                >
                    {orderData.order.orderDetails.some(detail =>
                        detail.vehicleAssignment &&
                        detail.vehicleAssignment.orderSeals &&
                        detail.vehicleAssignment.orderSeals.length > 0
                    ) ? (
                        <div className="p-2">
                            {orderData.order.orderDetails
                                .filter(detail =>
                                    detail.vehicleAssignment &&
                                    detail.vehicleAssignment.orderSeals &&
                                    detail.vehicleAssignment.orderSeals.length > 0
                                )
                                .map((detail, idx) => {
                                    const va = detail.vehicleAssignment!;
                                    return (
                                        <div key={idx} className="mb-4">
                                            <h3 className="font-medium mb-2">Chuyến xe #{idx + 1} - {va.vehicle?.licensePlateNumber || "Chưa có mã"}</h3>
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Mô tả</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Ngày niêm phong</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Trạng thái</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {va.orderSeals!.map((seal: any) => (
                                                        <tr key={seal.id}>
                                                            <td className="border border-gray-300 p-2">{seal.description}</td>
                                                            <td className="border border-gray-300 p-2">{formatDate(seal.sealDate)}</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <Tag color={
                                                                    seal.status === "PENDING"
                                                                        ? "orange"
                                                                        : seal.status === "PROCESSING"
                                                                            ? "blue"
                                                                            : seal.status === "COMPLETED"
                                                                                ? "green"
                                                                                : "default"
                                                                }>
                                                                    {seal.status}
                                                                </Tag>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <Empty description="Không có thông tin niêm phong" />
                    )}
                </TabPane>

                {/* Tab camera theo dõi */}
                <TabPane
                    tab={
                        <span>
                            <VideoCameraOutlined /> Camera theo dõi
                        </span>
                    }
                    key="cameras"
                >
                    {orderData.order.orderDetails.some(detail =>
                        detail.vehicleAssignment &&
                        detail.vehicleAssignment.cameraTrackings &&
                        detail.vehicleAssignment.cameraTrackings.length > 0
                    ) ? (
                        <div className="p-2">
                            {orderData.order.orderDetails
                                .filter(detail =>
                                    detail.vehicleAssignment &&
                                    detail.vehicleAssignment.cameraTrackings &&
                                    detail.vehicleAssignment.cameraTrackings.length > 0
                                )
                                .map((detail, idx) => {
                                    const va = detail.vehicleAssignment!;
                                    return (
                                        <div key={idx} className="mb-4">
                                            <h3 className="font-medium mb-2">Chuyến xe #{idx + 1} - {va.vehicle?.licensePlateNumber || "Chưa có mã"}</h3>
                                            <table className="w-full border-collapse">
                                                <thead>
                                                    <tr>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Thiết bị</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Thời gian</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Trạng thái</th>
                                                        <th className="border border-gray-300 bg-gray-50 p-2 text-left">Hành động</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {va.cameraTrackings!.map((camera: any) => (
                                                        <tr key={camera.id}>
                                                            <td className="border border-gray-300 p-2">{camera.deviceName}</td>
                                                            <td className="border border-gray-300 p-2">{formatDate(camera.trackingAt)}</td>
                                                            <td className="border border-gray-300 p-2">
                                                                <Tag color={
                                                                    camera.status === "ACTIVE"
                                                                        ? "green"
                                                                        : camera.status === "INACTIVE"
                                                                            ? "red"
                                                                            : "default"
                                                                }>
                                                                    {camera.status}
                                                                </Tag>
                                                            </td>
                                                            <td className="border border-gray-300 p-2">
                                                                {camera.videoUrl && (
                                                                    <a href={camera.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center">
                                                                        <VideoCameraOutlined className="mr-2" />
                                                                        Xem video
                                                                    </a>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <Empty description="Không có dữ liệu camera theo dõi" />
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
                    {orderData.order.orderDetails.some(detail =>
                        detail.vehicleAssignment &&
                        detail.vehicleAssignment.fuelConsumption
                    ) ? (
                        <div className="p-2">
                            {orderData.order.orderDetails
                                .filter(detail =>
                                    detail.vehicleAssignment &&
                                    detail.vehicleAssignment.fuelConsumption
                                )
                                .map((detail, idx) => {
                                    const va = detail.vehicleAssignment!;
                                    const fuel = va.fuelConsumption!;
                                    return (
                                        <div key={idx} className="mb-4">
                                            <h3 className="font-medium mb-2">Chuyến xe #{idx + 1} - {va.vehicle?.licensePlateNumber || "Chưa có mã"}</h3>
                                            <div className="bg-blue-50 p-4 rounded-lg mb-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="flex items-center">
                                                        <DashboardOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Chỉ số đồng hồ khi nạp:</span>
                                                        <span>{fuel.odometerReadingAtRefuel} km</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FireOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Loại nhiên liệu:</span>
                                                        <span>{fuel.fuelTypeName}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <FileTextOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Mô tả nhiên liệu:</span>
                                                        <span>{fuel.fuelTypeDescription}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <CalendarOutlined className="mr-2 text-gray-500" />
                                                        <span className="font-medium mr-1">Ngày ghi nhận:</span>
                                                        <span>{formatDate(fuel.dateRecorded)}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <div className="flex items-start">
                                                        <FileTextOutlined className="mr-2 text-gray-500 mt-1" />
                                                        <span className="font-medium mr-1">Ghi chú:</span>
                                                        <span>{fuel.notes || "Không có ghi chú"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {fuel.odometerAtStartUrl && (
                                                    <div>
                                                        <div className="flex items-center mb-2">
                                                            <DashboardOutlined className="mr-2 text-blue-500" />
                                                            <span className="font-medium">Đồng hồ khi bắt đầu</span>
                                                        </div>
                                                        <Image
                                                            src={fuel.odometerAtStartUrl}
                                                            alt="Odometer at start"
                                                            className="object-cover rounded"
                                                        />
                                                    </div>
                                                )}
                                                {fuel.odometerAtFinishUrl && (
                                                    <div>
                                                        <div className="flex items-center mb-2">
                                                            <DashboardOutlined className="mr-2 text-blue-500" />
                                                            <span className="font-medium">Đồng hồ khi hoàn thành</span>
                                                        </div>
                                                        <Image
                                                            src={fuel.odometerAtFinishUrl}
                                                            alt="Odometer at finish"
                                                            className="object-cover rounded"
                                                        />
                                                    </div>
                                                )}
                                                {fuel.odometerAtEndUrl && (
                                                    <div>
                                                        <div className="flex items-center mb-2">
                                                            <DashboardOutlined className="mr-2 text-blue-500" />
                                                            <span className="font-medium">Đồng hồ khi kết thúc</span>
                                                        </div>
                                                        <Image
                                                            src={fuel.odometerAtEndUrl}
                                                            alt="Odometer at end"
                                                            className="object-cover rounded"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <Empty description="Không có dữ liệu tiêu thụ nhiên liệu" />
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
                    {orderData.order.orderDetails.some(detail =>
                        detail.vehicleAssignment &&
                        detail.vehicleAssignment.photoCompletions &&
                        detail.vehicleAssignment.photoCompletions.length > 0
                    ) ? (
                        <div className="p-2">
                            {orderData.order.orderDetails
                                .filter(detail =>
                                    detail.vehicleAssignment &&
                                    detail.vehicleAssignment.photoCompletions &&
                                    detail.vehicleAssignment.photoCompletions.length > 0
                                )
                                .map((detail, idx) => {
                                    const va = detail.vehicleAssignment!;
                                    return (
                                        <div key={idx} className="mb-4">
                                            <h3 className="font-medium mb-2">Chuyến xe #{idx + 1} - {va.vehicle?.licensePlateNumber || "Chưa có mã"}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {va.photoCompletions!.map(
                                                    (url: string, photoIdx: number) => (
                                                        <Image
                                                            key={photoIdx}
                                                            src={url}
                                                            alt={`Completion photo ${photoIdx + 1}`}
                                                            width={100}
                                                            height={100}
                                                            className="object-cover rounded"
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ) : (
                        <Empty description="Không có hình ảnh hoàn thành" />
                    )}
                </TabPane>
            </Tabs>
        </Card>
    );
};

export default AdditionalNavTabs; 