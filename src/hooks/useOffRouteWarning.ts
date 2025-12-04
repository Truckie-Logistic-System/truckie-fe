import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import authService from '../services/auth/authService';
import { API_BASE_URL } from '../config/env';
import { playMultipleBeeps, SoundType } from '../utils/soundUtils';
import type { OffRouteWarningPayload, OffRouteEventDetail } from '../services/off-route/types';
import { offRouteService } from '../services/off-route';

export interface UseOffRouteWarningOptions {
  autoConnect?: boolean;
  onWarning?: (warning: OffRouteWarningPayload) => void;
}

export interface UseOffRouteWarningReturn {
  warnings: OffRouteWarningPayload[];
  currentWarning: OffRouteWarningPayload | null;
  eventDetail: OffRouteEventDetail | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  dismissWarning: (eventId: string) => void;
  confirmContact: (eventId: string, notes?: string) => Promise<{ success: boolean; message: string; gracePeriodExpiresAt?: string }>;
  extendGracePeriod: (eventId: string, reason?: string) => Promise<{ success: boolean; message: string; gracePeriodExpiresAt?: string }>;
  markNoContact: (eventId: string, notes?: string) => Promise<void>;
  createIssue: (eventId: string, description?: string) => Promise<string | null>;
  fetchEventDetail: (eventId: string) => Promise<void>;
  connect: () => void;
  disconnect: () => void;
}

const STAFF_OFF_ROUTE_TOPIC = '/topic/staff/off-route-warnings';

export const useOffRouteWarning = (
  options: UseOffRouteWarningOptions = {}
): UseOffRouteWarningReturn => {
  const { autoConnect = true, onWarning } = options;

  const [warnings, setWarnings] = useState<OffRouteWarningPayload[]>([]);
  const [currentWarning, setCurrentWarning] = useState<OffRouteWarningPayload | null>(null);
  const [eventDetail, setEventDetail] = useState<OffRouteEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming warning
  const handleWarning = useCallback((warning: OffRouteWarningPayload) => {
    console.log('[OffRouteWarning] Received warning:', warning);

    // Add to warnings list (avoid duplicates)
    setWarnings(prev => {
      const exists = prev.some(w => w.offRouteEventId === warning.offRouteEventId);
      if (exists) {
        // Update existing
        return prev.map(w => 
          w.offRouteEventId === warning.offRouteEventId ? warning : w
        );
      }
      return [...prev, warning];
    });

    // Set as current warning if more severe or no current
    setCurrentWarning(prev => {
      if (!prev || warning.severity === 'RED' || 
          (warning.severity === 'YELLOW' && prev.severity !== 'RED')) {
        return warning;
      }
      return prev;
    });

    // Play sound based on severity
    if (warning.severity === 'RED') {
      playMultipleBeeps(SoundType.OFF_ROUTE_RED, 3, 300);
    } else {
      playMultipleBeeps(SoundType.OFF_ROUTE_YELLOW, 2, 250);
    }

    // Callback
    onWarning?.(warning);
  }, [onWarning]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      console.log('[OffRouteWarning] Already connected');
      return;
    }

    const token = authService.getAuthToken();
    if (!token) {
      console.warn('[OffRouteWarning] No auth token available');
      setError('Không có token xác thực');
      return;
    }

    // console.log('[OffRouteWarning] Connecting to WebSocket...');

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/vehicle-tracking-browser`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('✅ [OffRouteWarning] Connected');
      setIsConnected(true);
      setError(null);

      // Subscribe to staff off-route warnings topic
      client.subscribe(STAFF_OFF_ROUTE_TOPIC, (message) => {
        console.log('[OffRouteWarning] Raw message received:', message.body);
        try {
          const warning = JSON.parse(message.body) as OffRouteWarningPayload;
          console.log('[OffRouteWarning] Parsed warning:', warning);
          handleWarning(warning);
        } catch (err) {
          console.error('[OffRouteWarning] Failed to parse message:', err);
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('[OffRouteWarning] STOMP error:', frame);
      setIsConnected(false);
      setError(frame.headers['message'] || 'Lỗi kết nối');
    };

    client.onWebSocketClose = () => {
      console.warn('[OffRouteWarning] WebSocket closed');
      setIsConnected(false);
      scheduleReconnect();
    };

    clientRef.current = client;
    client.activate();
  }, [handleWarning]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Schedule reconnect
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('[OffRouteWarning] Attempting reconnect...');
      connect();
    }, 5000);
  }, [connect]);

  // Dismiss warning
  const dismissWarning = useCallback((eventId: string) => {
    setWarnings(prev => prev.filter(w => w.offRouteEventId !== eventId));
    setCurrentWarning(prev => 
      prev?.offRouteEventId === eventId ? null : prev
    );
    setEventDetail(null);
  }, []);

  // Fetch event detail
  const fetchEventDetail = useCallback(async (eventId: string) => {
    setIsLoading(true);
    try {
      const detail = await offRouteService.getEventDetail(eventId);
      setEventDetail(detail);
    } catch (err) {
      console.error('[OffRouteWarning] Failed to fetch detail:', err);
      setError('Không thể tải thông tin chi tiết');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Confirm contact - driver will return to route (starts grace period)
  const confirmContact = useCallback(async (eventId: string, notes?: string) => {
    setIsLoading(true);
    try {
      const result = await offRouteService.confirmContact(eventId, notes);
      // Clear current warning temporarily but don't remove from list
      // This allows subsequent warnings for the same event to show new modals
      setCurrentWarning(null);
      setEventDetail(null);
      return result;
    } catch (err) {
      console.error('[OffRouteWarning] Failed to confirm contact:', err);
      setError('Không thể xác nhận liên hệ');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Extend grace period
  const extendGracePeriod = useCallback(async (eventId: string, reason?: string) => {
    setIsLoading(true);
    try {
      const result = await offRouteService.extendGracePeriod(eventId, reason);
      return result;
    } catch (err) {
      console.error('[OffRouteWarning] Failed to extend grace period:', err);
      setError('Không thể gia hạn thời gian chờ');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark no contact
  const markNoContact = useCallback(async (eventId: string, notes?: string) => {
    setIsLoading(true);
    try {
      await offRouteService.markNoContact(eventId, notes);
      // Update warning status in list
      setWarnings(prev => prev.map(w => 
        w.offRouteEventId === eventId 
          ? { ...w, canContactDriver: false } as any
          : w
      ));
    } catch (err) {
      console.error('[OffRouteWarning] Failed to mark no contact:', err);
      setError('Không thể đánh dấu không liên hệ được');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create issue
  const createIssue = useCallback(async (eventId: string, description?: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const result = await offRouteService.createIssue({
        offRouteEventId: eventId,
        description,
      });
      dismissWarning(eventId);
      return result.issueId;
    } catch (err) {
      console.error('[OffRouteWarning] Failed to create issue:', err);
      setError('Không thể tạo sự cố');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dismissWarning]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    warnings,
    currentWarning,
    eventDetail,
    isLoading,
    isConnected,
    error,
    dismissWarning,
    confirmContact,
    extendGracePeriod,
    markNoContact,
    createIssue,
    fetchEventDetail,
    connect,
    disconnect,
  };
};

export default useOffRouteWarning;
