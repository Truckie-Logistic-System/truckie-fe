import React from "react";
import { Card, Tag } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

interface OrderStatusSectionProps {
    orderCode: string;
    status: string;
    createdAt?: string;
    totalPrice?: number;
}

const OrderStatusSection: React.FC<OrderStatusSectionProps> = ({
    orderCode,
    status,
    createdAt,
    totalPrice,
}) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Chưa có thông tin";
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                    <p className="text-gray-500 mb-1">Trạng thái đơn hàng</p>
                    <div className="flex items-center">
                        <Tag color={getStatusColor(status)} className="text-base px-3 py-1">
                            {status}
                        </Tag>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="text-center px-4">
                        <p className="text-gray-500 text-sm">Mã đơn hàng</p>
                        <p className="font-semibold text-lg">{orderCode}</p>
                    </div>
                    <div className="text-center px-4 border-l border-gray-200">
                        <p className="text-gray-500 text-sm">Ngày tạo</p>
                        <p className="font-semibold">{formatDate(createdAt)}</p>
                    </div>
                    <div className="text-center px-4 border-l border-gray-200">
                        <p className="text-gray-500 text-sm">Tổng tiền</p>
                        <p className="font-semibold text-lg text-blue-600">
                            {totalPrice !== null && totalPrice !== undefined
                                ? `${totalPrice.toLocaleString("vi-VN")} VNĐ`
                                : "Chưa có thông tin"}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default OrderStatusSection; 