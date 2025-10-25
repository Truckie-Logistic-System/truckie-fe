import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { App, Button, Typography, Skeleton, Empty, Tabs, Card, message } from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CarOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import orderService from "../../../services/order/orderService";
import httpClient from "../../../services/api/httpClient";
import { useOrderStatusTracking } from "../../../hooks/useOrderStatusTracking";
import { playImportantNotificationSound } from "../../../utils/notificationSound";
import type {
  CustomerOrderDetailResponse,
  VehicleSuggestion,
} from "../../../services/order/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Import components
import BasicInfoTab from "./CustomerOrderDetail/BasicInfoTab";
import OrderDetailsTab from "./CustomerOrderDetail/OrderDetailsTab";
import ContractSection from "./CustomerOrderDetail/ContractSection";
import TransactionSection from "./CustomerOrderDetail/TransactionSection";
import VehicleSuggestionsModal from "./CustomerOrderDetail/VehicleSuggestionsModal";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title } = Typography;
const { TabPane } = Tabs;

const CustomerOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messageApi = App.useApp().message;
  const [orderData, setOrderData] = useState<
    CustomerOrderDetailResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMainTab, setActiveMainTab] = useState<string>("basic");
  const [activeDetailTab, setActiveDetailTab] = useState<string>("0");
  const [vehicleSuggestions, setVehicleSuggestions] = useState<
    VehicleSuggestion[]
  >([]);
  const [vehicleSuggestionsModalVisible, setVehicleSuggestionsModalVisible] =
    useState<boolean>(false);
  const [loadingVehicleSuggestions, setLoadingVehicleSuggestions] =
    useState<boolean>(false);
  const [hasContract, setHasContract] = useState<boolean>(false);
  const [checkingContract, setCheckingContract] = useState<boolean>(false);
  const [creatingContract, setCreatingContract] = useState<boolean>(false);
  const [previousOrderStatus, setPreviousOrderStatus] = useState<string | null>(null);

  // NOTE: Real-time tracking logic is now handled inside RouteMapWithRealTimeTracking
  // to prevent unnecessary re-renders of CustomerOrderDetail parent component

  // Handle order status changes via WebSocket
  const handleOrderStatusChange = useCallback((statusChange: any) => {
    console.log('[CustomerOrderDetail] 📢 Order status changed:', statusChange);
    
    // Check if this status change is for the current order
    if (id && statusChange.orderId === id) {
      console.log('[CustomerOrderDetail] ✅ Order ID matched! Scheduling refetch...');
      
      // Debounce refetch to avoid spike load and prevent mobile WebSocket disruption
      // Wait 500ms to let WebSocket broadcasts settle
      setTimeout(() => {
        console.log('[CustomerOrderDetail] 🔄 Refetching order details...');
        fetchOrderDetails(id);
      }, 500);
      
      // Show notification for important status changes
      if (statusChange.newStatus === 'PICKING_UP' && statusChange.previousStatus === 'FULLY_PAID') {
        message.success({
          content: `🚛 ${statusChange.message || 'Tài xế đã bắt đầu lấy hàng!'}`,
          duration: 5,
        });
        playImportantNotificationSound();
        
        // Auto-switch to "Chi tiết vận chuyển" tab
        setTimeout(() => {
          setActiveMainTab('details');
        }, 1000);
      } else if (statusChange.newStatus === 'DELIVERED') {
        message.success({
          content: `✅ ${statusChange.message || 'Đơn hàng đã được giao thành công!'}`,
          duration: 5,
        });
        playImportantNotificationSound();
      } else if (statusChange.newStatus === 'IN_TROUBLES') {
        message.error({
          content: `⚠️ ${statusChange.message || 'Đơn hàng gặp sự cố!'}`,
          duration: 8,
        });
        playImportantNotificationSound();
      }
    } else {
      console.log('[CustomerOrderDetail] ❌ Order ID did not match:', {
        statusChangeOrderId: statusChange.orderId,
        currentOrderId: id
      });
    }
  }, [id]);

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
        console.log('[CustomerOrderDetail] Order status changed:', {
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
      const data = await orderService.getOrderForCustomerByOrderId(orderId);
      setOrderData(data);
      checkContractExists(orderId);
    } catch (error) {
      messageApi.error("Không thể tải thông tin đơn hàng");
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkContractExists = async (orderId: string) => {
    setCheckingContract(true);
    try {
      const response = await orderService.checkContractByOrderId(orderId);
      setHasContract(response.success && response.data !== null);
    } catch (error) {
      console.error("Error checking contract:", error);
      setHasContract(false);
    } finally {
      setCheckingContract(false);
    }
  };

  const fetchVehicleSuggestions = async () => {
    if (!id) return;

    setLoadingVehicleSuggestions(true);
    try {
      const response =
        await orderService.getBothOptimalAndRealisticAssignVehicles(id);
      setVehicleSuggestions(response.data.realistic);
      setVehicleSuggestionsModalVisible(true);
    } catch (error) {
      messageApi.error("Không thể tải đề xuất phân xe");
      console.error("Error fetching vehicle suggestions:", error);
    } finally {
      setLoadingVehicleSuggestions(false);
    }
  };

  const handleAcceptVehicleSuggestion = async () => {
    if (!id) return;

    setCreatingContract(true);
    try {
      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 19);

      const contractData = {
        contractName: "N/A",
        effectiveDate: formattedDate,
        expirationDate: formattedDate,
        supportedValue: 0,
        description: "N/A",
        attachFileUrl: "N/A",
        orderId: id,
      };

      const response = await httpClient.post("/contracts/both", contractData);

      if (response.data.success) {
        messageApi.success(
          response.data.message || "Đã đồng ý với đề xuất phân xe thành công!"
        );
        setVehicleSuggestionsModalVisible(false);
        setHasContract(true);
        fetchOrderDetails(id);
      } else {
        throw new Error(response.data.message || "Failed to create contract");
      }
    } catch (error) {
      messageApi.error("Không thể tạo hợp đồng. Vui lòng thử lại!");
      console.error("Error creating contract:", error);
    } finally {
      setCreatingContract(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có thông tin";
    return dayjs(dateString)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY HH:mm:ss");
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "orange",
      PROCESSING: "blue",
      CANCELLED: "red",
      DELIVERED: "green",
      SUCCESSFUL: "green",
      IN_TROUBLES: "red",
      // Add more status mappings as needed
    };
    return statusMap[status] || "default";
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/orders")}
            className="mr-4"
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
        <div className="mb-6 flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/orders")}
            className="mr-4"
          >
            Quay lại
          </Button>
          <Title level={3}>Chi tiết đơn hàng</Title>
        </div>
        <Empty
          description="Không tìm thấy thông tin đơn hàng"
          className="bg-white p-8 rounded-xl shadow-md"
        />
      </div>
    );
  }

  const { order, contract, transactions } = orderData;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/orders")}
          className="mr-4"
        >
          Quay lại
        </Button>
        <Title level={3}>Chi tiết đơn hàng {order.orderCode}</Title>
      </div>

      <Card className="mb-6 shadow-md rounded-xl">
        <Tabs
          activeKey={activeMainTab}
          onChange={setActiveMainTab}
          type="card"
          size="large"
          className="order-main-tabs"
        >
          <TabPane
            tab={
              <span className="px-2 py-1">
                <InfoCircleOutlined className="mr-2" /> Thông tin cơ bản
              </span>
            }
            key="basic"
          >
            <BasicInfoTab
              order={order}
              hasContract={hasContract}
              checkingContract={checkingContract}
              loadingVehicleSuggestions={loadingVehicleSuggestions}
              onFetchVehicleSuggestions={fetchVehicleSuggestions}
            />
          </TabPane>
          <TabPane
            tab={
              <span className="px-2 py-1">
                <CarOutlined className="mr-2" /> Chi tiết vận chuyển
              </span>
            }
            key="details"
          >
            <OrderDetailsTab
              order={order}
              activeDetailTab={activeDetailTab}
              onTabChange={setActiveDetailTab}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
            />
          </TabPane>
          <TabPane
            tab={
              <span className="px-2 py-1">
                <ProfileOutlined className="mr-2" /> Hợp đồng & Thanh toán
              </span>
            }
            key="contract"
          >
            <div>
              {/* Contract Information */}
              <ContractSection 
                contract={contract} 
                orderStatus={order.status} 
                depositAmount={order.depositAmount}
              />

              {/* Transaction Information */}
              <TransactionSection transactions={transactions} />
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Modal Suggest Contract Rule */}
      <VehicleSuggestionsModal
        visible={vehicleSuggestionsModalVisible}
        orderCode={order.orderCode}
        vehicleSuggestions={vehicleSuggestions}
        creatingContract={creatingContract}
        onCancel={() => setVehicleSuggestionsModalVisible(false)}
        onAccept={handleAcceptVehicleSuggestion}
      />
    </div>
  );
};

export default CustomerOrderDetail;
