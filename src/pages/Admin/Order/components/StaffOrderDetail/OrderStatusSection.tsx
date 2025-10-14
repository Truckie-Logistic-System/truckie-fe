import React from "react";
import { Tooltip } from "antd";
import dayjs from "dayjs";
import { OrderStatusTag } from "@/components/common/tags";
import { OrderStatusEnum } from "@/constants/enums";

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
        <div className="mb-6 bg-white shadow-md rounded-xl p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                    <p className="text-gray-600 mb-1 font-medium">Trạng thái đơn hàng</p>
                    <div className="flex items-center">
                        <OrderStatusTag status={status as OrderStatusEnum} />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="text-center px-4">
                        <p className="text-gray-500 text-sm">Mã đơn hàng</p>
                        <Tooltip title={orderCode}>
                            <p className="font-semibold text-lg">{orderCode}</p>
                        </Tooltip>
                    </div>
                    <div className="text-center px-4 border-l border-gray-200">
                        <p className="text-gray-500 text-sm">Ngày tạo</p>
                        <Tooltip title={formatDate(createdAt)}>
                            <p className="font-semibold">{formatDate(createdAt)}</p>
                        </Tooltip>
                    </div>
                    <div className="text-center px-4 border-l border-gray-200">
                        <p className="text-gray-500 text-sm">Tổng tiền</p>
                        <p className="font-semibold text-lg text-blue-600">
                            {formatCurrency(totalPrice)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderStatusSection;