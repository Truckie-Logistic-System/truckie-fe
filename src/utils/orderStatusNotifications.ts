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
  refetchWithReturn?: () => Promise<any>; // Enhanced refetch that returns data for verification
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
  const { orderId, refetch, refetchWithReturn, messageApi, onStatusChange, customNotifications, onTabSwitch } = options;

  // Enhanced refetch with retry mechanism to handle race conditions
  const refetchWithRetry = useCallback(async (expectedStatus?: string, statusChange?: OrderStatusChangeMessage) => {
    const MAX_RETRIES = 3;
    const BASE_DELAY = 500; // Start with 500ms
    let retryCount = 0;
    
    const attemptRefetch = async (): Promise<boolean> => {
      try {
        console.log(`🔄 Refetch attempt ${retryCount + 1}/${MAX_RETRIES}`);
        
        // Wait before refetching to let database transaction settle
        const delay = BASE_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Perform refetch - use enhanced version if available for status verification
        let orderData = null;
        if (refetchWithReturn) {
          orderData = await refetchWithReturn();
        } else {
          await refetch();
        }
        
        // Verify the expected status is present in the fetched data
        if (expectedStatus && orderData && orderData.status) {
          if (orderData.status === expectedStatus) {
            console.log(`✅ Refetch successful - status verified: ${expectedStatus}`);
          } else {
            console.warn(`⚠️ Status mismatch - expected: ${expectedStatus}, got: ${orderData.status}`);
            // Status doesn't match, this might be stale data - retry
            throw new Error(`Status verification failed: expected ${expectedStatus}, got ${orderData.status}`);
          }
        } else {
          console.log(`✅ Refetch successful on attempt ${retryCount + 1}`);
        }
        
        // Handle tab switching after successful refetch
        if (statusChange && onTabSwitch) {
          handleTabSwitching(statusChange, onTabSwitch);
        }
        
        return true;
        
      } catch (error) {
        console.error(`❌ Refetch attempt ${retryCount + 1} failed:`, error);
        
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          // Exponential backoff: 500ms, 1s, 2s
          const nextDelay = BASE_DELAY * Math.pow(2, retryCount);
          console.log(`⏳ Retrying in ${nextDelay}ms...`);
          setTimeout(() => attemptRefetch(), nextDelay);
        } else {
          console.error('🚨 Max refetch retries reached');
          if (messageApi) {
            messageApi.error({
              content: 'Không thể cập nhật dữ liệu mới nhất. Vui lòng tải lại trang.',
              duration: 5,
            });
          }
        }
        return false;
      }
    };
    
    await attemptRefetch();
  }, [refetch, refetchWithReturn, messageApi, onTabSwitch]);

  return useCallback((statusChange: OrderStatusChangeMessage) => {
    // Check if this status change is for the current order
    if (orderId && statusChange.orderId === orderId) {
      // Enhanced refetch with retry mechanism to handle race conditions
      refetchWithRetry(statusChange.newStatus, statusChange);
      
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
  }, [orderId, refetch, messageApi, onStatusChange, customNotifications, onTabSwitch, refetchWithRetry]);
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
