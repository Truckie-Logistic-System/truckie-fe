import React, { useState } from "react";
import { Empty, Tabs, Card, Tag } from "antd";
import { BoxPlotOutlined, CarOutlined, FileTextOutlined, UserOutlined, PhoneOutlined, TagOutlined } from "@ant-design/icons";
import type { StaffOrderDetailItem } from "../../../../../models/Order";
import AdditionalNavTabs from "./AdditionalNavTabs";

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

    if (!order.orderDetails || order.orderDetails.length === 0) {
        return <Empty description="Không có thông tin chi tiết vận chuyển" />;
    }

    // Kiểm tra xem có vehicle assignment không
    const hasVehicleAssignment = order.vehicleAssignments && order.vehicleAssignments.length > 0;

    // Nếu có vehicle assignment, hiển thị theo vehicle assignment
    if (hasVehicleAssignment) {
        const vehicleAssignmentMap = new Map<string, VehicleAssignmentGroup>();

        // Initialize map with vehicle assignments from order level
        order.vehicleAssignments.forEach((va: any) => {
            vehicleAssignmentMap.set(va.id, {
                vehicleAssignment: va,
                orderDetails: [],
            });
        });

        // Group order details by their vehicleAssignmentId
        order.orderDetails.forEach((detail: StaffOrderDetailItem) => {
            if (detail.vehicleAssignmentId) {
                const group = vehicleAssignmentMap.get(detail.vehicleAssignmentId);
                if (group) {
                    group.orderDetails.push(detail);
                }
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