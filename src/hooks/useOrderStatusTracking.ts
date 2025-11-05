import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import authService from '../services/auth/authService';

// Interface cho order status change message
export interface OrderStatusChangeMessage {
  orderId: string;
  orderCode: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  message: string;
}

export interface UseOrderStatusTrackingOptions {
  orderId?: string;
  autoConnect?: boolean;
  onStatusChange?: (message: OrderStatusChangeMessage) => void;
  onRefreshNeeded?: () => void; // Callback to trigger page refresh
}

export interface UseOrderStatusTrackingReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  latestStatusChange: OrderStatusChangeMessage | null;
  connect: () => void;
  disconnect: () => void;
}

const DEFAULT_OPTIONS: Required<Omit<UseOrderStatusTrackingOptions, 'onStatusChange' | 'onRefreshNeeded'>> = {
  orderId: '',
  autoConnect: false,
};

/**
 * Hook để subscribe order status changes qua WebSocket
 * Tách biệt với vehicle tracking để tránh coupling
 */
export const useOrderStatusTracking = (
  options: UseOrderStatusTrackingOptions = {}
): UseOrderStatusTrackingReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestStatusChange, setLatestStatusChange] = useState<OrderStatusChangeMessage | null>(null);
  
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Store callbacks in refs to avoid dependency issues
  const onStatusChangeRef = useRef(options.onStatusChange);
  const onRefreshNeededRef = useRef(options.onRefreshNeeded);

  // Update refs when callbacks change
  useEffect(() => {
    onStatusChangeRef.current = options.onStatusChange;
    onRefreshNeededRef.current = options.onRefreshNeeded;
  }, [options.onStatusChange, options.onRefreshNeeded]);

  // Handle incoming status change messages
  const handleStatusChangeMessage = useCallback((message: IMessage) => {
    try {
      const statusChange: OrderStatusChangeMessage = JSON.parse(message.body);
      console.log('[OrderStatusTracking] 📢 Status change received:', statusChange);
      console.log('[OrderStatusTracking] orderId type:', typeof statusChange.orderId, 'value:', statusChange.orderId);
      console.log('[OrderStatusTracking] Full message body:', message.body);
      
      setLatestStatusChange(statusChange);
      
      // Call onStatusChange callback if provided
      if (onStatusChangeRef.current) {
        console.log('[OrderStatusTracking] Calling onStatusChange callback...');
        onStatusChangeRef.current(statusChange);
      } else {
        console.log('[OrderStatusTracking] No onStatusChange callback provided');
      }
      
      // Call onRefreshNeeded callback if provided (for automatic page refresh)
      if (onRefreshNeededRef.current) {
        console.log('[OrderStatusTracking] 🔄 Triggering page refresh...');
        onRefreshNeededRef.current();
      }
      
      setError(null);
    } catch (err) {
      console.error('[OrderStatusTracking] Failed to parse status change message:', err);
      setError('Lỗi khi xử lý thông báo thay đổi trạng thái');
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (clientRef.current?.connected || isConnecting) {
      console.log('[OrderStatusTracking] Already connected or connecting');
      return;
    }

    const token = authService.getAuthToken();
    if (!token) {
      console.error('[OrderStatusTracking] No auth token available');
      setError('Không có token xác thực');
      return;
    }

    if (!config.orderId) {
      console.error('[OrderStatusTracking] No orderId provided');
      setError('Cần cung cấp orderId');
      return;
    }

    console.log('[OrderStatusTracking] 🔌 Connecting for order:', config.orderId);
    setIsConnecting(true);
    setError(null);

    // Create STOMP client with SockJS transport
    const client = new Client({
      webSocketFactory: () => {
        return new SockJS(`http://${window.location.hostname}:8080/vehicle-tracking-browser`);
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
      console.log('[OrderStatusTracking] ✅ Connected');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      try {
        // Subscribe to order status changes
        const topicPath = `/topic/orders/${config.orderId}/status`;
        console.log(`[OrderStatusTracking] 🔗 Subscribing to: ${topicPath}`);
        
        const subscription = client.subscribe(
          topicPath,
          handleStatusChangeMessage
        );
        subscriptionRef.current = subscription;
      } catch (subscriptionError) {
        console.error('[OrderStatusTracking] Subscription error:', subscriptionError);
        setError('Lỗi khi đăng ký nhận thông báo');
      }
    };

    // Connection error handler
    client.onStompError = (frame) => {
      console.error('[OrderStatusTracking] ❌ STOMP error:', frame);
      setIsConnected(false);
      setIsConnecting(false);
      setError(`Lỗi kết nối: ${frame.headers['message'] || 'Unknown error'}`);
      
      // Auto-reconnect with exponential backoff
      if (reconnectAttemptRef.current < maxReconnectAttempts) {
        reconnectAttemptRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current - 1), 30000);
        console.log(`[OrderStatusTracking] 🔄 Attempting reconnect (${reconnectAttemptRef.current}/${maxReconnectAttempts}) in ${delay}ms`);
        setTimeout(() => {
          connect();
        }, delay);
      }
    };

    // WebSocket error handler
    client.onWebSocketError = (event) => {
      console.error('[OrderStatusTracking] ❌ WebSocket error:', event);
      setIsConnected(false);
      setIsConnecting(false);
      setError('Lỗi kết nối WebSocket');
      
      // Auto-reconnect with exponential backoff
      if (reconnectAttemptRef.current < maxReconnectAttempts) {
        reconnectAttemptRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current - 1), 30000);
        console.log(`[OrderStatusTracking] 🔄 Attempting reconnect (${reconnectAttemptRef.current}/${maxReconnectAttempts}) in ${delay}ms`);
        setTimeout(() => {
          connect();
        }, delay);
      }
    };

    // Disconnection handler
    client.onDisconnect = (_frame) => {
      console.log('[OrderStatusTracking] 🔌 Disconnected');
      setIsConnected(false);
      setIsConnecting(false);
      subscriptionRef.current = null;
      
      // Reset reconnect attempts on clean disconnect
      reconnectAttemptRef.current = 0;
    };

    clientRef.current = client;
    client.activate();
  }, [config.orderId, handleStatusChangeMessage, isConnecting]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    console.log('[OrderStatusTracking] 🔌 Disconnecting...');
    
    // Unsubscribe
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe();
      } catch (err) {
        console.error('[OrderStatusTracking] Error unsubscribing:', err);
      }
      subscriptionRef.current = null;
    }
    
    // Deactivate client
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
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
  }, [config.autoConnect, config.orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isConnected,
    isConnecting,
    error,
    latestStatusChange,
    connect,
    disconnect,
  };
};

export default useOrderStatusTracking;