import React from "react";
import { Card, Row, Col, Tag, Tooltip } from "antd";
import { FileTextOutlined, CalendarOutlined, TagOutlined, DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

interface OrderStatusSectionProps {
    orderCode: string;
    status: string;
    createdAt: string;
    totalPrice: number | null;
}

const OrderStatusSection: React.FC<OrderStatusSectionProps> = ({
    orderCode,
    status,
    createdAt,
    totalPrice,
}) => {
    const getStatusColor = (status: string) => {
        const statusMap: Record<string, string> = {
            PENDING: "orange",
            PROCESSING: "blue",
            ON_PLANNING: "geekblue",
            ASSIGNED_TO_DRIVER: "cyan",
            IN_TRANSIT: "purple",
            CANCELLED: "red",
            DELIVERED: "green",
            SUCCESSFUL: "green",
            IN_TROUBLES: "red",
            // Add more status mappings as needed
        };
        return statusMap[status] || "default";
    };

    const formatDate = (dateString: string) => {
        return dayjs(dateString).format("DD/MM/YYYY HH:mm:ss");
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) {
            return "0 VND";
        }
        return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    };

    return (
        <Card className="mb-6 shadow-md rounded-xl">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 -mt-4 -mx-4 px-4 py-3 mb-4 rounded-t-xl">
                <div className="flex items-center">
                    <FileTextOutlined className="text-xl text-blue-500 mr-2" />
                    <h2 className="text-lg font-medium m-0">Trạng thái đơn hàng</h2>
                </div>
            </div>

            <Row gutter={[16, 16]} className="mb-2">
                <Col xs={24} sm={24} md={8} lg={6}>
                    <div className="flex flex-col">
                        <div className="text-gray-500 mb-1 flex items-center">
                            <FileTextOutlined className="mr-1" /> Mã đơn
                        </div>
                        <Tooltip title={orderCode}>
                            <span className="font-medium whitespace-nowrap truncate max-w-[180px] block">
                                {orderCode}
                            </span>
                        </Tooltip>
                    </div>
                </Col>

                <Col xs={24} sm={24} md={8} lg={6}>
                    <div className="flex flex-col">
                        <div className="text-gray-500 mb-1 flex items-center">
                            <CalendarOutlined className="mr-1" /> Ngày
                        </div>
                        <Tooltip title={formatDate(createdAt)}>
                            <span className="font-medium whitespace-nowrap truncate max-w-[180px] block">
                                {formatDate(createdAt)}
                            </span>
                        </Tooltip>
                    </div>
                </Col>

                <Col xs={24} sm={24} md={8} lg={6}>
                    <div className="flex flex-col">
                        <div className="text-gray-500 mb-1 flex items-center">
                            <TagOutlined className="mr-1" /> Trạng thái
                        </div>
                        <Tag color={getStatusColor(status)} className="mr-0 inline-block">
                            {status}
                        </Tag>
                    </div>
                </Col>

                <Col xs={24} sm={24} md={8} lg={6}>
                    <div className="flex flex-col">
                        <div className="text-gray-500 mb-1 flex items-center">
                            <DollarOutlined className="mr-1" /> Tổng tiền
                        </div>
                        <span className="font-medium text-green-600">
                            {formatCurrency(totalPrice)}
                        </span>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default OrderStatusSection; 