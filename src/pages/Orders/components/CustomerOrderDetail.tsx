import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  App,
  Button,
  Typography,
  Skeleton,
  Empty,
  Tabs,
  Card,
  message,
  Modal,
} from "antd";
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  CarOutlined,
  ProfileOutlined,
  EnvironmentOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import orderService from "../../../services/order/orderService";
import { contractService } from "../../../services/contract";
import { useOrderStatusTracking } from "../../../hooks/useOrderStatusTracking";
import { useOrderDetailStatusTracking } from "../../../hooks/useOrderDetailStatusTracking";
import { playNotificationSound, NotificationSoundType } from "../../../utils/notificationSound";
import { areAllOrderDetailsInFinalStatus } from "../../../utils/statusHelpers";
import { OrderStatusEnum, OrderStatusLabels } from "../../../constants/enums";
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
import OrderLiveTrackingOnly from "./CustomerOrderDetail/OrderLiveTrackingOnly";
import ContractSection from "./CustomerOrderDetail/ContractSection";
import TransactionSection from "./CustomerOrderDetail/TransactionSection";
import VehicleSuggestionsModal from "./CustomerOrderDetail/VehicleSuggestionsModal";
import ReturnShippingIssuesSection from "./CustomerOrderDetail/ReturnShippingIssuesSection";
import { issueWebSocket } from "../../../services/websocket/issueWebSocket";

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
  // Tab persistence with validation based on order status
  const getInitialTab = () => {
    if (!id) return "basic";
    const savedTab = localStorage.getItem(
      `customerOrderDetail_${id}_activeTab`
    );
    return savedTab || "basic";
  };

  const [activeMainTab, setActiveMainTab] = useState<string>(getInitialTab());
  const [activeDetailTab, setActiveDetailTab] = useState<string>("0");
  const [liveTrackingRemountKey, setLiveTrackingRemountKey] = useState<number>(0);
  const [vehicleSuggestions, setVehicleSuggestions] = useState<{
    optimal: VehicleSuggestion[];
    realistic: VehicleSuggestion[];
  }>({
    optimal: [],
    realistic: [],
  });
  const [vehicleSuggestionsModalVisible, setVehicleSuggestionsModalVisible] =
    useState<boolean>(false);
  const [loadingVehicleSuggestions, setLoadingVehicleSuggestions] =
    useState<boolean>(false);
  const [hasContract, setHasContract] = useState<boolean>(false);
  const [checkingContract, setCheckingContract] = useState<boolean>(false);
  const [creatingContract, setCreatingContract] = useState<boolean>(false);
  const [previousOrderStatus, setPreviousOrderStatus] = useState<string | null>(
    null
  );
  const [cancellingOrder, setCancellingOrder] = useState<boolean>(false);

  // NOTE: Real-time tracking logic is now handled inside RouteMapWithRealTimeTracking
  // to prevent unnecessary re-renders of CustomerOrderDetail parent component

  // Map status to notification icon and type
  const getStatusNotification = (status: string) => {
    const statusNotificationMap: Record<
      string,
      {
        icon: string;
        type: "success" | "error" | "warning" | "info";
        duration: number;
      }
    > = {
      [OrderStatusEnum.PENDING]: { icon: "⏳", type: "info", duration: 3 },
      [OrderStatusEnum.PROCESSING]: { icon: "⚙️", type: "info", duration: 3 },
      [OrderStatusEnum.CONTRACT_DRAFT]: {
        icon: "📝",
        type: "info",
        duration: 3,
      },
      [OrderStatusEnum.CONTRACT_SIGNED]: {
        icon: "✍️",
        type: "success",
        duration: 4,
      },
      [OrderStatusEnum.ON_PLANNING]: { icon: "📋", type: "info", duration: 3 },
      [OrderStatusEnum.ASSIGNED_TO_DRIVER]: {
        icon: "👤",
        type: "success",
        duration: 4,
      },
      [OrderStatusEnum.FULLY_PAID]: {
        icon: "💳",
        type: "success",
        duration: 4,
      },
      [OrderStatusEnum.PICKING_UP]: {
        icon: "🚛",
        type: "success",
        duration: 5,
      },
      [OrderStatusEnum.ON_DELIVERED]: {
        icon: "🚚",
        type: "success",
        duration: 5,
      },
      [OrderStatusEnum.ONGOING_DELIVERED]: {
        icon: "📍",
        type: "success",
        duration: 5,
      },
      [OrderStatusEnum.DELIVERED]: { icon: "✅", type: "success", duration: 5 },
      [OrderStatusEnum.IN_TROUBLES]: { icon: "⚠️", type: "error", duration: 8 },
      [OrderStatusEnum.RESOLVED]: { icon: "🔧", type: "success", duration: 5 },
      [OrderStatusEnum.COMPENSATION]: {
        icon: "💰",
        type: "warning",
        duration: 6,
      },
      [OrderStatusEnum.SUCCESSFUL]: {
        icon: "🎉",
        type: "success",
        duration: 5,
      },
      [OrderStatusEnum.REJECT_ORDER]: {
        icon: "❌",
        type: "error",
        duration: 6,
      },
      [OrderStatusEnum.RETURNING]: { icon: "↩️", type: "warning", duration: 5 },
      [OrderStatusEnum.RETURNED]: { icon: "📦", type: "info", duration: 4 },
    };
    return (
      statusNotificationMap[status] || { icon: "ℹ️", type: "info", duration: 3 }
    );
  };

  // Fetch order details - must be defined before handleRefreshNeeded
  const fetchOrderDetails = useCallback(async (orderId: string, autoSwitchToReturnIssuesTab: boolean = false) => {
    setLoading(true);
    try {
      const data = await orderService.getOrderForCustomerByOrderId(orderId);
      setOrderData(data);
      checkContractExists(orderId);
      
      // Auto-switch to return issues tab if requested and return issues exist
      if (autoSwitchToReturnIssuesTab) {
        // Check if there are any ORDER_REJECTION issues in IN_PROGRESS status
        const hasReturnIssues = data?.order?.vehicleAssignments?.some((va: any) => 
          va.issues?.some((issue: any) => 
            issue.issueCategory === 'ORDER_REJECTION' && issue.status === 'IN_PROGRESS'
          )
        );
        
        if (hasReturnIssues) {
          setActiveMainTab('returnIssues');
          messageApi.warning('Có kiện hàng bị yêu cầu trả lại. Vui lòng xem chi tiết và thanh toán cước trả hàng.');
        }
      }
    } catch (error) {
      messageApi.error("Không thể tải thông tin đơn hàng");
      console.error("Error fetching order details:", error);
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  // Handle cancel order
  const handleCancelOrder = useCallback(async () => {
    if (!id) return;

    Modal.confirm({
      title: "Xác nhận hủy đơn hàng",
      content:
        "Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.",
      okText: "Xác nhận",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        setCancellingOrder(true);
        try {
          await orderService.cancelOrder(id);
          messageApi.success("Đơn hàng đã được hủy thành công");
          // Refetch order details to update UI
          await fetchOrderDetails(id);
        } catch (error: any) {
          console.error("Error cancelling order:", error);
          messageApi.error(
            error?.response?.data?.message || "Không thể hủy đơn hàng"
          );
        } finally {
          setCancellingOrder(false);
        }
      },
    });
  }, [id, messageApi, fetchOrderDetails]);

  // Handle order status changes via WebSocket
  const handleOrderStatusChange = useCallback((statusChange: any) => {
    console.log(
      "[CustomerOrderDetail] 📢 Order status changed:",
      statusChange
    );

    // Check if this status change is for the current order
    if (id && statusChange.orderId === id) {
      console.log("[CustomerOrderDetail] ✅ Order ID matched!");

      // CRITICAL: Refetch for important status transitions BEFORE and including PICKING_UP
      // Also refetch for RETURNING/RETURNED to get new return journey data
      // For other status changes after PICKING_UP, just update locally to avoid disrupting live tracking
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

      const shouldRefetch = statusesRequiringRefetch.includes(
        statusChange.newStatus
      );

      // Statuses that are AFTER PICKING_UP - don't refetch to preserve live tracking
      const statusesAfterPickup = [
        "ON_DELIVERED",
        "ONGOING_DELIVERED",
        "IN_TROUBLES",
        "RESOLVED",
        "COMPENSATION",
        "DELIVERED",
        "SUCCESSFUL",
      ];

      const isAfterPickupStatus = statusesAfterPickup.includes(
        statusChange.newStatus
      );

      if (shouldRefetch) {
        console.log(
          "[CustomerOrderDetail] 🔄 Important status change - refetching order details..."
        );
        // Debounce refetch to avoid spike load
        setTimeout(() => {
          fetchOrderDetails(id);
        }, 500);
      } else {
        const logMessage = isAfterPickupStatus
          ? "[CustomerOrderDetail] ℹ️ Status after PICKING_UP - updating locally to preserve live tracking"
          : "[CustomerOrderDetail] ℹ️ Minor status change - updating status locally only";
        console.log(logMessage);

        // Just update the status locally without full refetch
        if (orderData) {
          setOrderData({
            ...orderData,
            order: {
              ...orderData.order,
              status: statusChange.newStatus,
            },
          });
        }
      }

      const notification = getStatusNotification(statusChange.newStatus);
      const statusLabel =
        OrderStatusLabels[statusChange.newStatus as OrderStatusEnum] ||
        statusChange.newStatus;
      const notificationContent = `${notification.icon} ${
        statusChange.message || statusLabel
      }`;

      // Show notification based on status type
      if (notification.type === "success") {
        message.success({
          content: notificationContent,
          duration: notification.duration,
        });
      } else if (notification.type === "error") {
        message.error({
          content: notificationContent,
          duration: notification.duration,
        });
      } else if (notification.type === "warning") {
        message.warning({
          content: notificationContent,
          duration: notification.duration,
        });
      } else {
        message.info({
          content: notificationContent,
          duration: notification.duration,
        });
      }

      // Play appropriate sound based on notification type
      if (notification.type === 'success') {
        playNotificationSound(NotificationSoundType.SUCCESS);
      } else if (notification.type === 'error') {
        playNotificationSound(NotificationSoundType.ERROR);
      } else if (notification.type === 'warning') {
        playNotificationSound(NotificationSoundType.WARNING);
      } else {
        playNotificationSound(NotificationSoundType.INFO);
      }

      // Auto-switch to "Live Tracking" tab for delivery-related statuses
      if (
        [
          OrderStatusEnum.PICKING_UP,
          OrderStatusEnum.ON_DELIVERED,
          OrderStatusEnum.ONGOING_DELIVERED,
          OrderStatusEnum.RETURNING,
        ].includes(statusChange.newStatus)
      ) {
        setTimeout(() => {
          setActiveMainTab("liveTracking");
          // Auto scroll will be handled by useEffect watching activeMainTab
        }, 1000);
      }

      // Auto-switch to "Return Issues" tab when RETURNED status
      if (statusChange.newStatus === OrderStatusEnum.RETURNED) {
        setTimeout(() => {
          setActiveMainTab('returnIssues');
        }, 1000);
      }
    } else {
      console.log("[CustomerOrderDetail] ❌ Order ID did not match:", {
        statusChangeOrderId: statusChange.orderId,
        currentOrderId: id,
      });
    }
  }, [id, orderData]);

  // Handle refresh when order status changes (only for critical status changes)
  const handleRefreshNeeded = useCallback(() => {
    // This callback is no longer used since we handle refresh in handleOrderStatusChange
    // Keeping it for backward compatibility with useOrderStatusTracking hook
    console.log("[CustomerOrderDetail] handleRefreshNeeded called (no-op)");
  }, []);

  // Handle order detail (package) status changes via WebSocket
  const handleOrderDetailStatusChange = useCallback((statusChange: any) => {
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
          ),
          // Also update vehicle assignments if needed
          vehicleAssignments: orderData.order.vehicleAssignments?.map((va: any) => ({
            ...va,
            orderDetails: va.orderDetails?.map((detail: any) =>
              detail.id === statusChange.orderDetailId
                ? { ...detail, status: statusChange.newStatus }
                : detail
            )
          }))
        }
      };
      
      setOrderData(updatedOrderData);
      
      // Show toast notification with package-specific message
      message.info({
        content: `📦 ${statusChange.trackingCode}: ${statusChange.message}`,
        duration: 4,
      });
      
      // Play sound for important statuses
      if (['DELIVERED', 'RETURNED', 'SUCCESSFUL', 'COMPENSATION'].includes(statusChange.newStatus)) {
        playNotificationSound(NotificationSoundType.SUCCESS);
      } else if (['IN_TROUBLES', 'CANCELLED'].includes(statusChange.newStatus)) {
        playNotificationSound(NotificationSoundType.WARNING);
      }
    }
  }, [orderData]);

  // Validate and adjust active tab based on order status
  const validateActiveTab = useCallback((
    tabKey: string, 
    orderStatus?: string, 
    orderDetails?: Array<{ status: string }>,
    vehicleAssignments?: any[]
  ) => {
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
    
    // Check if return issues tab should be available
    const returnIssuesCount = 
      !vehicleAssignments || vehicleAssignments.length === 0
        ? 0 
        : vehicleAssignments.reduce((count: number, va: any) => {
        const rejectionIssues = va.issues ? va.issues.filter((issue: any) => 
          issue.issueCategory === 'ORDER_REJECTION' && 
          (issue.status === 'IN_PROGRESS' || issue.status === 'RESOLVED')
        ) : [];
        return count + rejectionIssues.length;
      }, 0);
    const shouldShowReturnIssues = returnIssuesCount > 0;
    
    // Validate tab availability and fallback to 'basic' if not available
    switch (tabKey) {
      case 'liveTracking':
        if (!shouldShowLiveTracking) {
          console.log(
            "[CustomerOrderDetail] 🔄 Tab validation: liveTracking not available, falling back to basic"
          );
          return 'basic';
        }
        break;
      case 'returnIssues':
        if (!shouldShowReturnIssues) {
          return 'basic';
        }
        break;
      // 'basic', 'details', 'contract' tabs are always available
      case 'basic':
      case 'details':
      case 'contract':
        // These tabs are always available
        break;
      default:
        // Unknown tab, fallback to basic
        return 'basic';
    }
    
    return tabKey;
  }, []);

  // Subscribe to order status changes
  useOrderStatusTracking({
    orderId: id,
    autoConnect: true,
    onStatusChange: handleOrderStatusChange,
    onRefreshNeeded: handleRefreshNeeded,
  });

  // Subscribe to order detail status changes (individual packages)
  useOrderDetailStatusTracking({
    orderId: id,
    autoConnect: true,
    onStatusChange: handleOrderDetailStatusChange,
  });

  // Subscribe to ALL issue updates and filter by vehicleAssignmentId
  // This works even when customer opens page BEFORE driver reports issue
  useEffect(() => {
    if (!orderData?.order?.vehicleAssignments || !id) return;

    // Extract all vehicle assignment IDs
    const vehicleAssignmentIds: string[] = orderData.order.vehicleAssignments.map((va: any) => va.id);

    if (vehicleAssignmentIds.length === 0) return;
    // Get current user ID from sessionStorage
    const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
    
    // Connect to issue WebSocket if not connected (with userId for customer notifications)
    if (!issueWebSocket.isConnected()) {
      issueWebSocket.connect(userId || undefined).catch(err => {
        console.error('[CustomerOrderDetail] Failed to connect to issue WebSocket:', err);
      });
    }

    // Subscribe to user-specific notifications (payment timeout, etc.)
    const unsubscribeUserNotifications = userId ? issueWebSocket.subscribeToUserNotifications((notification: any) => {
      // Handle different notification types
      if (notification.type === 'RETURN_PAYMENT_TIMEOUT') {
        // Show warning notification
        message.warning({
          content: notification.message,
          duration: 8,
        });
        playNotificationSound(NotificationSoundType.WARNING);
        
        // Refetch order details to update UI (cancelled packages)
        if (id) {
          setTimeout(() => {
            fetchOrderDetails(id, false);
          }, 500);
        }
      }
    }) : () => {};

    // Subscribe to global issue updates with a unique callback ID based on order
    const callbackId = `order-${id}`;
    const unsubscribe = issueWebSocket.subscribeToIssue(callbackId, (updatedIssue: any) => {
      // Check if this issue belongs to any of our vehicle assignments
      const issueVehicleAssignmentId = updatedIssue.vehicleAssignmentEntity?.id;
      const belongsToThisOrder = issueVehicleAssignmentId && vehicleAssignmentIds.includes(issueVehicleAssignmentId);
      
      if (belongsToThisOrder) {
        // Auto-switch to return-issues tab for ORDER_REJECTION
        const shouldSwitchToReturnIssues = updatedIssue.issueCategory === 'ORDER_REJECTION';
        
        setTimeout(() => {
          fetchOrderDetails(id, shouldSwitchToReturnIssues);
        }, 500);
        
        // Show notification for new issue
        message.info({
          content: `📍 Sự cố mới: ${updatedIssue.issueTypeName || 'Có sự cố xảy ra'}`,
          duration: 5,
        });
        playNotificationSound(NotificationSoundType.INFO);
      } else {
      }
    });
    
    // Listen for fallback event (when no direct subscriber found)
    const handleFallbackEvent = (event: any) => {
      const { issueId, issue } = event.detail || {};
      // Check if this issue belongs to current order
      const issueVehicleAssignmentId = issue?.vehicleAssignmentEntity?.id;
      const belongsToThisOrder = issueVehicleAssignmentId && vehicleAssignmentIds.includes(issueVehicleAssignmentId);
      
      if (belongsToThisOrder && issue?.issueCategory === 'ORDER_REJECTION') {
        setTimeout(() => {
          fetchOrderDetails(id, true); // Auto-switch to return-issues tab
        }, 500);
      }
    };
    
    window.addEventListener('issue-update-no-subscriber', handleFallbackEvent);

    // Cleanup: unsubscribe when component unmounts or order changes
    return () => {
      unsubscribe();
      unsubscribeUserNotifications();
      window.removeEventListener('issue-update-no-subscriber', handleFallbackEvent);
    };
  }, [orderData?.order?.vehicleAssignments, id, fetchOrderDetails]);

  // Validate initial tab when order data is first loaded
  const hasValidatedInitialTab = useRef<boolean>(false);
  useEffect(() => {
    if (orderData?.order?.status && !hasValidatedInitialTab.current) {
      const validatedTab = validateActiveTab(
        activeMainTab, 
        orderData.order.status, 
        orderData.order.orderDetails, 
        orderData.order.vehicleAssignments
      );
      if (validatedTab !== activeMainTab) {
        setActiveMainTab(validatedTab);
      }
      hasValidatedInitialTab.current = true;
    }
  }, [orderData?.order?.status, orderData?.order?.orderDetails, orderData?.order?.vehicleAssignments, activeMainTab, validateActiveTab]);

  // Update active tab when order data changes (for validation)
  useEffect(() => {
    if (orderData?.order?.status && hasValidatedInitialTab.current) {
      const validatedTab = validateActiveTab(
        activeMainTab, 
        orderData.order.status, 
        orderData.order.orderDetails, 
        orderData.order.vehicleAssignments
      );
      if (validatedTab !== activeMainTab) {
        setActiveMainTab(validatedTab);
      }
    }
  }, [orderData?.order?.status, orderData?.order?.orderDetails, orderData?.order?.vehicleAssignments, activeMainTab, validateActiveTab]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    if (id) {
      localStorage.setItem(
        `customerOrderDetail_${id}_activeTab`,
        activeMainTab
      );
    }
  }, [activeMainTab, id]);

  useEffect(() => {
    // Scroll to top when entering order detail page
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (id) {
      fetchOrderDetails(id);
    }
  }, [id, fetchOrderDetails]);

  // Track order status changes for logging
  useEffect(() => {
    if (orderData?.order?.status) {
      if (previousOrderStatus && previousOrderStatus !== orderData.order.status) {
        console.log("[CustomerOrderDetail] Order status changed:", {
          from: previousOrderStatus,
          to: orderData.order.status,
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
      OrderStatusEnum.RETURNING,
    ].includes(currentStatus as OrderStatusEnum);
    
    const allDetailsInFinalStatus = areAllOrderDetailsInFinalStatus(orderData?.order?.orderDetails);
    
    if (isDeliveryStatus && !allDetailsInFinalStatus && !hasAutoSwitchedRef.current) {
      console.log(
        "[CustomerOrderDetail] 🎯 Order status >= PICKING_UP - switching to live tracking tab"
      );
      setActiveMainTab('liveTracking');
      hasAutoSwitchedRef.current = true;
    }
  }, [orderData?.order?.status, orderData?.order?.orderDetails]);

  // Auto scroll to map when activeMainTab changes to liveTracking or when page loads with liveTracking active
  useEffect(() => {
    if (activeMainTab === "liveTracking" && !loading && orderData) {
      setTimeout(() => {
        const mapContainer = document.getElementById(
          "customer-live-tracking-map"
        );
        if (mapContainer) {
          console.log("[CustomerOrderDetail] 📍 Scrolling to map");
          mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [activeMainTab, loading, orderData]);

  // Check if should show Live Tracking tab
  // Only show if: 1) Order status is in delivery range AND 2) NOT all order details are in final status
  // Final statuses: COMPENSATION, SUCCESSFUL, RETURNED
  const shouldShowLiveTracking =
    orderData?.order &&
    [
      OrderStatusEnum.PICKING_UP,
      OrderStatusEnum.ON_DELIVERED,
      OrderStatusEnum.ONGOING_DELIVERED,
      OrderStatusEnum.IN_TROUBLES,
      OrderStatusEnum.RESOLVED,
      OrderStatusEnum.DELIVERED,
      OrderStatusEnum.RETURNING,
    ].includes(orderData.order.status as OrderStatusEnum) &&
    !areAllOrderDetailsInFinalStatus(orderData.order.orderDetails);

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
      setVehicleSuggestions({
        optimal: response.data.optimal || [],
        realistic: response.data.realistic || [],
      });
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
        adjustedValue: 0,
        description: "N/A",
        attachFileUrl: "N/A",
        orderId: id,
      };

      const response = await contractService.createContract(contractData);

      if (response.success) {
        messageApi.success(
          response.message || "Đã đồng ý với đề xuất phân xe thành công!"
        );
        setVehicleSuggestionsModalVisible(false);
        setHasContract(true);
        fetchOrderDetails(id);
      } else {
        throw new Error(response.message || "Failed to create contract");
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

  // Check if there are any ORDER_REJECTION issues with IN_PROGRESS status (regular variable, no hooks)
  const hasOrderRejectionIssues = 
    order.vehicleAssignments && order.vehicleAssignments.length > 0 &&
    order.vehicleAssignments.some((va: any) => 
      va.issues && va.issues.some((issue: any) => issue.issueCategory === 'ORDER_REJECTION' && issue.status === 'IN_PROGRESS')
    );

  // Count ORDER_REJECTION issues with IN_PROGRESS status (regular variable, no hooks)
  const returnIssuesCount = 
    !order.vehicleAssignments || order.vehicleAssignments.length === 0 
      ? 0 
      : order.vehicleAssignments.reduce((count: number, va: any) => {
          const rejectionIssues = va.issues ? va.issues.filter((issue: any) => 
            issue.issueCategory === 'ORDER_REJECTION' && 
            (issue.status === 'IN_PROGRESS' || issue.status === 'RESOLVED')
          ) : [];
          return count + rejectionIssues.length;
        }, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/orders")}
            className="mr-4"
          >
            Quay lại
          </Button>
          <Title level={3}>Chi tiết đơn hàng {order.orderCode}</Title>
        </div>
        {["PENDING", "PROCESSING", "CONTRACT_DRAFT"].includes(order.status) && (
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={handleCancelOrder}
            loading={cancellingOrder}
          >
            Hủy đơn hàng
          </Button>
        )}
      </div>

      <Card className="mb-6 shadow-md rounded-xl">
        <Tabs
          activeKey={activeMainTab}
          onChange={(key) => {
            const wasLiveTracking = activeMainTab === 'liveTracking';
            const isNowLiveTracking = key === 'liveTracking';
            
            setActiveMainTab(key);
            
            // Force complete remount when switching TO liveTracking from another tab
            if (!wasLiveTracking && isNowLiveTracking) {
              setLiveTrackingRemountKey(prev => prev + 1);
            }
            
            // Scroll map to view when live tracking tab is clicked
            if (key === "liveTracking") {
              setTimeout(() => {
                const mapContainer = document.getElementById(
                  "customer-live-tracking-map"
                );
                if (mapContainer) {
                  console.log(
                    "[CustomerOrderDetail] 📍 Scrolling to map on tab click"
                  );
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
            <BasicInfoTab
              order={order}
              hasContract={hasContract}
              checkingContract={checkingContract}
              loadingVehicleSuggestions={loadingVehicleSuggestions}
              onFetchVehicleSuggestions={fetchVehicleSuggestions}
              contract={contract}
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
              {/* Force complete remount with key when tab activates */}
              <OrderLiveTrackingOnly
                key={`live-tracking-${order.id}-${liveTrackingRemountKey}`}
                orderId={order.id}
                shouldShowRealTimeTracking={true}
                vehicleAssignments={order.vehicleAssignments || []}
                isTabActive={activeMainTab === 'liveTracking'}
              />
            </TabPane>
          )}
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
                onContractSigned={() => {
                  setActiveMainTab("contract");
                }}
              />

              {/* Transaction Information */}
              <TransactionSection transactions={transactions} />
            </div>
          </TabPane>
          
          {/* Return Shipping Issues Tab - Show if there are issues */}
          {returnIssuesCount > 0 && (
            <TabPane
              tab={
                <span className="px-2 py-1">
                  <ExclamationCircleOutlined className="mr-2" />
                  Vấn đề trả hàng
                  {returnIssuesCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {returnIssuesCount}
                    </span>
                  )}
                </span>
              }
              key="returnIssues"
            >
              {id && (
                <ReturnShippingIssuesSection 
                  orderId={id}
                  issues={order.vehicleAssignments?.flatMap((va: any) => 
                    va.issues?.filter((issue: any) => 
                      issue.issueCategory === 'ORDER_REJECTION' && 
                      (issue.status === 'IN_PROGRESS' || issue.status === 'RESOLVED')
                    ) || []
                  ) || []}
                  isInTab={true}
                />
              )}
            </TabPane>
          )}
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
