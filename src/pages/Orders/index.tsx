import React, { useState, useEffect, useCallback } from "react";
import { OrdersHeader, OrdersContent } from "./components";
import orderService from "../../services/order";
import { Skeleton, Alert, App } from "antd";
import { useAuth } from "../../context";
import type { CustomerOrder } from "@/services/order/types";

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    year: undefined as number | undefined,
    quarter: undefined as number | undefined,
    status: undefined as string | undefined,
    deliveryAddressId: undefined as string | undefined,
  });
  const { message } = App.useApp();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      // Lấy tất cả đơn hàng từ API mà không có tham số lọc
      const data = await orderService.getMyOrders();

      setOrders(data);
      setFilteredOrders(data); // Ban đầu, hiển thị tất cả đơn hàng
      setError(null);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách đơn hàng");
      message.error(err.message || "Không thể tải danh sách đơn hàng");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [message]);

  // Áp dụng bộ lọc ở phía client
  const applyFilters = useCallback((filterParams: {
    year?: number;
    quarter?: number;
    status?: string;
    deliveryAddressId?: string;
  }) => {
    // Lưu các bộ lọc hiện tại
    setFilters(prev => ({
      ...prev,
      ...filterParams
    }));

    // Lọc đơn hàng dựa trên các bộ lọc
    let filtered = [...orders];

    // Lọc theo năm
    if (filterParams.year) {
      filtered = filtered.filter(order => {
        const orderYear = order.createdAt
          ? new Date(order.createdAt).getFullYear()
          : null;
        return orderYear === filterParams.year;
      });
    }

    // Lọc theo quý
    if (filterParams.quarter) {
      filtered = filtered.filter(order => {
        if (!order.createdAt) return false;
        const orderMonth = new Date(order.createdAt).getMonth() + 1; // JavaScript months are 0-indexed
        const orderQuarter = Math.ceil(orderMonth / 3);
        return orderQuarter === filterParams.quarter;
      });
    }

    // Lọc theo trạng thái
    if (filterParams.status && filterParams.status !== "ALL") {
      filtered = filtered.filter(order => order.status === filterParams.status);
    }

    // Lọc theo địa chỉ
    if (filterParams.deliveryAddressId) {
      filtered = filtered.filter(order => order.deliveryAddressId === filterParams.deliveryAddressId);
    }

    setFilteredOrders(filtered);
  }, [orders]);

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = useCallback((newFilters: {
    year?: number;
    quarter?: number;
    status?: string;
    deliveryAddressId?: string;
  }) => {
    applyFilters(newFilters);
  }, [applyFilters]);

  // Reset bộ lọc
  const resetFilters = useCallback(() => {
    setFilters({
      year: undefined,
      quarter: undefined,
      status: undefined,
      deliveryAddressId: undefined,
    });
    setFilteredOrders(orders);
  }, [orders]);

  useEffect(() => {
    fetchOrders();

    // Cleanup function to prevent memory leaks
    return () => {
      // Cancel any pending requests if needed
    };
  }, [fetchOrders]);

  return (
    <>
      <OrdersHeader />
      {loading ? (
        <div className="p-6">
          <div className="mb-6">
            <Skeleton.Input active size="large" style={{ width: "40%" }} />
            <div className="mt-2">
              <Skeleton.Input active size="small" style={{ width: "60%" }} />
            </div>
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <Skeleton.Avatar active size="large" shape="circle" />
                      <div className="w-full">
                        <Skeleton.Input active style={{ width: "60%" }} />
                        <div className="mt-2">
                          <Skeleton.Input
                            active
                            size="small"
                            style={{ width: "40%" }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Skeleton active paragraph={{ rows: 2 }} />
                      <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                  </div>
                  <Skeleton.Button active shape="round" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          className="my-4"
        />
      ) : (
        <OrdersContent
          orders={filteredOrders}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          allOrders={orders}
        />
      )}
    </>
  );
};

export default OrdersPage;
