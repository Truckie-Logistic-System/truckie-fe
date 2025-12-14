import React from "react";
import { Card, Row, Col, Typography, Divider, Button } from "antd";
import {
    InfoCircleOutlined,
    FileTextOutlined,
    BoxPlotOutlined,
    ColumnWidthOutlined,
    ClockCircleOutlined,
    NumberOutlined,
    CarOutlined,
    TagOutlined,
    ExpandOutlined,
} from "@ant-design/icons";
import VehicleInfoSection from "./VehicleInfoSection";
import OrderDetailStatusTag from "../../../../../components/common/tags/OrderDetailStatusTag";
import OrderSizeBadge from "../../../../../components/common/OrderSizeBadge";
import { OrderStatusEnum, getOrderSizeLabel } from "../../../../../constants/enums";
import type { StaffOrderDetailItem, StaffVehicleAssignment } from "../../../../../models/Order";

const { Text } = Typography;

interface OrderDetailPackageTabProps {
    detail: StaffOrderDetailItem;
    formatDate: (dateString?: string) => string;
    order: any;
    vehicleAssignments?: StaffVehicleAssignment[];
}

const OrderDetailPackageTab: React.FC<OrderDetailPackageTabProps> = ({
    detail,
    formatDate,
    order,
    vehicleAssignments,
}) => {
    // Find the matching vehicle assignment for this order detail
    const vehicleAssignment = vehicleAssignments?.find(
        (va) => va.id === detail.vehicleAssignmentId
    );
    return (
        <Card
            className="mb-6 shadow-md rounded-xl"
            title={
                <div className="flex items-center">
                    <InfoCircleOutlined className="mr-2 text-blue-500" />
                    <span className="font-medium">
                        Thông tin chi tiết vận chuyển
                    </span>
                </div>
            }
        >
            <Row gutter={[24, 16]}>
                <Col xs={24}>
                    <Card
                        className="mb-4 h-full border border-blue-100"
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
                                    <Text strong className="text-sm text-gray-700">Mã theo dõi</Text>
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
                                    <Text strong className="text-sm text-gray-700">Trạng thái</Text>
                                </div>
                                <div className="ml-6">
                                    <OrderDetailStatusTag status={detail.status} />
                                </div>
                            </div>

                            {/* Weight */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                                <div className="flex items-center mb-2">
                                    <ColumnWidthOutlined className="mr-2 text-green-600" />
                                    <Text strong className="text-sm text-gray-700">Trọng lượng</Text>
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
                                    <Text strong className="text-sm text-gray-700">Mô tả</Text>
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
                                    <Text strong className="text-sm text-gray-700">Thời gian dự kiến bắt đầu</Text>
                                </div>
                                <div className="ml-6">
                                    {detail.estimatedStartTime ? (
                                        <div>
                                            <span className="font-semibold text-blue-800">
                                                {formatDate(detail.estimatedStartTime ?? undefined)}
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
                    {/* Order Size Information - Improved with colored badge */}
                    {detail.orderSize && (
                        <Card
                            className="mb-4"
                            size="small"
                            title={
                                <div className="flex items-center">
                                    <BoxPlotOutlined className="mr-2 text-blue-500" />
                                    <span className="font-medium">
                                        Thông tin kích thước
                                    </span>
                                </div>
                            }
                        >
                            <div className="mb-4">
                                <div className="flex items-center mb-2">
                                    <TagOutlined className="mr-2 text-blue-500" />
                                    <Text strong>Loại kích thước:</Text>
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
                                    <Text strong>Phạm vi kích thước:</Text>
                                </div>
                                <div className="ml-6">
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
                    {/* Placeholder for any additional information */}
                </Col>
            </Row>

            {/* Vehicle Assignment Information in a separate row */}
            <Row>
                <Col xs={24}>
                    {vehicleAssignment && vehicleAssignment.id ? (
                        <Card
                            className="mb-4"
                            size="small"
                            title={
                                <div className="flex items-center">
                                    <CarOutlined className="mr-2 text-blue-500" />
                                    <span className="font-medium">Thông tin chuyến xe</span>
                                </div>
                            }
                        >
                            <VehicleInfoSection
                                vehicleAssignment={{
                                    ...vehicleAssignment,
                                    id: vehicleAssignment.id,
                                    primaryDriver: vehicleAssignment.primaryDriver && vehicleAssignment.primaryDriver.id ? {
                                        id: vehicleAssignment.primaryDriver.id,
                                        fullName: vehicleAssignment.primaryDriver.fullName,
                                        phoneNumber: vehicleAssignment.primaryDriver.phoneNumber
                                    } : undefined,
                                    secondaryDriver: vehicleAssignment.secondaryDriver && vehicleAssignment.secondaryDriver.id ? {
                                        id: vehicleAssignment.secondaryDriver.id,
                                        fullName: vehicleAssignment.secondaryDriver.fullName,
                                        phoneNumber: vehicleAssignment.secondaryDriver.phoneNumber
                                    } : undefined
                                }}
                            />
                        </Card>
                    ) : (
                        <Card
                            className="mb-4"
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
                                <p className="text-gray-500 mb-2 font-medium">
                                    Chưa có thông tin phân công xe
                                </p>
                                <p className="text-gray-400 text-sm mb-4">
                                    Đơn hàng sẽ được gán phương tiện vận chuyển trong thời gian tới
                                </p>
                            </div>
                        </Card>
                    )}
                </Col>
            </Row>
        </Card>
    );
};

export default OrderDetailPackageTab; 