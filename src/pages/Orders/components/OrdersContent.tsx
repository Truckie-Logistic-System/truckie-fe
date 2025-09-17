import React from "react";
import { Link } from "react-router-dom";
import type { Order, OrderStatus } from "../../../models/Order";
import { formatCurrency } from "../../../utils/formatters";
import { OrderStatusEnum } from "@/constants/enums";
import { OrderStatusTag } from "@/components/common/tags";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configure dayjs to use timezone
dayjs.extend(utc);
dayjs.extend(timezone);

interface OrdersContentProps {
  orders: Order[];
}

const OrdersContent: React.FC<OrdersContentProps> = ({ orders }) => {
  // Hàm chuyển đổi OrderStatus sang OrderStatusEnum
  const mapToOrderStatusEnum = (status: OrderStatus): OrderStatusEnum => {
    // Directly use the enum value if it matches
    if (Object.values(OrderStatusEnum).includes(status as OrderStatusEnum)) {
      return status as OrderStatusEnum;
    }

    // Fallback mappings for any legacy or non-standard statuses
    switch (status) {
      case "DELIVERED":
      case "SUCCESSFUL":
        return OrderStatusEnum.DELIVERED;
      case "ON_DELIVERED":
      case "ONGOING_DELIVERED":
      case "IN_DELIVERED":
        return OrderStatusEnum.ON_DELIVERED;
      case "PENDING":
        return OrderStatusEnum.PENDING;
      case "PROCESSING":
        return OrderStatusEnum.PROCESSING;
      case "CANCELLED":
      case "REJECT_ORDER":
        return OrderStatusEnum.CANCELLED;
      case "PICKED_UP":
        return OrderStatusEnum.PICKED_UP;
      case "IN_TROUBLES":
        return OrderStatusEnum.IN_TROUBLES;
      case "RETURNING":
        return OrderStatusEnum.RETURNING;
      case "RETURNED":
        return OrderStatusEnum.RETURNED;
      default:
        return OrderStatusEnum.PENDING;
    }
  };

  // Function to get pickup and delivery addresses from order
  const getPickupAddress = (order: Order): string => {
    if (order.pickupAddress) {
      return `${order.pickupAddress.street}, ${order.pickupAddress.ward}, ${order.pickupAddress.province}`;
    }
    return "Chưa có địa chỉ lấy hàng";
  };

  const getDeliveryAddress = (order: Order): string => {
    if (order.deliveryAddress) {
      return `${order.deliveryAddress.street}, ${order.deliveryAddress.ward}, ${order.deliveryAddress.province}`;
    }
    return "Chưa có địa chỉ giao hàng";
  };

  // Format date to Vietnam timezone with hours and minutes
  const formatDateToVNTime = (date: string | undefined) => {
    if (!date) return "N/A";
    return dayjs(date).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-200 hover:shadow-xl hover:border-blue-200 bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-indigo-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">
                        #{order.orderCode}
                      </h3>
                    </div>
                    <OrderStatusTag
                      status={mapToOrderStatusEnum(order.status)}
                      size="large"
                      className="shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Địa điểm lấy hàng
                        </p>
                        <p className="text-gray-700">{getPickupAddress(order)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Ngày tạo đơn
                        </p>
                        <p className="text-gray-700">
                          {formatDateToVNTime(order.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Địa điểm giao hàng
                        </p>
                        <p className="text-gray-700">{getDeliveryAddress(order)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-amber-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          Giá trị đơn hàng
                        </p>
                        <p className="text-gray-700 font-medium">
                          {formatCurrency(order.totalPrice)} VNĐ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:shadow-lg"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Không có đơn hàng nào
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Bạn chưa có đơn hàng nào. Hãy tạo đơn hàng mới để bắt đầu.
          </p>
          <Link
            to="/create-order"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:shadow-lg"
          >
            Tạo đơn hàng mới
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrdersContent;
