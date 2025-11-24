import React, { useState, useMemo, useEffect } from "react";
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
  Divider,
  Space,
  App,
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
  ReloadOutlined,
} from "@ant-design/icons";
import { PackageIcon } from "lucide-react";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Order, OrderStatus, CustomerOrder } from "../../../models/Order";
import type { Address } from "../../../models/Address";
import addressService from "../../../services/address/addressService";
import { OrderStatusTag } from "../../../components/common/tags";
import { OrderStatusEnum } from "../../../constants/enums";

import { formatDate, formatDateTimeWithSeconds } from "../../../utils/formatters";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const { Text, Title } = Typography;
const { Option } = Select;


interface OrdersContentProps {
  orders: CustomerOrder[];
  allOrders?: CustomerOrder[];
  onFilterChange?: (filters: {
    year?: number;
    quarter?: number;
    status?: string;
    deliveryAddressId?: string;
  }) => void;
  onResetFilters?: () => void;
}

/**
 * Provides color-coding for order status tags.
 * @param status The order status string.
 * @returns The Ant Design color string for the tag.
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case "PENDING":
      return "orange";
    case "PROCESSING":
      return "blue";
    case "PICKING_UP":
    case "ON_DELIVERED":
    case "ONGOING_DELIVERED":
      return "purple";
    case "DELIVERED":
    case "SUCCESSFUL":
      return "green";
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
const getStatusText = (status: string): string => {
  switch (status) {
    case "PENDING":
      return "Chờ xử lý";
    case "PROCESSING":
      return "Đang xử lý";
    case "CONTRACT_DRAFT":
      return "Bản nháp hợp đồng";
    case "CONTRACT_SIGNED":
      return "Hợp đồng đã ký";
    case "ON_PLANNING":
      return "Đang lập kế hoạch";
    case "ASSIGNED_TO_DRIVER":
      return "Đã giao cho tài xế";
    case "FULLY_PAID":
      return "Đã thanh toán đầy đủ";
    case "PICKING_UP":
      return "Đang lấy hàng";
    case "ON_DELIVERED":
    case "ONGOING_DELIVERED":
      return "Đang vận chuyển";
    case "DELIVERED":
      return "Đã giao hàng";
    case "SUCCESSFUL":
      return "Hoàn thành thành công";
    case "REJECT_ORDER":
      return "Từ chối đơn hàng";
    case "IN_TROUBLES":
      return "Gặp sự cố";
    case "RESOLVED":
      return "Đã giải quyết";
    case "COMPENSATION":
      return "Đền bù";
    case "RETURNED":
      return "Đã trả lại";
    case "RETURNING":
      return "Đang trả lại";
    default:
      return status.replace(/_/g, " ");
  }
};

// Status group definitions
const statusGroups = [
  {
    name: "Đang chờ",
    color: "orange",
    statuses: ["PENDING", "PROCESSING", "CONTRACT_DRAFT"],
  },
  {
    name: "Đang vận chuyển",
    color: "blue",
    statuses: ["PICKING_UP", "ON_DELIVERED", "ONGOING_DELIVERED"],
  },
  {
    name: "Hoàn thành",
    color: "green",
    statuses: ["DELIVERED", "SUCCESSFUL", "RESOLVED"],
  },
  {
    name: "Từ chối",
    color: "red",
    statuses: ["REJECT_ORDER"],
  },
  {
    name: "Sự cố",
    color: "red",
    statuses: ["IN_TROUBLES", "COMPENSATION"],
  },
  {
    name: "Hoàn trả",
    color: "purple",
    statuses: ["RETURNING", "RETURNED"],
  },
];

const OrdersContent: React.FC<OrdersContentProps> = ({
  orders,
  onFilterChange,
  onResetFilters,
  allOrders = []
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [statusGroupFilter, setStatusGroupFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [quarterFilter, setQuarterFilter] = useState<number | undefined>(undefined);
  const [addressFilter, setAddressFilter] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<{
    year?: number;
    quarter?: number;
    status?: string;
    deliveryAddressId?: string;
  }>({});
  const [deliveryAddresses, setDeliveryAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState<boolean>(false);
  const { message } = App.useApp();

  // Fetch delivery addresses when component mounts
  useEffect(() => {
    const fetchDeliveryAddresses = async () => {
      setLoadingAddresses(true);
      try {
        const addresses = await addressService.getMyDeliveryAddresses();
        setDeliveryAddresses(addresses);
      } catch (error) {
        console.error("Error fetching delivery addresses:", error);
        // message.error("Không thể tải danh sách địa chỉ giao hàng");
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchDeliveryAddresses();
  }, []);

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Quarter options
  const quarterOptions = [
    { value: 1, label: "Quý 1 (Tháng 1-3)" },
    { value: 2, label: "Quý 2 (Tháng 4-6)" },
    { value: 3, label: "Quý 3 (Tháng 7-9)" },
    { value: 4, label: "Quý 4 (Tháng 10-12)" },
  ];

  // Extract unique addresses from orders
  const uniqueAddresses = useMemo(() => {
    // Sử dụng allOrders nếu có để có danh sách địa chỉ đầy đủ
    const sourceOrders = allOrders && allOrders.length > 0 ? allOrders : orders;

    if (!sourceOrders || sourceOrders.length === 0) {
      return [];
    }

    const addresses = sourceOrders.map((order) => ({
      id: order.deliveryAddressId,
      address: order.deliveryAddress
    })).filter((item) => item.id && item.address) // Filter out any undefined values
      .filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );
    return addresses;
  }, [orders, allOrders]);

  // Status options
  const statuses = [
    { value: "ALL", label: "Tất cả" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "PROCESSING", label: "Đang xử lý" },
    { value: "PICKING_UP", label: "Đang lấy hàng" },
    { value: "ON_DELIVERED", label: "Đang vận chuyển" },
    { value: "DELIVERED", label: "Đã giao" },
    { value: "SUCCESSFUL", label: "Thành công" },
    { value: "IN_TROUBLES", label: "Gặp sự cố" },
    { value: "RETURNED", label: "Đã trả hàng" },
  ];



  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setStatusGroupFilter("ALL");
    setYearFilter(undefined);
    setQuarterFilter(undefined);
    setAddressFilter(undefined);
    setCurrentPage(1);
    setFilters({});

    // Reset server-side filters
    if (onResetFilters) {
      onResetFilters();
    }
  };

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      // Text search
      const matchesSearch =
        !searchTerm ||
        order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.pickupAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.receiverName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status group filter (chỉ áp dụng khi không có onFilterChange, vì nếu có thì đã được xử lý ở component cha)
      const matchesStatusGroup = !onFilterChange ||
        statusGroupFilter === "ALL" ||
        statusGroups
          .find((group) => group.name === statusGroupFilter)
          ?.statuses.includes(order.status);

      return matchesSearch && matchesStatusGroup;
    });

    return filtered;
  }, [
    orders,
    searchTerm,
    statusGroupFilter,
    onFilterChange
  ]);

  // Update current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, statusGroupFilter, yearFilter, quarterFilter, addressFilter]);

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
          <div className="mb-4">
            <Text className="text-sm text-gray-600 mb-1 block">
              Tìm Kiếm
            </Text>
            <Input
              placeholder="Mã đơn hàng, địa điểm, người nhận..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              size="large"
              className="mb-4"
            />
          </div>

          <Divider orientation="left">Bộ lọc</Divider>

          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text className="text-sm text-gray-600 mb-1 block">
                  Năm
                </Text>
                <Select
                  placeholder="Chọn năm"
                  value={yearFilter}
                  onChange={(value) => {
                    setYearFilter(value);
                    if (onFilterChange) {
                      const newFilters = { ...filters, year: value };
                      setFilters(newFilters);
                      onFilterChange(newFilters);
                    }
                  }}
                  className="w-full"
                  allowClear
                  size="middle"
                >
                  {yearOptions.map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text className="text-sm text-gray-600 mb-1 block">
                  Quý
                </Text>
                <Select
                  placeholder="Chọn quý"
                  value={quarterFilter}
                  onChange={(value) => {
                    setQuarterFilter(value);
                    if (onFilterChange) {
                      const newFilters = { ...filters, quarter: value };
                      setFilters(newFilters);
                      onFilterChange(newFilters);
                    }
                  }}
                  className="w-full"
                  allowClear
                  size="middle"
                >
                  {quarterOptions.map((quarter) => (
                    <Option key={quarter.value} value={quarter.value}>
                      {quarter.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <div>
                <Text className="text-sm text-gray-600 mb-1 block">
                  Địa chỉ nhận hàng
                </Text>
                <Select
                  placeholder="Chọn địa chỉ"
                  value={addressFilter}
                  onChange={(value) => {
                    setAddressFilter(value);
                    if (onFilterChange) {
                      const newFilters = { ...filters, deliveryAddressId: value };
                      setFilters(newFilters);
                      onFilterChange(newFilters);
                    }
                  }}
                  className="w-full"
                  allowClear
                  showSearch
                  loading={loadingAddresses}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                  }
                  size="middle"
                >
                  {deliveryAddresses.map((address) => {
                    const addressText = `${address.street}, ${address.ward}, ${address.province}`;
                    return (
                      <Option key={address.id} value={address.id} label={addressText}>
                        {addressText}
                      </Option>
                    );
                  })}
                </Select>
              </div>
            </Col>
          </Row>

          <div className="mt-4 flex justify-end">
            <Button
              icon={<ReloadOutlined />}
              onClick={resetFilters}
              className="mr-2"
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>

        {/* Status Group Tags */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <Text className="text-sm text-gray-600 mb-2 block">
            Lọc nhanh theo nhóm trạng thái
          </Text>
          <Space size="middle" wrap>
            <Tag
              className="px-3 py-1 cursor-pointer text-base"
              color={statusGroupFilter === "ALL" ? "blue" : undefined}
              onClick={() => {
                setStatusGroupFilter("ALL");
                setStatusFilter("ALL");
                if (onFilterChange) {
                  const newFilters = { ...filters, status: undefined };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                }
              }}
            >
              Tất cả
            </Tag>
            {statusGroups.map((group) => (
              <Tag
                key={group.name}
                className="px-3 py-1 cursor-pointer text-base"
                color={statusGroupFilter === group.name ? group.color : undefined}
                onClick={() => {
                  setStatusGroupFilter(group.name);
                  // Khi chọn nhóm, chọn trạng thái đầu tiên trong nhóm
                  const firstStatus = group.statuses[0];
                  setStatusFilter(firstStatus);
                  if (onFilterChange) {
                    const newFilters = { ...filters, status: firstStatus };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                  }
                }}
              >
                {group.name}
              </Tag>
            ))}
          </Space>
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
                    <OrderStatusTag status={order.status as OrderStatusEnum} />
                  </div>

                  <Text className="text-gray-500 text-sm mb-3 block">
                    Ngày tạo đơn:{" "}
                    <strong>
                      {order.createdAt ? formatDateTimeWithSeconds(order.createdAt) : "N/A"}
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
                            {order.pickupAddress || "N/A"}
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
                            {order.deliveryAddress || "N/A"}
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
                  {searchTerm || statusFilter !== "ALL" || yearFilter || quarterFilter || addressFilter
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
