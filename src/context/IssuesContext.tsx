import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { Issue } from '@/models/Issue';
import issueService from '@/services/issue/issueService';
import { message as antdMessage } from 'antd';

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

  const clientRef = useRef<Client | null>(null);
  const subscriptionNewRef = useRef<any>(null);
  const subscriptionStatusRef = useRef<any>(null);

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
      // Check if issue already exists
      const exists = prev.some((issue) => issue.id === msg.id);
      if (exists) {
        console.warn('Issue already exists, skipping:', msg.id);
        return prev;
      }
      
      // Add new issue to top of list
      return [msg, ...prev];
    });
    
    // Show modal for urgent notification
    showNewIssueModal(msg);
    
    // Play notification sound (optional)
    // You can add audio notification here
    
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

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (clientRef.current?.connected) {
      console.log('✅ WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to Issues WebSocket...');
    setIsConnected(false);

    const host = window.location.hostname;
    const sockJsUrl = `http://${host}:8080/vehicle-tracking-browser`;

    const client = new Client({
      webSocketFactory: () => {
        return new SockJS(sockJsUrl);
      },
      reconnectDelay: 5000,
      debug: (str) => console.log('STOMP Debug:', str),
    });

    client.onConnect = () => {
      console.log('✅ Issues WebSocket connected');
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

      console.log('✅ Subscribed to issues topics');
    };

    client.onWebSocketError = (event) => {
      console.error('❌ WebSocket error:', event);
      setIsConnected(false);
      setError('Lỗi kết nối WebSocket');
    };

    client.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame.headers['message']);
      console.error('Details:', frame.body);
      setIsConnected(false);
      setError('Lỗi kết nối STOMP');
    };

    client.activate();
    clientRef.current = client;
  }, [handleNewIssue, handleIssueStatusChange]);

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

  // Auto-connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

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

  return <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>;
};

export default IssuesContext;
