import { useCallback } from 'react';
import { playNotificationSound, NotificationSoundType } from './notificationSound';
import type { OrderStatusChangeMessage } from '../hooks/useOrderStatusTracking';

/**
 * Standardized order status change handler for real-time updates
 * This utility provides consistent behavior across all order detail components
 */
export interface UseOrderStatusNotificationsOptions {
  orderId: string | undefined;
  refetch: () => void;
  messageApi: any;
  onStatusChange?: (message: OrderStatusChangeMessage) => void;
  customNotifications?: Partial<Record<string, (message: OrderStatusChangeMessage) => void>>;
  onTabSwitch?: (tabKey: string) => void; // Callback to switch tabs based on status
}

/**
 * Creates a standardized order status change handler
 * 
 * @param options - Configuration options
 * @returns Callback function for handling order status changes
 */
export const createOrderStatusChangeHandler = (
  options: UseOrderStatusNotificationsOptions
) => {
  const { orderId, refetch, messageApi, onStatusChange, customNotifications, onTabSwitch } = options;

  return useCallback((statusChange: OrderStatusChangeMessage) => {
    // Check if this status change is for the current order
    if (orderId && statusChange.orderId === orderId) {
      // Debounce refetch to avoid spike load and prevent mobile WebSocket disruption
      // Wait 500ms to let WebSocket broadcasts settle
      setTimeout(() => {
        refetch();
        
        // Handle tab switching after data is refetched
        if (onTabSwitch) {
          handleTabSwitching(statusChange, onTabSwitch);
        }
      }, 500);
      
      // Call custom handler if provided
      if (onStatusChange) {
        onStatusChange(statusChange);
      }
      
      // Handle standard notifications
      const customHandler = customNotifications?.[statusChange.newStatus];
      if (customHandler) {
        customHandler(statusChange);
      } else {
        // Default notification behavior
        handleDefaultNotification(statusChange, messageApi);
      }
    } else {
    }
  }, [orderId, refetch, messageApi, onStatusChange, customNotifications, onTabSwitch]);
};

/**
 * Handle tab switching based on order status changes
 */
const handleTabSwitching = (statusChange: OrderStatusChangeMessage, onTabSwitch: (tabKey: string) => void) => {
  // Define tab switching rules based on status changes
  const tabSwitchingRules: Record<string, string> = {
    'CONTRACT_DRAFT': 'contract',      // Switch to contract tab when contract is drafted
    'CONTRACT_SIGNED': 'contract',     // Stay on contract tab after signing
    'FULLY_PAID': 'contract',          // Show payment completion on contract tab
    'ASSIGNED_TO_DRIVER': 'detail',    // Switch to detail tab when driver assigned
    'PICKING_UP': 'details',           // Switch to details tab when pickup starts
    'IN_TRANSIT': 'details',           // Stay on details tab during transit
    'DELIVERED': 'details',            // Stay on details tab when delivered
    'IN_TROUBLES': 'details',          // Switch to details tab for issues
  };

  const targetTab = tabSwitchingRules[statusChange.newStatus];
  if (targetTab) {
    setTimeout(() => {
      onTabSwitch(targetTab);
    }, 600); // Small delay after refetch completes
  }
};

/**
 * Default notification handler for common status changes
 */
const handleDefaultNotification = (statusChange: OrderStatusChangeMessage, messageApi: any) => {
  if (!messageApi) return;
  
  switch (statusChange.newStatus) {
    case 'PICKING_UP':
      if (statusChange.previousStatus === 'FULLY_PAID') {
        messageApi.success({
          content: `🚛 ${statusChange.message || 'Tài xế đã bắt đầu lấy hàng!'}`,
          duration: 5,
        });
        playNotificationSound(NotificationSoundType.SUCCESS);
      }
      break;
      
    case 'DELIVERED':
      messageApi.success({
        content: `✅ ${statusChange.message || 'Đơn hàng đã được giao thành công!'}`,
        duration: 5,
      });
      playNotificationSound(NotificationSoundType.SUCCESS);
      break;
      
    case 'IN_TROUBLES':
      messageApi.error({
        content: `⚠️ ${statusChange.message || 'Đơn hàng gặp sự cố!'}`,
        duration: 8,
      });
      playNotificationSound(NotificationSoundType.ERROR);
      break;
      
    case 'ASSIGNED_TO_DRIVER':
      messageApi.info({
        content: `🚗 ${statusChange.message || 'Đơn hàng đã được phân công cho tài xế!'}`,
        duration: 5,
      });
      playNotificationSound(NotificationSoundType.INFO);
      break;
      
    case 'FULLY_PAID':
      messageApi.success({
        content: `💰 ${statusChange.message || 'Đơn hàng đã được thanh toán đầy đủ!'}`,
        duration: 5,
      });
      playNotificationSound(NotificationSoundType.PAYMENT_SUCCESS);
      break;
      
    case 'CANCELLED':
      messageApi.warning({
        content: `❌ ${statusChange.message || 'Đơn hàng đã bị hủy!'}`,
        duration: 5,
      });
      playNotificationSound(NotificationSoundType.WARNING);
      break;
      
    default:
      // Generic notification for other status changes
      if (messageApi) {
        messageApi.info({
          content: `📦 ${statusChange.message || 'Trạng thái đơn hàng đã thay đổi'}`,
          duration: 4,
        });
      }
  }
};

/**
 * Pre-configured notification handlers for different user roles
 */
export const notificationHandlers = {
  /**
   * Customer-specific notifications with auto-tab switching
   */
  customer: (statusChange: OrderStatusChangeMessage, messageApi: any, setActiveMainTab?: (tab: string) => void) => {
    handleDefaultNotification(statusChange, messageApi);
    
    // Auto-switch to details tab for important status changes
    if (
      statusChange.newStatus === 'PICKING_UP' &&
      statusChange.previousStatus === 'FULLY_PAID' &&
      setActiveMainTab
    ) {
      setTimeout(() => {
        setActiveMainTab('details');
      }, 1000);
    }
  },
  
  /**
   * Staff-specific notifications
   */
  staff: (statusChange: OrderStatusChangeMessage, messageApi: any) => {
    handleDefaultNotification(statusChange, messageApi);
  },
  
  /**
   * Admin-specific notifications with additional details
   */
  admin: (statusChange: OrderStatusChangeMessage, messageApi: any) => {
    handleDefaultNotification(statusChange, messageApi);
    
    // Additional admin-specific notifications can be added here
    if (statusChange.newStatus === 'CONTRACT_DRAFT') {
      messageApi.info({
        content: `📄 ${statusChange.message || 'Hợp đồng nháp đã được tạo!'}`,
        duration: 4,
      });
    }
  },
};

export default createOrderStatusChangeHandler;
