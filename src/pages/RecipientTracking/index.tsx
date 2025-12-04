import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  App,
  Button,
  Typography,
  Skeleton,
  Empty,
  Tabs,
  Card,
  Input,
  Form,
  Alert,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CarOutlined,
  EnvironmentOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import orderService from "../../services/order/orderService";
import { OrderStatusEnum, OrderStatusLabels } from "../../constants/enums";
import { areAllOrderDetailsInFinalStatus } from "../../utils/statusHelpers";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Import reusable components
import RecipientBasicInfoTab from "./components/RecipientBasicInfoTab";
import OrderDetailsTab from "../Orders/components/CustomerOrderDetail/OrderDetailsTab";
import OrderLiveTrackingOnly from "../Orders/components/CustomerOrderDetail/OrderLiveTrackingOnly";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;

/**
 * RecipientOrderTracking - Trang tra cứu đơn hàng cho người nhận
 * Không yêu cầu đăng nhập, chỉ cần nhập mã đơn hàng
 * Hiển thị thông tin đơn hàng và live tracking (không có hợp đồng/thanh toán)
 */
const RecipientOrderTracking: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const messageApi = App.useApp().message;
  
  // State
  const [orderCode] = useState<string>(searchParams.get("code") || "");
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);
  const [activeMainTab, setActiveMainTab] = useState<string>("basic");
  const [activeDetailTab, setActiveDetailTab] = useState<string>("0");
  const [form] = Form.useForm();

  // Format date helper
  const formatDate = useCallback((date?: string) => {
    if (!date) return "Chưa cập nhật";
    return dayjs(date).tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm");
  }, []);

  // Get status color helper
  const getStatusColor = useCallback((status: string) => {
    const colorMap: Record<string, string> = {
      PENDING: "gold",
      PROCESSING: "blue",
      CONTRACT_DRAFT: "cyan",
      CONTRACT_SIGNED: "geekblue",
      ON_PLANNING: "purple",
      ASSIGNED_TO_DRIVER: "magenta",
      FULLY_PAID: "green",
      PICKING_UP: "lime",
      ON_DELIVERED: "orange",
      ONGOING_DELIVERED: "volcano",
      DELIVERED: "green",
      IN_TROUBLES: "red",
      RESOLVED: "cyan",
      COMPENSATION: "gold",
      SUCCESSFUL: "green",
      REJECT_ORDER: "red",
      RETURNING: "orange",
      RETURNED: "purple",
      CANCELLED: "default",
    };
    return colorMap[status] || "default";
  }, []);

  // Search order by code
  const handleSearch = useCallback(async (values: { orderCode: string }) => {
    const code = values.orderCode?.trim();
    if (!code) {
      messageApi.warning("Vui lòng nhập mã đơn hàng");
      return;
    }

    setLoading(true);
    setSearched(true);
    setOrderData(null);

    try {
      const data = await orderService.getOrderForRecipientByOrderCode(code);
      setOrderData(data);
      setSearchParams({ code });
      setActiveMainTab("basic");
    } catch (error: any) {
      console.error("Error fetching order:", error);
      messageApi.error(error?.message || "Không tìm thấy đơn hàng với mã này");
    } finally {
      setLoading(false);
    }
  }, [messageApi, setSearchParams]);

  // Check if should show real-time tracking
  const shouldShowRealTimeTracking = useMemo(() => {
    if (!orderData?.order) return false;
    
    const trackingStatuses = [
      OrderStatusEnum.PICKING_UP,
      OrderStatusEnum.ON_DELIVERED,
      OrderStatusEnum.ONGOING_DELIVERED,
      OrderStatusEnum.DELIVERED,
      OrderStatusEnum.IN_TROUBLES,
      OrderStatusEnum.RESOLVED,
      OrderStatusEnum.RETURNING,
    ];
    
    const isDeliveryStatus = trackingStatuses.includes(orderData.order.status as OrderStatusEnum);
    const allDetailsInFinalStatus = areAllOrderDetailsInFinalStatus(orderData.order.orderDetails);
    
    return isDeliveryStatus && !allDetailsInFinalStatus;
  }, [orderData]);

  // Tab change handler
  const handleTabChange = useCallback((key: string) => {
    setActiveMainTab(key);
  }, []);

  // Render search form
  const renderSearchForm = () => (
    <Card className="mb-6 shadow-md rounded-xl">
      <div className="text-center mb-6">
        <Title level={3} className="!mb-2">
          <SearchOutlined className="mr-2 text-blue-600" />
          Tra cứu đơn hàng
        </Title>
        <Text type="secondary">
          Nhập mã đơn hàng để xem thông tin và theo dõi trạng thái giao hàng
        </Text>
      </div>
      
      <Form
        form={form}
        onFinish={handleSearch}
        layout="inline"
        className="justify-center"
        initialValues={{ orderCode }}
      >
        <Form.Item
          name="orderCode"
          rules={[{ required: true, message: "Vui lòng nhập mã đơn hàng" }]}
          className="!mb-0 flex-1 max-w-md"
        >
          <Input
            placeholder="Nhập mã đơn hàng (VD: ORD-XXXXXX)"
            size="large"
            prefix={<SearchOutlined className="text-gray-400" />}
            allowClear
          />
        </Form.Item>
        <Form.Item className="!mb-0">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            icon={<SearchOutlined />}
            className="bg-blue-600"
          >
            Tra cứu
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // Render order content
  const renderOrderContent = () => {
    if (loading) {
      return (
        <Card className="shadow-md rounded-xl">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      );
    }

    if (!orderData?.order) {
      if (searched) {
        return (
          <Card className="shadow-md rounded-xl">
            <Empty
              description="Không tìm thấy đơn hàng với mã này"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Text type="secondary">
                Vui lòng kiểm tra lại mã đơn hàng và thử lại
              </Text>
            </Empty>
          </Card>
        );
      }
      return null;
    }

    const order = orderData.order;

    return (
      <Card className="shadow-md rounded-xl">
        {/* Order Header - Blue Background */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <Title level={4} className="!mb-1 !text-white">
                Đơn hàng: {order.orderCode}
              </Title>
              <Text className="text-blue-100">
                Ngày tạo: {formatDate(order.createdAt)}
              </Text>
            </div>
            <div className="text-right">
              <Tag 
                color={getStatusColor(order.status) === 'default' ? '#666' : getStatusColor(order.status)} 
                className="text-sm px-3 py-1 border-0"
              >
                {OrderStatusLabels[order.status as OrderStatusEnum] || order.status}
              </Tag>
            </div>
          </div>
        </div>

        {/* Info Alert for Recipients */}
        {/* <Alert
          message="Thông tin dành cho người nhận"
          description="Bạn đang xem thông tin đơn hàng với tư cách người nhận. Một số thông tin nhạy cảm như hợp đồng và thanh toán sẽ không được hiển thị."
          type="info"
          showIcon
          className="mb-4"
        /> */}

        {/* Tabs */}
        <Tabs
          activeKey={activeMainTab}
          onChange={handleTabChange}
          type="card"
          items={[
            {
              key: "basic",
              label: (
                <span>
                  <InfoCircleOutlined className="mr-1" />
                  Thông tin cơ bản
                </span>
              ),
              children: (
                <RecipientBasicInfoTab order={order} />
              ),
            },
            {
              key: "details",
              label: (
                <span>
                  <CarOutlined className="mr-1" />
                  Chi tiết vận chuyển
                </span>
              ),
              children: (
                <OrderDetailsTab
                  order={order}
                  activeDetailTab={activeDetailTab}
                  onTabChange={setActiveDetailTab}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                />
              ),
            },
            ...(shouldShowRealTimeTracking
              ? [
                  {
                    key: "liveTracking",
                    label: (
                      <span>
                        <EnvironmentOutlined className="mr-1" />
                        Theo dõi GPS
                      </span>
                    ),
                    children: (
                      <OrderLiveTrackingOnly
                        orderId={order.id}
                        shouldShowRealTimeTracking={shouldShowRealTimeTracking}
                        vehicleAssignments={order.vehicleAssignments}
                        isTabActive={activeMainTab === "liveTracking"}
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back Button */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/")}
        className="mb-4 text-blue-600 hover:text-blue-700"
      >
        Về trang chủ
      </Button>

      {/* Search Form */}
      {renderSearchForm()}

      {/* Order Content */}
      {renderOrderContent()}
    </div>
  );
};

export default RecipientOrderTracking;
