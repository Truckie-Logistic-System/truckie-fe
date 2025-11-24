import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import authService from '../services/auth/authService';
import { API_BASE_URL } from '../config/env';

// Interface cho order detail status change message
export interface OrderDetailStatusChangeMessage {
  orderDetailId: string;
  trackingCode: string;
  orderId: string;
  orderCode: string;
  vehicleAssignmentId: string | null;
  previousStatus: string | null;
  newStatus: string;
  timestamp: string;
  message: string;
}

export interface UseOrderDetailStatusTrackingOptions {
  orderId?: string;
  autoConnect?: boolean;
  onStatusChange?: (message: OrderDetailStatusChangeMessage) => void;
}

export interface UseOrderDetailStatusTrackingReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  latestStatusChange: OrderDetailStatusChangeMessage | null;
  connect: () => void;
  disconnect: () => void;
}

const DEFAULT_OPTIONS: Required<Omit<UseOrderDetailStatusTrackingOptions, 'onStatusChange'>> = {
  orderId: '',
  autoConnect: false,
};

/**
 * Hook để subscribe order detail (package) status changes qua WebSocket
 * Cho phép real-time tracking từng kiện hàng trong order
 */
export const useOrderDetailStatusTracking = (
  options: UseOrderDetailStatusTrackingOptions = {}
): UseOrderDetailStatusTrackingReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestStatusChange, setLatestStatusChange] = useState<OrderDetailStatusChangeMessage | null>(null);
  
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);
  const reconnectAttemptRef = useRef(0);
  const lastMessageRef = useRef<OrderDetailStatusChangeMessage | null>(null);

  // Store callbacks in refs to avoid dependency issues
  const onStatusChangeRef = useRef(options.onStatusChange);

  // Update refs when callbacks change
  useEffect(() => {
    onStatusChangeRef.current = options.onStatusChange;
  }, [options.onStatusChange]);

  // Handle incoming status change messages
  const handleStatusChangeMessage = useCallback((message: IMessage) => {
    try {
      const statusChange: OrderDetailStatusChangeMessage = JSON.parse(message.body);
      // Check for duplicate message
      if (lastMessageRef.current) {
        const isDuplicate = 
          lastMessageRef.current.orderDetailId === statusChange.orderDetailId &&
          lastMessageRef.current.newStatus === statusChange.newStatus &&
          lastMessageRef.current.timestamp === statusChange.timestamp;
        
        if (isDuplicate) {
          return;
        }
      }
      
      lastMessageRef.current = statusChange;
      setLatestStatusChange(statusChange);
      
      // Call onStatusChange callback if provided
      if (onStatusChangeRef.current) {
        onStatusChangeRef.current(statusChange);
      }
      
      setError(null);
    } catch (err) {
      console.error('[OrderDetailStatusTracking] Failed to parse status change message:', err);
      setError('Lỗi khi xử lý thông báo thay đổi trạng thái kiện hàng');
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (clientRef.current?.connected || isConnecting) {
      return;
    }

    // Clean up any existing connection
    if (clientRef.current) {
      try {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
        clientRef.current.deactivate();
        clientRef.current = null;
      } catch (err) {
        console.error('[OrderDetailStatusTracking] Error cleaning up connection:', err);
      }
    }

    const token = authService.getAuthToken();
    if (!token) {
      console.error('[OrderDetailStatusTracking] No auth token available');
      setError('Không có token xác thực');
      return;
    }

    if (!config.orderId) {
      console.error('[OrderDetailStatusTracking] No orderId provided');
      setError('Cần cung cấp orderId');
      return;
    }
    setIsConnecting(true);
    setError(null);

    // Create STOMP client with SockJS transport
    const client = new Client({
      webSocketFactory: () => {
        return new SockJS(`${API_BASE_URL}/vehicle-tracking-browser`);
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (_str) => {
        // Silent in production
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Connection success handler
    client.onConnect = (_frame) => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      try {
        // Subscribe to order detail status changes
        const topicPath = `/topic/orders/${config.orderId}/order-details/status`;
        const subscription = client.subscribe(
          topicPath,
          handleStatusChangeMessage
        );
        subscriptionRef.current = subscription;
      } catch (subscriptionError) {
        console.error('[OrderDetailStatusTracking] Subscription error:', subscriptionError);
        setError('Lỗi khi đăng ký nhận thông báo');
      }
    };

    // Connection error handler
    client.onStompError = (frame) => {
      console.error('[OrderDetailStatusTracking] ❌ STOMP error:', frame);
      setIsConnected(false);
      setIsConnecting(false);
      setError(`Lỗi kết nối: ${frame.headers['message'] || 'Unknown error'}`);
      
      // Auto-reconnect with exponential backoff
      reconnectAttemptRef.current++;
      const delay = Math.min(5000 * Math.pow(2, Math.min(reconnectAttemptRef.current - 1, 3)), 30000);
      
      setTimeout(() => {
        connect();
      }, delay);
    };

    // WebSocket error handler
    client.onWebSocketError = (event) => {
      console.error('[OrderDetailStatusTracking] ❌ WebSocket error:', event);
      setIsConnected(false);
      setIsConnecting(false);
      setError('Lỗi kết nối WebSocket');
      
      // Auto-reconnect with exponential backoff
      reconnectAttemptRef.current++;
      const delay = Math.min(5000 * Math.pow(2, Math.min(reconnectAttemptRef.current - 1, 3)), 30000);
      
      setTimeout(() => {
        connect();
      }, delay);
    };

    // Disconnection handler
    client.onDisconnect = (_frame) => {
      setIsConnected(false);
      setIsConnecting(false);
      subscriptionRef.current = null;
      
      // Reset reconnect attempts on clean disconnect
      reconnectAttemptRef.current = 0;
    };

    clientRef.current = client;
    client.activate();
  }, [config.orderId, isConnecting]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Unsubscribe
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe();
      } catch (err) {
        console.error('[OrderDetailStatusTracking] Error unsubscribing:', err);
      }
      subscriptionRef.current = null;
    }
    
    // Deactivate client
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
    lastMessageRef.current = null;
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (config.autoConnect && config.orderId) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [config.orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isConnected,
    isConnecting,
    error,
    latestStatusChange,
    connect,
    disconnect,
  };
};

export default useOrderDetailStatusTracking;
