import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { App, Button, Typography, Skeleton, Empty, Tabs, Space } from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CarOutlined,
  CreditCardOutlined,
  PrinterOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import orderService from "../../../../services/order/orderService";
import type { StaffOrderDetailResponse } from "../../../../services/order/types";
import VehicleAssignmentModal from "./VehicleAssignmentModal";
import { OrderStatusEnum } from "../../../../constants/enums";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import {
  BasicInfoTab,
  OrderDetailTabs,
  ContractAndPaymentTab,
} from "./StaffOrderDetail/index";
import BillOfLadingPreviewModal from "./StaffOrderDetail/BillOfLadingPreviewModal";
import { useOrderStatusTracking } from "../../../../hooks/useOrderStatusTracking";
import { playImportantNotificationSound } from "../../../../utils/notificationSound";

dayjs.extend(timezone);

const { Title } = Typography;
const { TabPane } = Tabs;

const StaffOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageApi = App.useApp().message;
  const [orderData, setOrderData] = useState<
    StaffOrderDetailResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMainTab, setActiveMainTab] = useState<string>("basic");
  const [vehicleAssignmentModalVisible, setVehicleAssignmentModalVisible] =
    useState<boolean>(false);
  const [billOfLadingPreviewVisible, setBillOfLadingPreviewVisible] =
    useState<boolean>(false);
  const [billOfLadingPreviewLoading, setBillOfLadingPreviewLoading] =
    useState<boolean>(false);
  const [billOfLadingPreviewData, setBillOfLadingPreviewData] = useState<Array<{
    fileName: string;
    base64Content: string;
    mimeType: string;
  }> | null>(null);
  const [previousOrderStatus, setPreviousOrderStatus] = useState<string | null>(null);

  // Handle order status changes via WebSocket
  const handleOrderStatusChange = useCallback((statusChange: any) => {
    console.log('[StaffOrderDetail] 📢 Order status changed:', statusChange);
    
    // Check if this status change is for the current order
    if (id && statusChange.orderId === id) {
      console.log('[StaffOrderDetail] ✅ Order ID matched! Scheduling refetch...');
      
      // Debounce refetch to avoid spike load and prevent mobile WebSocket disruption
      // Wait 500ms to let WebSocket broadcasts settle
      setTimeout(() => {
        console.log('[StaffOrderDetail] 🔄 Refetching order details...');
        fetchOrderDetails(id);
      }, 500);
      
      // Show notification for important status changes
      if (statusChange.newStatus === 'PICKING_UP' && statusChange.previousStatus === 'FULLY_PAID') {
        messageApi.success({
          content: `🚛 ${statusChange.message || 'Tài xế đã bắt đầu lấy hàng!'}`,
          duration: 5,
        });
        playImportantNotificationSound();
      } else if (statusChange.newStatus === 'DELIVERED') {
        messageApi.success({
          content: `✅ ${statusChange.message || 'Đơn hàng đã được giao thành công!'}`,
          duration: 5,
        });
        playImportantNotificationSound();
      } else if (statusChange.newStatus === 'IN_TROUBLES') {
        messageApi.error({
          content: `⚠️ ${statusChange.message || 'Đơn hàng gặp sự cố!'}`,
          duration: 8,
        });
        playImportantNotificationSound();
      } else if (statusChange.newStatus === 'ASSIGNED_TO_DRIVER') {
        messageApi.info({
          content: `🚗 ${statusChange.message || 'Đơn hàng đã được phân công cho tài xế!'}`,
          duration: 5,
        });
        playImportantNotificationSound();
      } else {
        // Generic notification for other status changes
        messageApi.info({
          content: `📦 ${statusChange.message || 'Trạng thái đơn hàng đã thay đổi'}`,
          duration: 4,
        });
      }
    } else {
      console.log('[StaffOrderDetail] ❌ Order ID did not match:', {
        statusChangeOrderId: statusChange.orderId,
        currentOrderId: id
      });
    }
  }, [id, messageApi]);

  // Subscribe to order status changes
  useOrderStatusTracking({
    orderId: id,
    autoConnect: true,
    onStatusChange: handleOrderStatusChange,
  });

  useEffect(() => {
    // Scroll to top when entering order detail page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (id) {
      fetchOrderDetails(id);
    }
  }, [id]);

  // Track order status changes for logging
  useEffect(() => {
    if (orderData?.order?.status) {
      if (previousOrderStatus && previousOrderStatus !== orderData.order.status) {
        console.log('[StaffOrderDetail] Order status changed:', {
          from: previousOrderStatus,
          to: orderData.order.status
        });
      }
      setPreviousOrderStatus(orderData.order.status);
    }
  }, [orderData?.order?.status, previousOrderStatus]);

  const fetchOrderDetails = async (orderId: string) => {
    setLoading(true);
    try {
      const data = await orderService.getOrderForStaffByOrderId(orderId);
      console.log("Fetched order data:", data);
      setOrderData(data);
    } catch (error) {
      messageApi.error("Không thể tải thông tin đơn hàng");
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có thông tin";
    return dayjs(dateString)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY HH:mm:ss");
  };

  const handleVehicleAssignmentSuccess = () => {
    if (id) {
      fetchOrderDetails(id);
    }
  };

  const handlePreviewBillOfLading = async () => {
    if (!id) return;

    setBillOfLadingPreviewLoading(true);
    try {
      const data = await orderService.previewBillOfLading(id);
      setBillOfLadingPreviewData(data);
      setBillOfLadingPreviewVisible(true);
    } catch (error) {
      messageApi.error("Không thể tải vận đơn");
      console.error("Error previewing bill of lading:", error);
    } finally {
      setBillOfLadingPreviewLoading(false);
    }
  };

  // Check if order status is ASSIGNED_TO_DRIVER or later
  const canPrintBillOfLading = () => {
    if (!orderData || !orderData.order) return false;

    const orderStatus = orderData.order.status;
    const statusesAllowingPrint = [
      OrderStatusEnum.ASSIGNED_TO_DRIVER,
      OrderStatusEnum.PICKING_UP,
      OrderStatusEnum.ON_DELIVERED,
      OrderStatusEnum.ONGOING_DELIVERED,
      OrderStatusEnum.IN_TROUBLES,
      OrderStatusEnum.RESOLVED,
      OrderStatusEnum.COMPENSATION,
      OrderStatusEnum.DELIVERED,
      OrderStatusEnum.SUCCESSFUL,
      OrderStatusEnum.REJECT_ORDER,
      OrderStatusEnum.RETURNING,
      OrderStatusEnum.RETURNED,
    ];

    return statusesAllowingPrint.includes(orderStatus as OrderStatusEnum);
  };

  const isOnPlanningStatus = () => {
    if (!orderData || !orderData.order) return false;
    return orderData.order.status === OrderStatusEnum.ON_PLANNING;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="mr-4"
            size="large"
          >
            Quay lại
          </Button>
          <Skeleton.Input style={{ width: 300 }} active />
        </div>
        <Skeleton active paragraph={{ rows: 6 }} />
        <Skeleton active paragraph={{ rows: 6 }} className="mt-6" />
        <Skeleton active paragraph={{ rows: 6 }} className="mt-6" />
      </div>
    );
  }

  if (!orderData || !orderData.order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            size="large"
          >
            Quay lại
          </Button>
        </div>
        <Empty description="Không tìm thấy thông tin đơn hàng" />
      </div>
    );
  }

  const { order, contract, transactions } = orderData;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between">
        <div className="flex items-center mb-2 md:mb-0">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            className="mr-4"
            size="large"
          >
            Quay lại
          </Button>
          <Title level={2} className="m-0">
            Chi tiết đơn hàng {order.orderCode}
          </Title>
        </div>

        <Space size="middle">
          {isOnPlanningStatus() && (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setVehicleAssignmentModalVisible(true)}
              className="bg-green-500 hover:bg-green-600 shadow-md transition-all duration-300 flex items-center px-5 py-6 text-base"
              size="large"
            >
              Phân công tài xế
            </Button>
          )}

          {canPrintBillOfLading() && (
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePreviewBillOfLading}
              loading={billOfLadingPreviewLoading}
              className="bg-blue-500 hover:bg-blue-600 shadow-md transition-all duration-300 flex items-center px-5 py-6 text-base"
              size="large"
            >
              In vận đơn
            </Button>
          )}
        </Space>
      </div>

      <Tabs
        activeKey={activeMainTab}
        onChange={setActiveMainTab}
        type="card"
        className="order-main-tabs"
      >
        <TabPane
          tab={
            <span>
              <InfoCircleOutlined /> Thông tin cơ bản
            </span>
          }
          key="basic"
        >
          <BasicInfoTab order={order} />
        </TabPane>
        <TabPane
          tab={
            <span>
              <CarOutlined /> Chi tiết vận chuyển
            </span>
          }
          key="detail"
        >
          <OrderDetailTabs
            order={order}
            formatDate={formatDate}
            setVehicleAssignmentModalVisible={setVehicleAssignmentModalVisible}
          />
        </TabPane>
        <TabPane
          tab={
            <span>
              <CreditCardOutlined /> Hợp đồng & Thanh toán
            </span>
          }
          key="contract"
        >
          <ContractAndPaymentTab
            contract={contract}
            transactions={transactions}
            orderId={id}
            depositAmount={order.depositAmount}
          />
        </TabPane>
      </Tabs>

      {/* Vehicle Assignment Modal */}
      {id && orderData && orderData.order && orderData.order.orderDetails && (
        <VehicleAssignmentModal
          visible={vehicleAssignmentModalVisible}
          orderId={id}
          orderDetails={orderData.order.orderDetails}
          onClose={() => setVehicleAssignmentModalVisible(false)}
          onSuccess={handleVehicleAssignmentSuccess}
        />
      )}

      {/* Bill of Lading Preview Modal */}
      <BillOfLadingPreviewModal
        visible={billOfLadingPreviewVisible}
        onClose={() => setBillOfLadingPreviewVisible(false)}
        loading={billOfLadingPreviewLoading}
        documents={billOfLadingPreviewData}
      />
    </div>
  );
};

export default StaffOrderDetail;
