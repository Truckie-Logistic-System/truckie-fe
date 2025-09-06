import React from "react";
import { Link } from "react-router-dom";

interface Order {
  id: string;
  status: string;
  pickup: string;
  delivery: string;
  date: string;
  price: string;
}

interface OrdersContentProps {
  orders: Order[];
}

const OrdersContent: React.FC<OrdersContentProps> = ({ orders }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg";
      case "in_transit":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg";
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg";
      case "cancelled":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Đã giao";
      case "in_transit":
        return "Đang vận chuyển";
      case "pending":
        return "Chờ xử lý";
      case "cancelled":
        return "Đã hủy";
      default:
        return "Không xác định";
    }
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
                        #{order.id}
                      </h3>
                    </div>
                    <span
                      className={`px-4 py-2 text-sm font-semibold rounded-full shadow-sm ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
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
                        <div className="font-semibold text-gray-700 text-sm">
                          Điểm lấy hàng
                        </div>
                        <div className="text-gray-900 font-medium">
                          {order.pickup}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-red-600"
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
                        <div className="font-semibold text-gray-700 text-sm">
                          Điểm giao hàng
                        </div>
                        <div className="text-gray-900 font-medium">
                          {order.delivery}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
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
                          d="M8 7V3a4 4 0 118 0v4m-4 6v6m-6-6h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700 text-sm">
                        Ngày tạo
                      </div>
                      <div className="text-gray-900 font-medium">
                        {order.date}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right ml-6">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    {order.price}
                  </div>
                  <button className="px-6 py-3 text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 border-2 border-blue-600 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-16 text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-8">
              <svg
                className="w-12 h-12 text-blue-600"
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
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Chưa có đơn hàng nào
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
              Bắt đầu hành trình vận chuyển của bạn bằng cách tạo đơn hàng đầu
              tiên
            </p>
            <Link
              to="/orders/create"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 gap-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Tạo đơn hàng đầu tiên
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersContent;
