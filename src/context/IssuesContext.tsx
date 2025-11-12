import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Issue } from '@/models/Issue';
import issueService from '@/services/issue/issueService';
import { message as antdMessage, Modal } from 'antd';
import { useAuth } from '@/context';
import { SoundType, playNotificationSound, playMultipleBeeps } from '@/utils/soundUtils';
import SealConfirmationModal from '@/components/modals/SealConfirmationModal';

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
  const [sealConfirmationData, setSealConfirmationData] = useState<any>(null);

  const { user, isAuthenticated } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const subscriptionNewRef = useRef<any>(null);
  const subscriptionStatusRef = useRef<any>(null);
  const subscriptionUserMessagesRef = useRef<any>(null);

  // Fetch issues from API
  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await issueService.getAllIssues();
      
      // Sort by reportedAt (newest first) - assuming we add reportedAt to Issue model
      const sorted = data.sort((a, b) => {
        // For now, sort by status priority: OPEN > IN_PROGRESS > RESOLVED
        const statusPriority = { OPEN: 3, IN_PROGRESS: 2, RESOLVED: 1 };
        return statusPriority[b.status] - statusPriority[a.status];
      });
      
      setIssues(sorted);
    } catch (err: any) {
      console.error('Error fetching issues:', err);
      setError(err.message || 'Không thể tải danh sách sự cố');
      antdMessage.error('Không thể tải danh sách sự cố');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle new issue from WebSocket
  const handleNewIssue = useCallback((msg: Issue) => {
    console.log('🆕 New issue received via WebSocket:', msg);
    
    setIssues((prev) => {
      // Check if issue already exists to avoid duplicates
      const exists = prev.some(issue => issue.id === msg.id);
      if (exists) {
        console.log('Issue already exists, skipping duplicate');
        return prev;
      }
      
      // Add new issue to top of list
      return [msg, ...prev];
    });
    
    // Play notification sound for new issue
    playMultipleBeeps(SoundType.NEW_ISSUE, 2, 300);
    
    // Show modal for urgent notification
    showNewIssueModal(msg);
    
    antdMessage.warning({
      content: `Sự cố mới: ${msg.description}`,
      duration: 5,
    });
  }, []);

  // Handle issue status change from WebSocket
  const handleIssueStatusChange = useCallback((msg: Issue) => {
    console.log('📊 Issue status changed via WebSocket:', msg);
    
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === msg.id ? msg : issue
      )
    );
    
    antdMessage.info({
      content: `Sự cố ${msg.description.substring(0, 20)}... đã cập nhật`,
      duration: 3,
    });
  }, []);

  // Handle staff-specific messages from WebSocket
  const handleStaffMessage = useCallback((messageData: any) => {
    console.log('📬 [IssuesContext] Handle staff message:', messageData);
    
    switch (messageData.type) {
      case 'SEAL_CONFIRMATION':
        console.log('🔔 Showing SEAL_CONFIRMATION modal and notification');
        
        // Play notification sound for seal confirmation
        playNotificationSound(SoundType.SEAL_CONFIRMATION, 0.7);
        
        // Show antd message first
        antdMessage.success({
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
        console.log('❓ Unknown staff message type:', messageData.type);
    }
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    // Only allow STAFF role to connect to issue WebSocket
    if (!isAuthenticated || !user || user.role !== 'staff') {
      console.log('❌ Issue WebSocket connection denied - User is not staff:', user?.role);
      setError('Chỉ nhân viên mới có thể kết nối đến Issue WebSocket');
      return;
    }

    if (clientRef.current?.connected) {
      console.log('✅ Issue WebSocket already connected for staff user');
      return;
    }

    console.log('🔌 Connecting to Issues WebSocket for staff user...');
    setIsConnected(false);

    const host = window.location.hostname;
    const sockJsUrl = `http://${host}:8080/vehicle-tracking-browser`;

    const client = new Client({
      webSocketFactory: () => {
        return new SockJS(sockJsUrl);
      },
      reconnectDelay: 5000,
      // debug: (str) => console.log('STOMP Debug:', str),
    });

    client.onConnect = () => {
      console.log('✅ Issues WebSocket connected for staff user');
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
            console.log('📬 Staff received user-specific message:', messageData);
            handleStaffMessage(messageData);
          } catch (error) {
            console.error('Error parsing staff message:', error);
          }
        }
      );

      console.log('✅ Staff user subscribed to issues topics and user messages');
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
  }, [isAuthenticated, user, handleNewIssue, handleIssueStatusChange, handleStaffMessage]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    console.log('🔌 Disconnecting Issues WebSocket...');

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

    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
        console.log('✅ Issues WebSocket disconnected');
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

  // Hide new issue modal
  const hideNewIssueModal = useCallback(() => {
    setNewIssueForModal(null);
  }, []);

  // Hide seal confirmation modal
  const hideSealConfirmationModal = useCallback(() => {
    setSealConfirmationData(null);
  }, []);

  // Auto-connect WebSocket on mount for staff users only
  useEffect(() => {
    // Only connect if user is authenticated and has staff role
    if (isAuthenticated && user && user.role === 'staff') {
      console.log('🔑 Staff user detected, connecting to Issue WebSocket...');
      connectWebSocket();
    } else {
      console.log('🚫 Non-staff user detected, skipping Issue WebSocket connection:', user?.role);
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
    </IssuesContext.Provider>
  );
};

export default IssuesContext;
