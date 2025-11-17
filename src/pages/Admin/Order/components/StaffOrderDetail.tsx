import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { App, Button, Typography, Skeleton, Empty, Tabs, Space, Card, message } from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CarOutlined,
  CreditCardOutlined,
  PrinterOutlined,
  UserAddOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import orderService from "../../../../services/order/orderService";
import type { StaffOrderDetailResponse } from "../../../../services/order/types";
import VehicleAssignmentModal from "./VehicleAssignmentModalContainer";
import { areAllOrderDetailsInFinalStatus } from "../../../../utils/statusHelpers";
import { OrderStatusEnum } from "../../../../constants/enums";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import {
  BasicInfoTab,
  OrderDetailTabs,
  ContractAndPaymentTab,
} from "./StaffOrderDetail/index";
import BillOfLadingPreviewModal from "./StaffOrderDetail/BillOfLadingPreviewModal";
import OrderLiveTrackingOnly from "./StaffOrderDetail/OrderLiveTrackingOnly";
import { useOrderStatusTracking } from "../../../../hooks/useOrderStatusTracking";
import { useOrderDetailStatusTracking } from "../../../../hooks/useOrderDetailStatusTracking";
import { playNotificationSound, NotificationSoundType } from "../../../../utils/notificationSound";
import { issueWebSocket } from "../../../../services/websocket/issueWebSocket";

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
  // Tab persistence with validation based on order status
  const getInitialTab = () => {
    if (!id) return "basic";
    const savedTab = localStorage.getItem(`staffOrderDetail_${id}_activeTab`);
    return savedTab || "basic";
  };
  
  const [activeMainTab, setActiveMainTab] = useState<string>(getInitialTab());
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
      console.log('[StaffOrderDetail] ✅ Order ID matched!');
      
      // CRITICAL: Refetch for important status transitions BEFORE and including PICKING_UP
      // Also refetch for RETURNING/RETURNED to get new return journey data
      // For other status changes after PICKING_UP, just update locally to avoid disrupting real-time tracking
      const statusesRequiringRefetch = [
        'PROCESSING',
        'CONTRACT_DRAFT',
        'CONTRACT_SIGNED',
        'ON_PLANNING',
        'ASSIGNED_TO_DRIVER',
        'FULLY_PAID',
        'PICKING_UP',
        'REJECT_ORDER',
        'RETURNING',    // Refetch để lấy return journey mới
        'RETURNED'      // Refetch để cập nhật final state
      ];
      
      const shouldRefetch = statusesRequiringRefetch.includes(statusChange.newStatus);
      
      // Statuses that are AFTER PICKING_UP - don't refetch to preserve real-time tracking
      const statusesAfterPickup = [
        'ON_DELIVERED',
        'ONGOING_DELIVERED', 
        'IN_TROUBLES',
        'RESOLVED',
        'COMPENSATION',
        'DELIVERED',
        'SUCCESSFUL'
      ];
      
      const isAfterPickupStatus = statusesAfterPickup.includes(statusChange.newStatus);
      
      if (shouldRefetch) {
        console.log('[StaffOrderDetail] 🔄 Important status change - refetching order details...');
        // Debounce refetch to avoid spike load and prevent mobile WebSocket disruption
        setTimeout(() => {
          fetchOrderDetails(id);
        }, 500);
      } else {
        const logMessage = isAfterPickupStatus 
          ? '[StaffOrderDetail] ℹ️ Status after PICKING_UP - updating locally to preserve real-time tracking'
          : '[StaffOrderDetail] ℹ️ Minor status change - updating status locally only';
        console.log(logMessage);
        
        // Just update the status locally without full refetch
        if (orderData) {
          setOrderData({
            ...orderData,
            order: {
              ...orderData.order,
              status: statusChange.newStatus
            }
          });
        }
      }
      
      // Show notification for important status changes
      if (statusChange.newStatus === 'PICKING_UP' && statusChange.previousStatus === 'FULLY_PAID') {
        messageApi.success({
          content: `🚛 ${statusChange.message || 'Tài xế đã bắt đầu lấy hàng!'}`,
          duration: 5,
        });
        playNotificationSound(NotificationSoundType.SUCCESS);
        // Auto-switch to live tracking tab for delivery-related statuses
        setTimeout(() => {
          setActiveMainTab('liveTracking');
        }, 1000);
      } else if (statusChange.newStatus === 'DELIVERED') {
        messageApi.success({
          content: `✅ ${statusChange.message || 'Đơn hàng đã được giao thành công!'}`,
          duration: 5,
        });
        playNotificationSound(NotificationSoundType.SUCCESS);
        // Auto-switch to live tracking tab
        setTimeout(() => {
          setActiveMainTab('liveTracking');
        }, 1000);
      } else if (statusChange.newStatus === 'IN_TROUBLES') {
        messageApi.error({
          content: `⚠️ ${statusChange.message || 'Đơn hàng gặp sự cố!'}`,
          duration: 8,
        });
        playNotificationSound(NotificationSoundType.ERROR);
        // Auto-switch to live tracking tab for incident visibility
        setTimeout(() => {
          setActiveMainTab('liveTracking');
        }, 1000);
      } else if (statusChange.newStatus === 'RETURNING') {
        messageApi.warning({
          content: `↩️ ${statusChange.message || 'Đơn hàng đang được trả về!'}`,
          duration: 6,
        });
        playNotificationSound(NotificationSoundType.WARNING);
        // Auto-switch to live tracking tab to see return journey
        setTimeout(() => {
          setActiveMainTab('liveTracking');
        }, 1000);
      } else if (statusChange.newStatus === 'RETURNED') {
        messageApi.info({
          content: `📦 ${statusChange.message || 'Đơn hàng đã được trả về thành công!'}`,
          duration: 5,
        });
        playNotificationSound(NotificationSoundType.INFO);
      } else if (statusChange.newStatus === 'ASSIGNED_TO_DRIVER') {
        messageApi.info({
          content: `🚗 ${statusChange.message || 'Đơn hàng đã được phân công cho tài xế!'}`,
          duration: 5,
        });
        playNotificationSound(NotificationSoundType.INFO);
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
  }, [id, messageApi, orderData]);

  // Handle order detail (package) status changes via WebSocket
  const handleOrderDetailStatusChange = useCallback((statusChange: any) => {
    console.log('[StaffOrderDetail] 📦 Order detail status changed:', statusChange);
    
    // Update local state for the specific order detail without full refetch
    if (orderData) {
      const updatedOrderData = {
        ...orderData,
        order: {
          ...orderData.order,
          orderDetails: orderData.order.orderDetails?.map((detail: any) => 
            detail.id === statusChange.orderDetailId
              ? { ...detail, status: statusChange.newStatus }
              : detail
          )
        }
      };
      
      setOrderData(updatedOrderData);
      
      // Show toast notification
      messageApi.info({
        content: `📦 ${statusChange.message} (${statusChange.trackingCode})`,
        duration: 4,
      });
    }
  }, [orderData, messageApi]);

  // Subscribe to order status changes
  useOrderStatusTracking({
    orderId: id,
    autoConnect: true,
    onStatusChange: handleOrderStatusChange,
  });

  // Subscribe to order detail status changes (individual packages)
  useOrderDetailStatusTracking({
    orderId: id,
    autoConnect: true,
    onStatusChange: handleOrderDetailStatusChange,
  });

  // Subscribe to ALL issue updates and filter by vehicleAssignmentId
  // This works even when staff opens page BEFORE driver reports issue
  useEffect(() => {
    if (!orderData?.order?.vehicleAssignments || !id) return;

    // Extract all vehicle assignment IDs
    const vehicleAssignmentIds: string[] = orderData.order.vehicleAssignments.map((va: any) => va.id);

    if (vehicleAssignmentIds.length === 0) return;

    console.log('[StaffOrderDetail] 📡 Monitoring issues for vehicle assignments:', vehicleAssignmentIds);

    // Connect to issue WebSocket if not connected
    if (!issueWebSocket.isConnected()) {
      issueWebSocket.connect().catch(err => {
        console.error('[StaffOrderDetail] Failed to connect to issue WebSocket:', err);
      });
    }

    // Subscribe to global issue updates with a unique callback ID based on order
    const callbackId = `order-${id}`;
    const unsubscribe = issueWebSocket.subscribeToIssue(callbackId, (updatedIssue: any) => {
      console.log('[StaffOrderDetail] 🔔 Received issue update:', updatedIssue);
      
      // Check if this issue belongs to any of our vehicle assignments
      const issueVehicleAssignmentId = updatedIssue.vehicleAssignmentEntity?.id;
      const belongsToThisOrder = issueVehicleAssignmentId && vehicleAssignmentIds.includes(issueVehicleAssignmentId);
      
      if (belongsToThisOrder) {
        console.log('[StaffOrderDetail] ✅ New issue belongs to this order, refetching to update markers...');
        
        setTimeout(() => {
          fetchOrderDetails(id);
        }, 500);
        
        // Show notification for new issue
        message.info({
          content: `📍 Sự cố mới: ${updatedIssue.issueTypeName || 'Có sự cố xảy ra'}`,
          duration: 5,
        });
        playNotificationSound(NotificationSoundType.INFO);
      } else {
        console.log('[StaffOrderDetail] ℹ️ Issue does not belong to this order, ignoring');
      }
    });
    
    // Listen for fallback event (when no direct subscriber found)
    const handleFallbackEvent = (event: any) => {
      const { issueId, issue } = event.detail || {};
      console.log('[StaffOrderDetail] 📢 Fallback issue update received:', issueId);
      
      // Check if this issue belongs to current order
      const issueVehicleAssignmentId = issue?.vehicleAssignmentEntity?.id;
      const belongsToThisOrder = issueVehicleAssignmentId && vehicleAssignmentIds.includes(issueVehicleAssignmentId);
      
      if (belongsToThisOrder) {
        console.log('[StaffOrderDetail] ✅ Fallback - Issue belongs to current order, refetching...');
        setTimeout(() => {
          fetchOrderDetails(id);
        }, 500);
      }
    };
    
    window.addEventListener('issue-update-no-subscriber', handleFallbackEvent);

    // Cleanup: unsubscribe when component unmounts or order changes
    return () => {
      console.log('[StaffOrderDetail] 📡 Unsubscribing from issue updates');
      unsubscribe();
      window.removeEventListener('issue-update-no-subscriber', handleFallbackEvent);
    };
  }, [orderData?.order?.vehicleAssignments, id]);

  // Validate and adjust active tab based on order status
  const validateActiveTab = useCallback((tabKey: string, orderStatus?: string, orderDetails?: Array<{ status: string }>) => {
    // If order is not loaded yet, return the tab as-is
    if (!orderStatus) return tabKey;
    
    // Check if live tracking tab should be available
    // Note: COMPENSATION, SUCCESSFUL, RETURNED are final statuses - no tracking needed
    const isDeliveryStatus = [
      OrderStatusEnum.PICKING_UP,
      OrderStatusEnum.ON_DELIVERED,
      OrderStatusEnum.ONGOING_DELIVERED,
      OrderStatusEnum.IN_TROUBLES,
      OrderStatusEnum.RESOLVED,
      OrderStatusEnum.DELIVERED,
      OrderStatusEnum.RETURNING
    ].includes(orderStatus as OrderStatusEnum);
    
    const allDetailsInFinalStatus = areAllOrderDetailsInFinalStatus(orderDetails);
    const shouldShowLiveTracking = isDeliveryStatus && !allDetailsInFinalStatus;
    
    // If saved tab is liveTracking but it's not available, fallback to basic
    if (tabKey === 'liveTracking' && !shouldShowLiveTracking) {
      console.log('[StaffOrderDetail] 🔄 Tab validation: liveTracking not available, falling back to basic');
      return 'basic';
    }
    
    return tabKey;
  }, []);

  // Update active tab when order data changes (for validation)
  useEffect(() => {
    if (orderData?.order?.status) {
      const validatedTab = validateActiveTab(activeMainTab, orderData.order.status, orderData.order.orderDetails);
      if (validatedTab !== activeMainTab) {
        setActiveMainTab(validatedTab);
      }
    }
  }, [orderData?.order?.status, orderData?.order?.orderDetails, activeMainTab, validateActiveTab]);

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

  // Auto-switch to live tracking tab when order status >= PICKING_UP
  const hasAutoSwitchedRef = useRef<boolean>(false);
  useEffect(() => {
    const currentStatus = orderData?.order?.status;
    // Auto-switch if status >= PICKING_UP and we haven't switched yet
    // Note: COMPENSATION, SUCCESSFUL, RETURNED are final statuses - no tracking needed
    const isDeliveryStatus = [
      OrderStatusEnum.PICKING_UP,
      OrderStatusEnum.ON_DELIVERED,
      OrderStatusEnum.ONGOING_DELIVERED,
      OrderStatusEnum.IN_TROUBLES,
      OrderStatusEnum.RESOLVED,
      OrderStatusEnum.DELIVERED,
      OrderStatusEnum.RETURNING
    ].includes(currentStatus as OrderStatusEnum);
    
    const allDetailsInFinalStatus = areAllOrderDetailsInFinalStatus(orderData?.order?.orderDetails);
    
    if (isDeliveryStatus && !allDetailsInFinalStatus && !hasAutoSwitchedRef.current) {
      console.log('[StaffOrderDetail] 🎯 Order status >= PICKING_UP - switching to live tracking tab');
      setActiveMainTab('liveTracking');
      hasAutoSwitchedRef.current = true;
    }
  }, [orderData?.order?.status, orderData?.order?.orderDetails]);

  // Auto scroll to live tracking tab when it becomes active
  useEffect(() => {
    if (activeMainTab === 'liveTracking') {
      setTimeout(() => {
        const mapContainer = document.getElementById('staff-live-tracking-map');
        if (mapContainer) {
          console.log('[StaffOrderDetail] 📍 Scrolling to map');
          mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [activeMainTab]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (id) {
      localStorage.setItem(`staffOrderDetail_${id}_activeTab`, activeMainTab);
    }
  }, [activeMainTab, id]);

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

  // Check if should show Live Tracking tab
  // Only show if: 1) Order status is in delivery range AND 2) NOT all order details are in final status
  // Final statuses: COMPENSATION, SUCCESSFUL, RETURNED
  const shouldShowLiveTracking = orderData?.order && [
    OrderStatusEnum.PICKING_UP,
    OrderStatusEnum.ON_DELIVERED,
    OrderStatusEnum.ONGOING_DELIVERED,
    OrderStatusEnum.IN_TROUBLES,
    OrderStatusEnum.RESOLVED,
    OrderStatusEnum.DELIVERED,
    OrderStatusEnum.RETURNING
  ].includes(orderData.order.status as OrderStatusEnum) && 
  !areAllOrderDetailsInFinalStatus(orderData.order.orderDetails);

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

      <Card className="mb-6 shadow-md rounded-xl">
        <Tabs
          activeKey={activeMainTab}
          onChange={(key) => {
            setActiveMainTab(key);
            // Scroll map to view when live tracking tab is clicked
            if (key === 'liveTracking') {
              setTimeout(() => {
                const mapContainer = document.getElementById('staff-live-tracking-map');
                if (mapContainer) {
                  console.log('[StaffOrderDetail] 📍 Scrolling to map on tab click');
                  mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 200);
            }
          }}
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
            <BasicInfoTab order={order} contract={contract} />
          </TabPane>
          <TabPane
            tab={
              <span className="px-2 py-1">
                <CarOutlined className="mr-2" /> Chi tiết vận chuyển
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
          {/* Live Tracking Tab - Only show when status >= PICKING_UP */}
          {shouldShowLiveTracking && (
            <TabPane
              tab={
                <span className="px-2 py-1">
                  <EnvironmentOutlined className="mr-2" /> Theo dõi trực tiếp
                </span>
              }
              key="liveTracking"
            >
              <OrderLiveTrackingOnly
                orderId={order.id}
                shouldShowRealTimeTracking={true}
                vehicleAssignments={order.vehicleAssignments || []}
              />
            </TabPane>
          )}
          <TabPane
            tab={
              <span className="px-2 py-1">
                <CreditCardOutlined className="mr-2" /> Hợp đồng & Thanh toán
              </span>
            }
            key="contract"
          >
            <ContractAndPaymentTab
              contract={contract}
              transactions={transactions}
              orderId={id}
              depositAmount={order.depositAmount}
              onRefetch={() => {
                if (id) {
                  fetchOrderDetails(id);
                  // Auto-switch to contract tab after successful export
                  setTimeout(() => {
                    setActiveMainTab('contract');
                  }, 500);
                }
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Vehicle Assignment Modal */}
      {id && (
        <VehicleAssignmentModal
          visible={vehicleAssignmentModalVisible}
          orderId={id}
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