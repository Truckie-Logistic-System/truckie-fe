import React from "react";
import { Link } from "react-router-dom";

const OrdersHeader: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Đơn hàng của bạn</h1>
            <p className="text-blue-100">Quản lý và theo dõi tất cả đơn hàng</p>
          </div>
          <Link
            to="/orders/create"
            className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
  );
};

export default OrdersHeader;
