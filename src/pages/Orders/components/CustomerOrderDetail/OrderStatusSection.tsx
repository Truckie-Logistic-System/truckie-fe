import React from "react";
import { Card, Button } from "antd";
import { TruckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { OrderStatusTag } from "@/components/common/tags";
import { OrderStatusEnum } from "@/constants/enums";

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

interface OrderStatusSectionProps {
  orderCode: string;
  status: string;
  createdAt?: string;
  totalPrice?: number;
  hasContract?: boolean;
  checkingContract?: boolean;
  loadingVehicleSuggestions?: boolean;
  onFetchVehicleSuggestions?: () => void;
}

const OrderStatusSection: React.FC<OrderStatusSectionProps> = ({
  orderCode,
  status,
  createdAt,
  totalPrice,
  hasContract,
  checkingContract,
  loadingVehicleSuggestions,
  onFetchVehicleSuggestions,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có thông tin";
    return dayjs(dateString)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY HH:mm:ss");
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

      {/* Contract Status Section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 mb-0">Trạng thái hợp đồng</p>
          {checkingContract ? (
            <div className="text-sm text-gray-500">Đang kiểm tra...</div>
          ) : hasContract ? (
            <div className="flex items-center text-green-600">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Bạn đã đồng ý với đề xuất phân xe của chúng tôi
            </div>
          ) : (
            <Button
              type="primary"
              icon={<TruckOutlined />}
              loading={loadingVehicleSuggestions}
              onClick={onFetchVehicleSuggestions}
            >
              Xem đề xuất xe hàng
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusSection;
