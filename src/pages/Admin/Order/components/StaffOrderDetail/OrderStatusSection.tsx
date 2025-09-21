import React from "react";
import { Card, Tag, Row, Col } from "antd";
import { ClockCircleOutlined, NumberOutlined, DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

interface OrderStatusSectionProps {
    orderCode: string;
    status: string;
    createdAt: string;
    totalPrice: number;
}

const OrderStatusSection: React.FC<OrderStatusSectionProps> = ({
    orderCode,
    status,
    createdAt,
    totalPrice,
}) => {
    const formatDate = (dateString: string) => {
        return dayjs(dateString).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm:ss");
    };

    const getStatusColor = (status: string) => {
        const statusMap: Record<string, string> = {
            PENDING: "orange",
            PROCESSING: "blue",
            CANCELLED: "red",
            DELIVERED: "green",
            SUCCESSFUL: "green",
            IN_TROUBLES: "red",
            // Add more status mappings as needed
        };
        return statusMap[status] || "default";
    };

    return (
        <Card className="mb-6 shadow-md rounded-xl">
            <Row gutter={[24, 16]} align="middle">
                <Col xs={24} sm={12} md={6} className="text-center sm:text-left">
                    <div className="mb-2 sm:mb-0">
                        <span className="text-gray-500 mr-2">
                            <NumberOutlined /> Mã đơn hàng:
                        </span>
                        <span className="font-medium text-lg">{orderCode}</span>
                    </div>
                </Col>
                <Col xs={24} sm={12} md={6} className="text-center sm:text-left">
                    <div className="mb-2 sm:mb-0">
                        <span className="text-gray-500 mr-2">
                            <ClockCircleOutlined /> Ngày tạo:
                        </span>
                        <span>{formatDate(createdAt)}</span>
                    </div>
                </Col>
                <Col xs={24} sm={12} md={6} className="text-center sm:text-left">
                    <div className="mb-2 sm:mb-0">
                        <span className="text-gray-500 mr-2">Trạng thái:</span>
                        <Tag color={getStatusColor(status)}>{status}</Tag>
                    </div>
                </Col>
                <Col xs={24} sm={12} md={6} className="text-center sm:text-left">
                    <div>
                        <span className="text-gray-500 mr-2">
                            <DollarOutlined /> Tổng tiền:
                        </span>
                        <span className="font-medium text-lg text-red-500">
                            {totalPrice ? totalPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) : "0 VND"}
                        </span>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default OrderStatusSection; 