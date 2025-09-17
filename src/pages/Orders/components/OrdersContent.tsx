import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Button,
  Typography,
  Row,
  Col,
  Tag,
  Input,
  Select,
  Pagination,
} from "antd";
import {
  EnvironmentOutlined,
  UserOutlined,
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  BoxPlotOutlined,
  EyeOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { PackageIcon } from "lucide-react";
import type { Order, OrderStatus } from "../../../models/Order";

import { formatDate } from "../../../utils/formatters";
const { Text, Title } = Typography;
const { Option } = Select;


interface OrdersContentProps {
  orders: Order[];
}

/**
 * Provides color-coding for order status tags.
 * @param status The order status string.
 * @returns The Ant Design color string for the tag.
 */
const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case "PENDING":
      return "orange";
    case "PROCESSING":
      return "blue";
    case "PICKED_UP":
    case "ON_DELIVERED":
    case "ONGOING_DELIVERED":
      return "purple";
    case "DELIVERED":
    case "SUCCESSFUL":
      return "green";
    case "CANCELLED":
    case "REJECT_ORDER":
      return "red";
    case "IN_TROUBLES":
      return "red";
    case "RETURNED":
    case "RETURNING":
      return "orange";
    default:
      return "default";
  }
};

/**
 * Provides a Vietnamese display name for an order status.
 * @param status The order status string.
 * @returns The Vietnamese display text.
 */
const getStatusText = (status: OrderStatus): string => {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "PROCESSING":
      return "Đang xử lý";
    case "PICKED_UP":
      return "Đã lấy hàng";
    case "ON_DELIVERED":
    case "ONGOING_DELIVERED":
      return "Out for Delivery";
    case "DELIVERED":
    case "SUCCESSFUL":
      return "Delivered";
    case "CANCELLED":
    case "REJECT_ORDER":
      return "Cancelled";
    case "IN_TROUBLES":
      return "Delayed";
    case "RETURNED":
    case "RETURNING":
      return "In Transit";
    default:
      return status.replace(/_/g, " ");
  }
};

const OrdersContent: React.FC<OrdersContentProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const statuses = [
    { value: "ALL", label: "Tất cả" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "PROCESSING", label: "Đang xử lý" },
    { value: "PICKED_UP", label: "Đã lấy hàng" },
    { value: "ON_DELIVERED", label: "Đang vận chuyển" },
    { value: "DELIVERED", label: "Đã giao" },
    { value: "SUCCESSFUL", label: "Thành công" },
    { value: "CANCELLED", label: "Đã hủy" },
    { value: "IN_TROUBLES", label: "Gặp sự cố" },
    { value: "RETURNED", label: "Đã hoàn trả" },
  ];

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const pickupAddressStr = order.pickupAddress
        ? `${order.pickupAddress.street}, ${order.pickupAddress.ward}, ${order.pickupAddress.province}`
        : "";
      const deliveryAddressStr = order.deliveryAddress
        ? `${order.deliveryAddress.street}, ${order.deliveryAddress.ward}, ${order.deliveryAddress.province}`
        : "";

      const matchesSearch =
        order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pickupAddressStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deliveryAddressStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.receiverName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Reset to first page when filter changes
    setCurrentPage(1);

    return filtered;
  }, [orders, searchTerm, statusFilter]);

  // Pagination logic
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, pageSize]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1); // Reset to first page when page size changes
    }
  };

  // Format date to Vietnam timezone with hours and minutes
  const formatDateToVNTime = (date: string | undefined) => {
    if (!date) return "N/A";
    return dayjs(date).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Search and Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <div>
                <Text className="text-sm text-gray-600 mb-1 block">
                  Tìm Kiếm
                </Text>
                <Input
                  placeholder="Tracking #, địa điểm, người nhận..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  size="large"
                />
              </div>
            </Col>
            <Col span={6}>
              <div>
                <Text className="text-sm text-gray-600 mb-1 block">
                  Trạng Thái
                </Text>
                <Select
                  placeholder="Tất cả"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value)}
                  className="w-full"
                  suffixIcon={<FilterOutlined />}
                  size="large"
                >
                  {statuses.map((status) => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>
            <Col span={6}>
              <div>
                <Text className="text-sm text-gray-600 mb-1 block">
                  Sắp Xếp Theo
                </Text>
                <Select defaultValue="newest" className="w-full" size="large">
                  <Option value="newest">Ngày Đặt Hàng (Mới Nhất)</Option>
                  <Option value="oldest">Ngày Đặt Hàng (Cũ Nhất)</Option>
                </Select>
              </div>
            </Col>
          </Row>
        </div>

        {/* Orders List */}
        <div className="space-y-5">
          {paginatedOrders.map((order) => (
            <Card
              key={order.id}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                {/* Left Section - Order Info */}
                <div className="flex-1">
                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <PackageIcon className="text-blue-600" />
                      <Text strong className="text-lg">
                        {order.orderCode ||
                          `SHIP${order.id?.slice(-8) || "12345678"}`}
                      </Text>
                    </div>
                    <Tag color={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Tag>
                  </div>

                  <Text className="text-gray-500 text-sm mb-3 block">
                    Ngày tạo đơn:{" "}
                    <strong>
                      {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                    </strong>
                  </Text>

                  {/* Address and Details Row */}
                  <Row gutter={[24, 8]} className="mb-3">
                    <Col span={8}>
                      <div className="flex items-start gap-2">
                        <EnvironmentOutlined className="text-gray-400 mt-1" />
                        <div>
                          <Text className="text-xs text-gray-500 block">
                            TỪ
                          </Text>
                          <Text className="text-sm">
                            {order.pickupAddress
                              ? `${order.pickupAddress.street}, ${order.pickupAddress.ward}`
                              : "N/A"}
                          </Text>
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="flex items-start gap-2">
                        <EnvironmentOutlined className="text-gray-400 mt-1" />
                        <div>
                          <Text className="text-xs text-gray-500 block">
                            ĐẾN
                          </Text>
                          <Text className="text-sm">
                            {order.deliveryAddress
                              ? `${order.deliveryAddress.street}, ${order.deliveryAddress.ward}`
                              : "N/A"}
                          </Text>
                        </div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div className="flex items-start gap-2">
                        <ClockCircleOutlined className="text-gray-400 mt-1" />
                        <div>
                          <Text className="text-xs text-gray-500 block">
                            NGÀY GIAO HÀNG
                          </Text>
                          <Text className="text-sm">
                            {order.createdAt
                              ? formatDate(order.createdAt)
                              : "N/A"}{" "}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Recipient and Details Row */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <UserOutlined className="text-gray-400" />
                      <Text className="text-sm">
                        Người nhận: {order.receiverName || "N/A"}
                      </Text>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Giao hàng tiêu chuẩn</span>
                      <span>{order.totalQuantity || 0} mục</span>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex justify-end gap-3 ">
                    <Link to={`/orders/${order.id}`}>
                      <Button
                        type="default"
                        shape="circle"
                        size="large"
                        icon={<EyeOutlined />}
                        title="View Details"
                      />
                    </Link>
                    <Button
                      type="primary"
                      shape="circle"
                      size="large"
                      icon={<CarOutlined />}
                      title="Track Package"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <div className="flex justify-center mt-8">
            <Pagination
              current={currentPage}
              total={filteredOrders.length}
              pageSize={pageSize}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} của ${total} đơn hàng`
              }
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
              pageSizeOptions={["5", "10", "20", "50"]}
            />
          </div>
        )}

        {filteredOrders.length === 0 && (
          <Card className="text-center py-12">
            <div className="space-y-4">
              <BoxPlotOutlined className="text-6xl text-gray-300" />
              <div>
                <Title level={3} type="secondary">
                  Không tìm thấy đơn hàng
                </Title>
                <Text type="secondary">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Thử thay đổi điều kiện tìm kiếm hoặc bộ lọc"
                    : "Chưa có đơn hàng nào được tạo"}
                </Text>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrdersContent;
