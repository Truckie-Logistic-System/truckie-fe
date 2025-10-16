import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import authService from '../services/auth/authService';

// Định nghĩa interface cho dữ liệu vị trí xe
export interface VehicleLocationMessage {
  vehicleId: string;
  latitude: number;
  longitude: number;
  licensePlateNumber: string;
  manufacturer: string;
  vehicleTypeName: string;
  vehicleAssignmentId: string;
  trackingCode: string;
  assignmentStatus: string;
  driver1Name: string | null;
  driver1Phone: string | null;
  driver2Name: string | null;
  driver2Phone: string | null;
  lastUpdated: string;
}

export interface UseVehicleTrackingOptions {
  orderId?: string;
  vehicleId?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseVehicleTrackingReturn {
  vehicleLocations: VehicleLocationMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
}

const DEFAULT_OPTIONS: Required<UseVehicleTrackingOptions> = {
  orderId: '',
  vehicleId: '',
  autoConnect: false,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
};

export const useVehicleTracking = (options: UseVehicleTrackingOptions = {}): UseVehicleTrackingReturn => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocationMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const subscriptionsRef = useRef<any[]>([]);

  // Logging function
  const log = useCallback((message: string, data?: any) => {
    console.log(`[VehicleTracking] ${message}`, data || '');
  }, []);

  // Error logging function
  const logError = useCallback((message: string, error?: any) => {
    console.error(`[VehicleTracking] ${message}`, error || '');
  }, []);

  // Clear reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Handle incoming vehicle location messages
  const handleVehicleLocationMessage = useCallback((message: IMessage) => {
    try {
      const locationData: VehicleLocationMessage | VehicleLocationMessage[] = JSON.parse(message.body);
      log('Received vehicle location data:', locationData);
      
      if (Array.isArray(locationData)) {
        log(`Setting ${locationData.length} vehicle locations from array`);
        setVehicleLocations(locationData);
      } else {
        log(`Updating single vehicle location: ${locationData.vehicleId}`);
        setVehicleLocations(prev => {
          const existingIndex = prev.findIndex(v => v.vehicleId === locationData.vehicleId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = locationData;
            log(`Updated existing vehicle at index ${existingIndex}`);
            return updated;
          } else {
            log(`Added new vehicle to tracking list`);
            return [...prev, locationData];
          }
        });
      }
      
      setError(null);
    } catch (err) {
      logError('Failed to parse vehicle location message:', err);
      setError('Lỗi khi xử lý dữ liệu vị trí xe');
    }
  }, [log, logError]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (clientRef.current?.connected || isConnecting) {
      log('Already connected or connecting, skipping...');
      return;
    }

    const token = authService.getAuthToken();
    if (!token) {
      logError('No auth token available');
      setError('Không có token xác thực');
      return;
    }

    if (!config.orderId && !config.vehicleId) {
      logError('Neither orderId nor vehicleId provided');
      setError('Cần cung cấp orderId hoặc vehicleId');
      return;
    }

    setIsConnecting(true);
    setError(null);
    log('Connecting to WebSocket via SockJS...');

    // Create STOMP client with SockJS transport
    const client = new Client({
      // Use SockJS instead of raw WebSocket
      webSocketFactory: () => {
        return new SockJS(`http://${window.location.hostname}:8080/vehicle-tracking-browser`);
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        log('STOMP Debug:', str);
      },
      reconnectDelay: config.reconnectInterval,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Connection success handler
    client.onConnect = (frame) => {
      log('Connected to WebSocket SUCCESSFUL', frame);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;

      try {
        // Subscribe to appropriate topic based on configuration
        if (config.orderId) {
          log(`Subscribing to order vehicles topic: /topic/orders/${config.orderId}/vehicles`);
          
          const subscription = client.subscribe(
            `/topic/orders/${config.orderId}/vehicles`,
            handleVehicleLocationMessage
          );
          subscriptionsRef.current.push(subscription);

          // Request initial location data for all vehicles in the order
          log(`Requesting locations for order: ${config.orderId}`);
          client.publish({
            destination: `/app/order/${config.orderId}/get-locations`,
            body: JSON.stringify({ orderId: config.orderId }),
          });
        }

        if (config.vehicleId) {
          log(`Subscribing to single vehicle topic: /topic/vehicles/${config.vehicleId}`);
          
          const subscription = client.subscribe(
            `/topic/vehicles/${config.vehicleId}`,
            handleVehicleLocationMessage
          );
          subscriptionsRef.current.push(subscription);

          // Request initial location data for the specific vehicle
          log(`Requesting location for vehicle: ${config.vehicleId}`);
          client.publish({
            destination: `/app/vehicle/${config.vehicleId}/get-location`,
            body: JSON.stringify({ vehicleId: config.vehicleId }),
          });
        }
      } catch (subscriptionError) {
        logError('Failed to subscribe to topics:', subscriptionError);
        setError('Lỗi khi đăng ký nhận dữ liệu');
      }
    };

    // Connection error handler
    client.onStompError = (frame) => {
      logError('STOMP error:', frame);
      setIsConnected(false);
      setIsConnecting(false);
      setError(`Lỗi kết nối WebSocket: ${frame.headers['message'] || 'Unknown error'}`);
      
      // Attempt reconnection if not exceeded max attempts
      if (reconnectAttemptsRef.current < config.maxReconnectAttempts) {
        scheduleReconnect();
      }
    };

    // WebSocket error handler
    client.onWebSocketError = (event) => {
      logError('WebSocket error:', event);
      setIsConnected(false);
      setIsConnecting(false);
      setError('Lỗi kết nối WebSocket');
      
      if (reconnectAttemptsRef.current < config.maxReconnectAttempts) {
        scheduleReconnect();
      }
    };

    // Disconnection handler
    client.onDisconnect = (frame) => {
      log('Disconnected from WebSocket', frame);
      setIsConnected(false);
      setIsConnecting(false);
      
      // Clear subscriptions
      subscriptionsRef.current = [];
      
      // Attempt reconnection if not manually disconnected
      if (reconnectAttemptsRef.current < config.maxReconnectAttempts) {
        scheduleReconnect();
      }
    };

    clientRef.current = client;
    client.activate();
  }, [config, handleVehicleLocationMessage, log, logError, isConnecting]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectAttemptsRef.current += 1;
    
    log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current}/${config.maxReconnectAttempts} in ${config.reconnectInterval}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (reconnectAttemptsRef.current <= config.maxReconnectAttempts) {
        log(`Reconnection attempt ${reconnectAttemptsRef.current}`);
        connect();
      } else {
        logError('Max reconnection attempts reached');
        setError('Không thể kết nối lại sau nhiều lần thử');
      }
    }, config.reconnectInterval);
  }, [config.maxReconnectAttempts, config.reconnectInterval, connect, log, logError, clearReconnectTimeout]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    log('Disconnecting from WebSocket...');
    
    clearReconnectTimeout();
    reconnectAttemptsRef.current = config.maxReconnectAttempts; // Prevent auto-reconnection
    
    // Unsubscribe from all topics
    subscriptionsRef.current.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (err) {
        logError('Error unsubscribing:', err);
      }
    });
    subscriptionsRef.current = [];
    
    // Deactivate client
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setVehicleLocations([]);
    setError(null);
  }, [config.maxReconnectAttempts, log, logError, clearReconnectTimeout]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    log('Manual reconnect requested');
    reconnectAttemptsRef.current = 0; // Reset attempts
    disconnect();
    setTimeout(() => connect(), 1000); // Wait a bit before reconnecting
  }, [connect, disconnect, log]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (config.autoConnect && (config.orderId || config.vehicleId)) {
      log('Auto-connecting on mount');
      connect();
    }

    // Cleanup on unmount
    return () => {
      log('Cleaning up WebSocket connection');
      disconnect();
    };
  }, [config.autoConnect, config.orderId, config.vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconnect when orderId or vehicleId changes
  useEffect(() => {
    if (isConnected && (config.orderId || config.vehicleId)) {
      log('Configuration changed, reconnecting...');
      reconnect();
    }
  }, [config.orderId, config.vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    vehicleLocations,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect,
  };
};

export default useVehicleTracking;
