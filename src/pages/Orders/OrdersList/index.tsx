import { useState } from "react";
import { Link } from "react-router-dom";

const OrdersList = () => {
  const [orders] = useState([
    {
      id: "ORD001",
      status: "delivered",
      pickup: "Hà Nội",
      delivery: "TP. Hồ Chí Minh",
      date: "2024-01-15",
      price: "150,000 VND",
    },
    {
      id: "ORD002",
      status: "in_transit",
      pickup: "Đà Nẵng",
      delivery: "Hải Phòng",
      date: "2024-01-20",
      price: "120,000 VND",
    },
    {
      id: "ORD003",
      status: "pending",
      pickup: "TP. Hồ Chí Minh",
      delivery: "Cần Thơ",
      date: "2024-01-25",
      price: "100,000 VND",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Đơn hàng của tôi
            </h1>
            <Link
              to="/orders/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
              Tạo đơn mới
            </Link>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Danh sách đơn hàng
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-medium text-gray-900">#{order.id}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Từ: </span>
                        <span>{order.pickup}</span>
                      </div>
                      <div>
                        <span className="font-medium">Đến: </span>
                        <span>{order.delivery}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Ngày tạo: </span>
                      <span>{order.date}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 mb-2">
                      {order.price}
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="px-6 py-12 text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Chưa có đơn hàng nào
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Bắt đầu bằng cách tạo đơn hàng đầu tiên của bạn
              </p>
              <Link
                to="/orders/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Tạo đơn hàng
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersList;
