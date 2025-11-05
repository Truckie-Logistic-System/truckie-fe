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
} from "@ant-design/icons";
import VehicleInfoSection from "./VehicleInfoSection";
import OrderDetailStatusTag from "../../../../../components/common/tags/OrderDetailStatusTag";
import { OrderStatusEnum } from "../../../../../constants/enums";
import type { StaffOrderDetailItem, StaffVehicleAssignment } from "../../../../../models/Order";

const { Text } = Typography;

interface OrderDetailPackageTabProps {
    detail: StaffOrderDetailItem;
    formatDate: (dateString?: string) => string;
    setVehicleAssignmentModalVisible: (visible: boolean) => void;
    order: any;
    vehicleAssignments?: StaffVehicleAssignment[];
}

const OrderDetailPackageTab: React.FC<OrderDetailPackageTabProps> = ({
    detail,
    formatDate,
    setVehicleAssignmentModalVisible,
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
                            <div className="ml-6">
                                {detail.trackingCode || "Chưa có"}
                            </div>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center mb-1">
                                <InfoCircleOutlined className="mr-2 text-blue-500" />
                                <Text strong>Trạng thái:</Text>
                            </div>
                            <div className="ml-6">
                                <OrderDetailStatusTag status={detail.status} />
                            </div>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center mb-1">
                                <ColumnWidthOutlined className="mr-2 text-blue-500" />
                                <Text strong>Trọng lượng:</Text>
                            </div>
                            <div className="ml-6">
                                {detail.weightBaseUnit} {detail.unit}
                            </div>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center mb-1">
                                <FileTextOutlined className="mr-2 text-blue-500" />
                                <Text strong>Mô tả:</Text>
                            </div>
                            <div className="ml-6">
                                {detail.description || "Không có mô tả"}
                            </div>
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
                            <div className="ml-6">
                                {formatDate(detail.estimatedStartTime)}
                            </div>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center mb-1">
                                <ClockCircleOutlined className="mr-2 text-blue-500" />
                                <Text strong>Thời gian dự kiến kết thúc:</Text>
                            </div>
                            <div className="ml-6">
                                {formatDate(detail.estimatedEndTime)}
                            </div>
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
                                    <span className="font-medium">
                                        Thông tin kích thước
                                    </span>
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
                </Col>

                <Col xs={24} md={12}>
                    {/* Placeholder for any additional information */}
                </Col>
            </Row>

            {/* Vehicle Assignment Information in a separate row */}
            <Row>
                <Col xs={24}>
                    {vehicleAssignment ? (
                        <Card
                            className="mb-4"
                            size="small"
                        >
                            <VehicleInfoSection
                                vehicleAssignment={vehicleAssignment}
                            />
                        </Card>
                    ) : (
                        <Card
                            className="mb-4"
                            size="small"
                        >
                            <div className="text-center py-4">
                                <p className="text-gray-500 mb-4">
                                    Chưa có thông tin phân công xe
                                </p>
                                {order.status === OrderStatusEnum.ON_PLANNING && (
                                    <Button
                                        type="primary"
                                        icon={<CarOutlined />}
                                        onClick={() =>
                                            setVehicleAssignmentModalVisible(true)
                                        }
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
    );
};

export default OrderDetailPackageTab; 