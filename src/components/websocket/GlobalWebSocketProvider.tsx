import React, { useEffect, useCallback } from 'react';
import { useAuth } from '../../context';
import { issueWebSocket } from '../../services/websocket/issueWebSocket';
import { notificationService } from '../../services/notificationService';
import OffRouteWarningProvider from '../off-route-warning/OffRouteWarningProvider';

interface GlobalWebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * Global WebSocket Provider that initializes all WebSocket connections
 * at app root level based on user authentication state
 */
export const GlobalWebSocketProvider: React.FC<GlobalWebSocketProviderProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  const initializeConnections = useCallback(async () => {
    if (!user || isLoading) {
      console.log('[GlobalWebSocket] Skipping connections - user not loaded');
      return;
    }

    const userId = user.id;
    const userRole = user.role;

    console.log('[GlobalWebSocket] Initializing connections for:', { userId, userRole });

    try {
      // Connect Issue WebSocket (global for all authenticated users)
      await issueWebSocket.connect(userId);
      console.log('[GlobalWebSocket] IssueWebSocket connected');
    } catch (error) {
      console.error('[GlobalWebSocket] Failed to connect IssueWebSocket:', error);
    }

    try {
      // Connect Notification Service (role-specific)
      await notificationService.connect(userId, userRole as 'STAFF' | 'CUSTOMER' | 'DRIVER');
      console.log('[GlobalWebSocket] NotificationService connected');
    } catch (error) {
      console.error('[GlobalWebSocket] Failed to connect NotificationService:', error);
    }
  }, [user, isLoading]);

  // Initialize connections when auth state changes
  useEffect(() => {
    initializeConnections();
  }, [initializeConnections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[GlobalWebSocket] Cleaning up connections...');
      // Note: We don't disconnect here to maintain connections across route changes
      // Only disconnect on logout which is handled by auth context
    };
  }, []);

  return (
    <OffRouteWarningProvider>
      {children}
    </OffRouteWarningProvider>
  );
};

export default GlobalWebSocketProvider;
