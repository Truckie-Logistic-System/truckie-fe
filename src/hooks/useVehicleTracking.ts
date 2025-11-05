import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import type { IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import authService from '../services/auth/authService';

// Định nghĩa interface cho dữ liệu vị trí xe
export interface VehicleLocationMessage {
  vehicleId: string;
  latitude: number | null;
  longitude: number | null;
  licensePlateNumber: string;
  manufacturer: string;
  vehicleTypeName: string;
  vehicleAssignmentId: string;
  trackingCode: string;
  orderDetailStatus: string;
  driver1Name: string | null;
  driver1Phone: string | null;
  driver2Name: string | null;
  driver2Phone: string | null;
  lastUpdated: string | null;
  bearing: number | null;
  speed: number | null;
  velocityLat: number | null;
  velocityLng: number | null;
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
  const initialDataRequestedRef = useRef(false);
  const retryInitialDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vehicleLocationsRef = useRef<VehicleLocationMessage[]>([]);

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

  // Request initial data helper
  const requestInitialData = useCallback(() => {
    const client = clientRef.current;
    if (!client || !client.connected) return;

    if (config.orderId) {
      console.log(`📤 Requesting initial locations for order ${config.orderId}`);
      client.publish({
        destination: `/app/order/${config.orderId}/get-locations`,
        body: JSON.stringify({ orderId: config.orderId }),
      });
      initialDataRequestedRef.current = true;
    } else if (config.vehicleId) {
      console.log(`📤 Requesting initial location for vehicle ${config.vehicleId}`);
      client.publish({
        destination: `/app/vehicle/${config.vehicleId}/get-location`,
        body: JSON.stringify({ vehicleId: config.vehicleId }),
      });
      initialDataRequestedRef.current = true;
    }
  }, [config.orderId, config.vehicleId]);

  // Handle incoming vehicle location messages
  const handleVehicleLocationMessage = useCallback((message: IMessage) => {
    try {
      const locationData: VehicleLocationMessage | VehicleLocationMessage[] = JSON.parse(message.body);
      
      if (Array.isArray(locationData)) {
        // CRITICAL: Deduplicate vehicles by vehicleId to prevent React key conflicts
        // This handles edge cases where backend might send duplicates (e.g., multiple order details per vehicle)
        const uniqueVehicles = locationData.reduce((acc, vehicle) => {
          // Keep only the first occurrence of each vehicleId
          if (!acc.some(v => v.vehicleId === vehicle.vehicleId)) {
            acc.push(vehicle);
          }
          return acc;
        }, [] as VehicleLocationMessage[]);
        
        if (uniqueVehicles.length !== locationData.length) {
          console.warn(`[VehicleTracking] Deduplicated ${locationData.length - uniqueVehicles.length} duplicate vehicle(s)`);
        }
        
        setVehicleLocations(uniqueVehicles);
        vehicleLocationsRef.current = uniqueVehicles;
      } else {
        setVehicleLocations(prev => {
          const existingIndex = prev.findIndex(v => v.vehicleId === locationData.vehicleId);
          if (existingIndex >= 0) {
            const existing = prev[existingIndex];
            
            // Check if position actually changed to avoid unnecessary updates
            // Handle null values gracefully
            const positionChanged = 
              (existing.latitude === null && locationData.latitude !== null) ||
              (existing.latitude !== null && locationData.latitude === null) ||
              (existing.latitude !== null && locationData.latitude !== null && Math.abs(existing.latitude - locationData.latitude) > 0.000001) ||
              (existing.longitude === null && locationData.longitude !== null) ||
              (existing.longitude !== null && locationData.longitude === null) ||
              (existing.longitude !== null && locationData.longitude !== null && Math.abs(existing.longitude - locationData.longitude) > 0.000001);
            
            if (positionChanged || existing.lastUpdated !== locationData.lastUpdated) {
              const updated = [...prev];
              updated[existingIndex] = locationData;
              vehicleLocationsRef.current = updated;
              return updated;
            } else {
              return prev; // No change, return same reference
            }
          } else {
            const updated = [...prev, locationData];
            vehicleLocationsRef.current = updated;
            return updated;
          }
        });
      }
      
      setError(null);
    } catch (err) {
      logError('Failed to parse vehicle location message:', err);
      setError('Lỗi khi xử lý dữ liệu vị trí xe');
    }
  }, [logError]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (clientRef.current?.connected || isConnecting) {
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

    // Create STOMP client with SockJS transport
    const client = new Client({
      // Use SockJS instead of raw WebSocket
      webSocketFactory: () => {
        return new SockJS(`http://${window.location.hostname}:8080/vehicle-tracking-browser`);
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (_str) => {
      },
      reconnectDelay: config.reconnectInterval,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Connection success handler
    client.onConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      reconnectAttemptsRef.current = 0;

      try {
        // Subscribe to appropriate topic based on configuration
        // PRIORITY: vehicleId over orderId to avoid conflicts
        if (config.vehicleId) {
          const topicPath = `/topic/vehicles/${config.vehicleId}`;
          console.log(`🔗 Subscribing to vehicle location: ${topicPath}`);
          
          const subscription = client.subscribe(
            topicPath,
            (message) => {
              console.log(`📍 WEBSOCKET: Received location for vehicle ${config.vehicleId}`);
              handleVehicleLocationMessage(message);
            }
          );
          subscriptionsRef.current.push(subscription);

          // Request initial location after subscription
          setTimeout(() => {
            requestInitialData();
            
            // Retry if no data received after 3 seconds
            retryInitialDataTimeoutRef.current = setTimeout(() => {
              if (vehicleLocationsRef.current.length === 0) {
                console.log(`⚠️ No initial data received, retrying...`);
                requestInitialData();
              }
            }, 3000);
          }, 1000);
        } else if (config.orderId) {
          const topicPath = `/topic/orders/${config.orderId}/vehicles`;
          console.log(`🔗 Subscribing to order vehicles: ${topicPath}`);
          
          const subscription = client.subscribe(
            topicPath,
            (message) => {
              console.log(`📍 Received order vehicles update (RAW):`, message.body);
              try {
                const parsed = JSON.parse(message.body);
                console.log(`📍 Received order vehicles update (PARSED):`, parsed);
              } catch (e) {
                console.error('Failed to parse message:', e);
              }
              handleVehicleLocationMessage(message);
            }
          );
          subscriptionsRef.current.push(subscription);

          // Request initial locations for all vehicles in order
          setTimeout(() => {
            requestInitialData();
            
            // Retry if no data received after 3 seconds
            retryInitialDataTimeoutRef.current = setTimeout(() => {
              if (vehicleLocationsRef.current.length === 0) {
                console.log(`⚠️ No initial data received for order, retrying...`);
                requestInitialData();
              }
            }, 3000);
          }, 1000);
        }
      } catch (subscriptionError) {
        setError('Lỗi khi đăng ký nhận dữ liệu');
      }
    };

    // Connection error handler
    client.onStompError = (frame) => {
      setIsConnected(false);
      setIsConnecting(false);
      setError(`Lỗi kết nối WebSocket: ${frame.headers['message'] || 'Unknown error'}`);
      
      // Attempt reconnection if not exceeded max attempts
      if (reconnectAttemptsRef.current < config.maxReconnectAttempts) {
        scheduleReconnect();
      }
    };

    // WebSocket error handler
    client.onWebSocketError = (_event) => {
      setIsConnected(false);
      setIsConnecting(false);
      setError('Lỗi kết nối WebSocket');
      
      if (reconnectAttemptsRef.current < config.maxReconnectAttempts) {
        scheduleReconnect();
      }
    };

    // WebSocket closed handler
    client.onWebSocketClose = (_event) => {
      setIsConnected(false);
      setIsConnecting(false);
      setError('Lỗi kết nối WebSocket');
      
      if (reconnectAttemptsRef.current < config.maxReconnectAttempts) {
        scheduleReconnect();
      }
    };

    // Disconnection handler
    client.onDisconnect = () => {
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
  }, [config, handleVehicleLocationMessage, logError, isConnecting]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    clearReconnectTimeout();
    reconnectAttemptsRef.current += 1;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (reconnectAttemptsRef.current <= config.maxReconnectAttempts) {
        connect();
      } else {
        setError('Không thể kết nối lại sau nhiều lần thử');
      }
    }, config.reconnectInterval);
  }, [config.maxReconnectAttempts, config.reconnectInterval, connect, logError, clearReconnectTimeout]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    
    // Clear retry timeout
    if (retryInitialDataTimeoutRef.current) {
      clearTimeout(retryInitialDataTimeoutRef.current);
      retryInitialDataTimeoutRef.current = null;
    }
    
    reconnectAttemptsRef.current = config.maxReconnectAttempts; // Prevent auto-reconnection
    
    // Unsubscribe from all topics
    subscriptionsRef.current.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (err) {
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
    // DON'T clear vehicleLocations - keep last known positions for user reference
    // setVehicleLocations([]);
    setError(null);
  }, [config.maxReconnectAttempts, logError, clearReconnectTimeout]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0; // Reset attempts
    disconnect();
    setTimeout(() => connect(), 1000); // Wait a bit before reconnecting
  }, [connect, disconnect]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (config.autoConnect && (config.orderId || config.vehicleId)) {
      connect();
    }

    // Cleanup on unmount
    return () => {  
      disconnect();
    };
  }, [config.autoConnect, config.orderId, config.vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconnect when orderId or vehicleId changes
  useEffect(() => {
    if (isConnected && (config.orderId || config.vehicleId)) {
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