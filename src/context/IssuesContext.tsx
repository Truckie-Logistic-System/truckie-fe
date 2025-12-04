import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { App } from 'antd';
import { API_BASE_URL } from '@/config/env';
import type { Issue } from '@/models/Issue';
import issueService from '@/services/issue/issueService';
import { useAuth } from '@/context';
import { playNotificationSound, NotificationSoundType } from '@/utils/notificationSound';
import SealConfirmationModal from '@/components/modals/SealConfirmationModal';
import CombinedIssueModal from '@/components/issues/CombinedIssueModal';

interface QueuedIssue {
  id: string;
  issue: Issue;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  receivedAt: Date;
  showModal: boolean; // Whether to show modal immediately (high priority)
}

interface IssuesContextType {
  issues: Issue[];
  isOpen: boolean;
  isConnected: boolean;
  isLoading: boolean;
  statusFilter: 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  error: string | null;
  toggleIssues: () => void;
  setStatusFilter: (filter: 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => void;
  fetchIssues: () => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  showNewIssueModal: (issue: Issue) => void;
  hideNewIssueModal: () => void;
  newIssueForModal: Issue | null;
  groupedIssuesForModal: Issue[] | null;
  
  // Queue functionality
  queuedIssues: QueuedIssue[];
  isQueueOpen: boolean;
  toggleQueue: () => void;
  addToQueue: (issue: Issue, priority: 'HIGH' | 'MEDIUM' | 'LOW', showModal?: boolean) => void;
  removeFromQueue: (issueId: string) => void;
  markAsProcessed: (issueId: string) => void;
  getQueueCount: () => number;
  getHighPriorityCount: () => number;
}

const IssuesContext = createContext<IssuesContextType | undefined>(undefined);

export const useIssuesContext = () => {
  const context = useContext(IssuesContext);
  if (!context) {
    throw new Error('useIssuesContext must be used within an IssuesProvider');
  }
  return context;
};

interface IssuesProviderProps {
  children: ReactNode;
}

export const IssuesProvider: React.FC<IssuesProviderProps> = ({ children }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [newIssueForModal, setNewIssueForModal] = useState<Issue | null>(null);
  const [groupedIssuesForModal, setGroupedIssuesForModal] = useState<Issue[] | null>(null);
  
  // Queue state
  const [queuedIssues, setQueuedIssues] = useState<QueuedIssue[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [sealConfirmationData, setSealConfirmationData] = useState<any>(null);

  const { user, isAuthenticated } = useAuth();
  
  // Get App instance for modal/message/notification
  const { modal, message, notification } = App.useApp();
  
  const clientRef = useRef<Client | null>(null);
  const pendingIssuesRef = useRef<Map<string, Issue[]>>(new Map()); // orderId -> issues
  const groupingTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map()); // orderId -> timer
  const subscriptionNewRef = useRef<any>(null);
  const subscriptionStatusRef = useRef<any>(null);
  const subscriptionUserMessagesRef = useRef<any>(null);
  const subscriptionReturnPaymentRef = useRef<any>(null);
  const subscriptionReturnPaymentTimeoutRef = useRef<any>(null);
  const shownPaymentNotificationsRef = useRef<Set<string>>(new Set());

  // Fetch issues from API
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await issueService.getAllIssues();
      
      // Sort by reportedAt (newest first) - assuming we add reportedAt to Issue model
      const sorted = data.sort((a, b) => {
        // For now, sort by status priority: OPEN > IN_PROGRESS > RESOLVED
        const statusPriority: Record<string, number> = {
          OPEN: 3,
          IN_PROGRESS: 2,
          RESOLVED: 1,
          PAYMENT_OVERDUE: 4, // Highest priority
        };
        const priorityA = statusPriority[a.status] ?? 0;
        const priorityB = statusPriority[b.status] ?? 0;
        return priorityB - priorityA;
      });
      
      setIssues(sorted);
    } catch (err: any) {
      console.error('Error fetching issues:', err);
      setError(err.message || 'Không thể tải danh sách sự cố');
      message.error('Không thể tải danh sách sự cố');
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  // ============= Queue Management Functions =============

  // Determine issue priority based on issueCategory
  const getIssuePriority = useCallback((issue: Issue): 'HIGH' | 'MEDIUM' | 'LOW' => {
    switch (issue.issueCategory) {
      case 'ORDER_REJECTION':
      case 'SEAL_REPLACEMENT':
      case 'OFF_ROUTE_RUNAWAY':
        return 'HIGH';
      case 'DAMAGE':
      case 'REROUTE':
        return 'MEDIUM';
      case 'PENALTY':
        return 'LOW';
      default:
        return 'MEDIUM';
    }
  }, []);

  // Add issue to queue with priority and sorting
  const addToQueue = useCallback((issue: Issue, priority: 'HIGH' | 'MEDIUM' | 'LOW', showModal: boolean = false) => {
    const queuedIssue: QueuedIssue = {
      id: `${issue.id}-${Date.now()}`,
      issue,
      priority,
      receivedAt: new Date(),
      showModal
    };

    setQueuedIssues(prev => {
      const updated = [...prev, queuedIssue];
      // Sort by priority first, then by received time (newest first within same priority)
      return updated.sort((a, b) => {
        const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.receivedAt.getTime() - a.receivedAt.getTime();
      });
    });

    // Show modal immediately for high priority issues
    if (showModal && priority === 'HIGH') {
      setNewIssueForModal(issue);
    }

    // Play appropriate notification sound
    if (priority === 'HIGH') {
      playNotificationSound(NotificationSoundType.URGENT);
    } else {
      playNotificationSound(NotificationSoundType.NEW_ISSUE);
    }

    console.log(`📋 Issue added to queue: ${issue.issueCategory} (${priority})`);
  }, []); // Remove showNewIssueModal dependency to fix declaration order

  // Remove issue from queue
  const removeFromQueue = useCallback((issueId: string) => {
    setQueuedIssues(prev => prev.filter(qi => qi.id !== issueId));
  }, []);

  // Mark issue as processed (remove from queue and refresh list)
  const markAsProcessed = useCallback((issueId: string) => {
    removeFromQueue(issueId);
    fetchIssues();
  }, [removeFromQueue, fetchIssues]);

  // Get queue count
  const getQueueCount = useCallback(() => {
    return queuedIssues.length;
  }, [queuedIssues]);

  // Get high priority count
  const getHighPriorityCount = useCallback(() => {
    return queuedIssues.filter(qi => qi.priority === 'HIGH').length;
  }, [queuedIssues]);

  // Toggle queue visibility
  const toggleQueue = useCallback(() => {
    setIsQueueOpen(prev => !prev);
  }, []);

  // Handle new issue from WebSocket with queue integration
  const handleNewIssue = useCallback((msg: Issue) => {
    // Debug orderDetail specifically for package info
    if (msg.orderDetail) {
    } else {
    }
    
    setIssues((prev) => {
      // Check if issue already exists to avoid duplicates
      const exists = prev.some(issue => issue.id === msg.id);
      if (exists) {
        return prev;
      }
      
      // Add new issue to top of list
      return [msg, ...prev];
    });
    
    // Determine issue priority
    const priority = getIssuePriority(msg);
    
    // Add to queue with priority
    const shouldShowModal = priority === 'HIGH'; // Only show modal immediately for high priority
    addToQueue(msg, priority, shouldShowModal);
    
    // Smart Grouping Logic: Group issues by orderId within 5 second window
    // Get orderId from orderDetailEntity (for DAMAGE/ORDER_REJECTION issues)
    const orderId = msg.orderDetailEntity?.orderId || msg.orderDetail?.orderId;
    
    if (orderId) {
      // Get or initialize pending issues for this order
      const pendingIssues = pendingIssuesRef.current.get(orderId) || [];
      pendingIssues.push(msg);
      pendingIssuesRef.current.set(orderId, pendingIssues);
      // Clear existing timer if any
      const existingTimer = groupingTimerRef.current.get(orderId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      // Set new timer - 7 seconds window to catch both damage and rejection issues
      // Timer resets on each new issue, so actual wait is 7s after LAST issue
      const timer = setTimeout(() => {
        const issues = pendingIssuesRef.current.get(orderId);
        if (issues && issues.length > 0) {
          
          // Only show combined modal if all issues are high priority
          const allHighPriority = issues.every(issue => getIssuePriority(issue) === 'HIGH');
          
          if (issues.length > 1 && allHighPriority) {
            // Multiple high-priority issues - show combined modal
            setGroupedIssuesForModal(issues);
            setNewIssueForModal(null); // Clear single issue modal
          } else if (issues.length === 1 && allHighPriority) {
            // Single high-priority issue - modal already shown by queue
            // No additional action needed
          } else {
            // Mixed priorities or medium/low only - no modal, rely on queue
            console.log(`📋 Issues for order ${orderId} added to queue: ${issues.map(i => i.issueCategory).join(', ')}`);
          }
          
          // Cleanup
          pendingIssuesRef.current.delete(orderId);
          groupingTimerRef.current.delete(orderId);
        }
      }, 7000); // 7 second window - timer resets on each new issue for same orderId
      
      groupingTimerRef.current.set(orderId, timer);
    } else {
      // No orderId - handle based on priority
      if (priority === 'HIGH') {
        setNewIssueForModal(msg);
        setGroupedIssuesForModal(null);
      }
    }
  }, [getIssuePriority, addToQueue]);

  // Handle issue status change from WebSocket
  const handleIssueStatusChange = useCallback((msg: Issue) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === msg.id ? msg : issue
      )
    );
    
    message.info({
      content: `Sự cố ${msg.description.substring(0, 20)}... đã cập nhật`,
      duration: 3,
    });
  }, [message]);

  // Handle return payment timeout notification
  const handleReturnPaymentTimeout = useCallback((messageData: any) => {
    // Check if we already shown modal for this issue to prevent duplicate notifications
    const notificationKey = `${messageData.issueId}_timeout`;
    if (shownPaymentNotificationsRef.current.has(notificationKey)) {
      return;
    }
    
    // Mark this notification as shown
    shownPaymentNotificationsRef.current.add(notificationKey);
    
    // Play notification sound for payment timeout
    try {
      playNotificationSound(NotificationSoundType.WARNING);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
    
    // Show antd notification (persistent)
    // Convert HTML message to React element with proper line breaks
    const messageLines = messageData.message.split('\n').map((line: string, index: number) => (
      <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
    ));
    
    notification.warning({
      message: '⏰ Khách hàng không thanh toán',
      description: <div>{messageLines}</div>,
      duration: 10,
      placement: 'topRight',
    });
    
    // Refresh issues list to get updated status
    fetchIssues();
    
    // Emit event for issue detail page to refetch
    window.dispatchEvent(new CustomEvent('refetch-issue-detail', {
      detail: { issueId: messageData.issueId }
    }));
    
    // Emit event for customer order detail page to refetch order (cancelled packages)
    if (messageData.orderId) {
      window.dispatchEvent(new CustomEvent('refetch-order-detail', {
        detail: { orderId: messageData.orderId }
      }));
    }
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Khách hàng không thanh toán', {
        body: messageData.message,
        icon: '/favicon.ico'
      });
    }
  }, [fetchIssues, notification]);

  // Handle return payment success notification
  const handleReturnPaymentSuccess = useCallback((messageData: any) => {
    // Check if we already shown modal for this issue to prevent duplicate notifications
    const notificationKey = `${messageData.issueId}_${messageData.transactionId || 'payment'}`;
    if (shownPaymentNotificationsRef.current.has(notificationKey)) {
      return;
    }
    
    // Mark this notification as shown
    shownPaymentNotificationsRef.current.add(notificationKey);
    
    // Play notification sound for payment success
    try {
      playNotificationSound(NotificationSoundType.PAYMENT_SUCCESS);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
    
    // Show notification modal - only once
    // modal.success({
    //   title: '✅ Khách hàng đã thanh toán cước trả hàng',
    //   content: messageData.message,
    //   okText: 'Đã hiểu',
    //   width: 500,
    // });
    
    // Show antd notification (persistent)
    // Convert HTML message to React element with proper line breaks
    const messageLines = messageData.message.split('\n').map((line: string, index: number) => (
      <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
    ));
    
    notification.success({
      message: '💰 Thanh toán thành công',
      description: <div>{messageLines}</div>,
      duration: 10,
      placement: 'topRight',
    });
    
    // Refresh issues list to get updated status
    fetchIssues();
    
    // Emit event for issue detail page to refetch
    window.dispatchEvent(new CustomEvent('refetch-issue-detail', {
      detail: { issueId: messageData.issueId }
    }));
    
    // Emit event for customer order detail page to refetch order (to get ACTIVE journey history)
    if (messageData.orderId) {
      window.dispatchEvent(new CustomEvent('refetch-order-detail', {
        detail: { orderId: messageData.orderId }
      }));
    }
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('💰 Thanh toán thành công', {
        body: messageData.message,
        icon: '/favicon.ico'
      });
    }
  }, [fetchIssues, modal, notification]);

  // Handle staff-specific messages from WebSocket
  const handleStaffMessage = useCallback((messageData: any) => {
    switch (messageData.type) {
      case 'SEAL_CONFIRMATION':
        // Play notification sound for seal confirmation
        playNotificationSound(NotificationSoundType.SEAL_CONFIRM);
        
        // Show antd message first
        message.success({
          content: `✅ Driver ${messageData.driverName} đã gắn seal ${messageData.newSealCode} thành công`,
          duration: 8,
        });
        
        // Show browser notification if supported
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('🔐 Xác nhận gắn seal mới', {
              body: `Driver ${messageData.driverName} đã gắn seal ${messageData.newSealCode}`,
              icon: '/favicon.ico'
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification('🔐 Xác nhận gắn seal mới', {
                  body: `Driver ${messageData.driverName} đã gắn seal ${messageData.newSealCode}`,
                  icon: '/favicon.ico'
                });
              }
            });
          }
        }
        
        // Set data for custom modal component
        setSealConfirmationData({
          driverName: messageData.driverName,
          newSealCode: messageData.newSealCode,
          oldSealCode: messageData.oldSealCode,
          timestamp: messageData.timestamp,
          sealImageUrl: messageData.sealImageUrl,
          oldSealImage: messageData.oldSealImage,
          message: messageData.message,
          journeyCode: messageData.journeyCode,
          trackingCode: messageData.trackingCode,
          vehicleAssignmentId: messageData.vehicleAssignmentId,
          tripInfo: messageData.tripInfo
        });
        break;
        
      default:
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    // Only allow STAFF role to connect to issue WebSocket
    if (!isAuthenticated || !user || user.role !== 'staff') {
      setError('Chỉ nhân viên mới có thể kết nối đến Issue WebSocket');
      return;
    }

    if (clientRef.current?.connected) {
      return;
    }
    setIsConnected(false);

    const sockJsUrl = `${API_BASE_URL}/vehicle-tracking-browser`;

    const client = new Client({
      webSocketFactory: () => {
        return new SockJS(sockJsUrl);
      },
      reconnectDelay: 5000, // Auto-reconnect every 5 seconds - unlimited retries
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // debug: (str) => ,
    });

    client.onConnect = () => {
      setIsConnected(true);
      setError(null);

      // Subscribe to new issues topic
      subscriptionNewRef.current = client.subscribe(
        '/topic/issues/new',
        (message: IMessage) => {
          try {
            const issue: Issue = JSON.parse(message.body);
            handleNewIssue(issue);
          } catch (error) {
            console.error('Error parsing new issue message:', error);
          }
        }
      );

      // Subscribe to issue status changes topic
      subscriptionStatusRef.current = client.subscribe(
        '/topic/issues/status-change',
        (message: IMessage) => {
          try {
            const issue: Issue = JSON.parse(message.body);
            handleIssueStatusChange(issue);
          } catch (error) {
            console.error('Error parsing status change message:', error);
          }
        }
      );

      // Subscribe to user-specific messages (SEAL_CONFIRMATION, etc.)
      subscriptionUserMessagesRef.current = client.subscribe(
        `/topic/staff/${user.id}/messages`,
        (message: IMessage) => {
          try {
            const messageData = JSON.parse(message.body);
            handleStaffMessage(messageData);
          } catch (error) {
            console.error('Error parsing staff message:', error);
          }
        }
      );

      // Subscribe to return payment success notifications (broadcast to all staff)
      subscriptionReturnPaymentRef.current = client.subscribe(
        '/topic/issues/return-payment-success',
        (message: IMessage) => {
          try {
            const messageData = JSON.parse(message.body);
            handleReturnPaymentSuccess(messageData);
          } catch (error) {
            console.error('Error parsing return payment message:', error);
          }
        }
      );

      // Subscribe to return payment timeout notifications (broadcast to all staff)
      subscriptionReturnPaymentTimeoutRef.current = client.subscribe(
        '/topic/issues/return-payment-timeout',
        (message: IMessage) => {
          try {
            const messageData = JSON.parse(message.body);
            handleReturnPaymentTimeout(messageData);
          } catch (error) {
            console.error('Error parsing return payment timeout message:', error);
          }
        }
      );

    };

    client.onWebSocketError = (event) => {
      console.error('❌ Issue WebSocket error:', event);
      setIsConnected(false);
      setError('Lỗi kết nối Issue WebSocket');
    };

    client.onStompError = (frame) => {
      console.error('❌ Issue STOMP error:', frame.headers['message']);
      console.error('Details:', frame.body);
      setIsConnected(false);
      setError('Lỗi kết nối Issue STOMP');
      
      // Check if error is related to authorization
      if (frame.body?.includes('Only STAFF role')) {
        console.warn('❌ Authorization failed - User is not staff');
        setError('Chỉ nhân viên mới có thể truy cập Issue WebSocket');
      }
    };

    client.activate();
    clientRef.current = client;
  }, [isAuthenticated, user, handleNewIssue, handleIssueStatusChange, handleStaffMessage, handleReturnPaymentSuccess, handleReturnPaymentTimeout]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (subscriptionNewRef.current) {
      subscriptionNewRef.current.unsubscribe();
      subscriptionNewRef.current = null;
    }

    if (subscriptionStatusRef.current) {
      subscriptionStatusRef.current.unsubscribe();
      subscriptionStatusRef.current = null;
    }

    if (subscriptionUserMessagesRef.current) {
      subscriptionUserMessagesRef.current.unsubscribe();
      subscriptionUserMessagesRef.current = null;
    }

    if (subscriptionReturnPaymentRef.current) {
      subscriptionReturnPaymentRef.current.unsubscribe();
      subscriptionReturnPaymentRef.current = null;
    }

    if (subscriptionReturnPaymentTimeoutRef.current) {
      subscriptionReturnPaymentTimeoutRef.current.unsubscribe();
      subscriptionReturnPaymentTimeoutRef.current = null;
    }

    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error);
      } finally {
        clientRef.current = null;
        setIsConnected(false);
      }
    }
  }, []);

  // Toggle issues sidebar
  const toggleIssues = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Show new issue modal
  const showNewIssueModal = useCallback((issue: Issue) => {
    setNewIssueForModal(issue);
  }, []);

  // Hide new issue modal (both single and grouped)
  const hideNewIssueModal = useCallback(() => {
    setNewIssueForModal(null);
    setGroupedIssuesForModal(null);
  }, []);

  // Hide seal confirmation modal
  const hideSealConfirmationModal = useCallback(() => {
    setSealConfirmationData(null);
  }, []);

  // Auto-connect WebSocket on mount for staff users only
  useEffect(() => {
    // Only connect if user is authenticated and has staff role
    if (isAuthenticated && user && user.role === 'staff') {
      connectWebSocket();
    } else {
    }
    
    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated, user, connectWebSocket, disconnectWebSocket]);

  const value: IssuesContextType = {
    issues,
    isOpen,
    isConnected,
    isLoading,
    statusFilter,
    error,
    toggleIssues,
    setStatusFilter,
    fetchIssues,
    connectWebSocket,
    disconnectWebSocket,
    showNewIssueModal,
    hideNewIssueModal,
    newIssueForModal,
    groupedIssuesForModal,
    
    // Queue functionality
    queuedIssues,
    isQueueOpen,
    toggleQueue,
    addToQueue,
    removeFromQueue,
    markAsProcessed,
    getQueueCount,
    getHighPriorityCount,
  };

  return (
    <IssuesContext.Provider value={value}>
      {children}
      {/* Seal Confirmation Modal */}
      {sealConfirmationData && (
        <SealConfirmationModal
          data={sealConfirmationData}
          onClose={hideSealConfirmationModal}
        />
      )}
      {/* Combined Issue Modal for multiple issues */}
      {groupedIssuesForModal && groupedIssuesForModal.length > 0 && (
        <CombinedIssueModal issues={groupedIssuesForModal} />
      )}
    </IssuesContext.Provider>
  );
};

export default IssuesContext;
