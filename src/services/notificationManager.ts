import { notificationService } from './notificationService';
import type { Notification, NotificationType } from '../types/notification';

export interface NotificationManagerCallbacks {
  onNewNotification?: (notification: Notification) => void;
  onNotificationRead?: (notificationId: string) => void;
  onStatsUpdate?: (stats: { unreadCount: number }) => void;
  onListUpdate?: () => void;
}

/**
 * NotificationManager - Centralized notification state management
 * 
 * Pattern: Follows IssueWebSocket pattern for consistent behavior
 * - Delegates WebSocket connection to notificationService (handles auto-reconnect)
 * - Manages callbacks for UI components
 * - No manual reconnection logic (handled by notificationService)
 */
class NotificationManager {
  private static instance: NotificationManager;
  private callbacks: Map<string, NotificationManagerCallbacks> = new Map();
  private unsubscribe: (() => void) | null = null;
  private currentUserId: string = '';
  private currentUserRole: 'STAFF' | 'CUSTOMER' = 'STAFF';
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  
  // Queue for notifications that arrive before callbacks are registered
  private pendingNotifications: Notification[] = [];
  
  // Cache for sharing data between components
  private notificationCache: {
    notifications: Notification[];
    total: number;
    lastFetch: number;
  } = {
    notifications: [],
    total: 0,
    lastFetch: 0
  };

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Initialize notification manager with user context
   * WebSocket connection and auto-reconnect handled by notificationService
   */
  async initialize(userId: string, userRole: 'STAFF' | 'CUSTOMER'): Promise<void> {
    // Prevent duplicate initialization
    if (this.isInitialized && this.currentUserId === userId) {
      console.log('🔔 [NotificationManager] Already initialized for user:', userId);
      return;
    }

    // Prevent concurrent initialization
    if (this.isInitializing) {
      console.log('🔔 [NotificationManager] Already initializing, waiting...');
      return;
    }

    this.isInitializing = true;
    console.log('🔔 [NotificationManager] Initializing for user:', userId, 'role:', userRole);
    
    // Cleanup existing subscription but keep callbacks
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.currentUserId = userId;
    this.currentUserRole = userRole;

    try {
      // Connect to WebSocket (notificationService handles auto-reconnect)
      await notificationService.connect(userId, userRole);
      
      // Register callback for notifications
      this.unsubscribe = notificationService.subscribe((notification: Notification) => {
        console.log('🔔 [NotificationManager] New notification received:', notification);
        this.handleNewNotification(notification);
      });

      this.isInitialized = true;
      this.isInitializing = false;
      console.log('✅ [NotificationManager] Initialized successfully');
      
    } catch (error) {
      console.error('❌ [NotificationManager] Failed to initialize:', error);
      this.isInitializing = false;
      // notificationService will auto-reconnect, no need to handle here
    }
  }

  /**
   * Register component callbacks
   */
  register(id: string, callbacks: NotificationManagerCallbacks): void {
    console.log('🔔 [NotificationManager] Registering component:', id);
    this.callbacks.set(id, callbacks);
    
    // Process any pending notifications that arrived before callbacks were registered
    if (this.pendingNotifications.length > 0) {
      console.log(`🔔 [NotificationManager] Processing ${this.pendingNotifications.length} pending notifications for ${id}`);
      const pending = [...this.pendingNotifications];
      this.pendingNotifications = [];
      
      pending.forEach(notification => {
        if (callbacks.onNewNotification) {
          callbacks.onNewNotification(notification);
        }
        if (callbacks.onListUpdate) {
          callbacks.onListUpdate();
        }
      });
      
      // Update stats after processing pending notifications
      this.broadcastStatsUpdate();
    }
  }

  /**
   * Unregister component callbacks
   */
  unregister(id: string): void {
    console.log('🔔 [NotificationManager] Unregistering component:', id);
    this.callbacks.delete(id);
  }

  /**
   * Handle new notification - broadcast to all registered components
   */
  private handleNewNotification(notification: Notification): void {
    // If no callbacks registered yet, queue the notification
    if (this.callbacks.size === 0) {
      console.log('🔔 [NotificationManager] No callbacks registered, queuing notification');
      this.pendingNotifications.push(notification);
      return;
    }

    // Notify all components about new notification
    this.callbacks.forEach((callbacks, id) => {
      console.log(`🔔 [NotificationManager] Broadcasting to ${id}`);
      if (callbacks.onNewNotification) {
        callbacks.onNewNotification(notification);
      }
      if (callbacks.onListUpdate) {
        callbacks.onListUpdate();
      }
    });

    // No need to delay stats update anymore
    // Backend now guarantees transaction commit before WebSocket broadcast
    this.broadcastStatsUpdate();
  }

  /**
   * Mark notification as read and broadcast update
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Broadcast to all components
      this.callbacks.forEach((callbacks) => {
        if (callbacks.onNotificationRead) {
          callbacks.onNotificationRead(notificationId);
        }
        if (callbacks.onListUpdate) {
          callbacks.onListUpdate();
        }
      });

      // Update stats
      this.broadcastStatsUpdate();
    } catch (error) {
      console.error('❌ [NotificationManager] Failed to mark as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read and broadcast update
   */
  async markAllAsRead(): Promise<void> {
    try {
      await notificationService.markAllAsRead();
      
      // Broadcast to other components (dropdown modal) after successful API call
      this.broadcastListUpdate();
      
      // Update stats
      this.broadcastStatsUpdate();
    } catch (error) {
      console.error('❌ [NotificationManager] Failed to mark all as read:', error);
      throw error;
    }
  }

  /**
   * Broadcast list update to all components
   */
  broadcastListUpdate(): void {
    console.log('🔄 [NotificationManager] Broadcasting list update to all components');
    this.callbacks.forEach((callbacks) => {
      if (callbacks.onListUpdate) {
        callbacks.onListUpdate();
      }
    });
  }

  /**
   * Broadcast stats update to all components
   */
  async broadcastStatsUpdate(): Promise<void> {
    try {
      const stats = await notificationService.getNotificationStats();
      this.callbacks.forEach((callbacks) => {
        if (callbacks.onStatsUpdate) {
          callbacks.onStatsUpdate(stats);
        }
      });
    } catch (error) {
      console.error('❌ [NotificationManager] Failed to get stats:', error);
    }
  }

  /**
   * Get current stats
   */
  async getStats(): Promise<{ unreadCount: number }> {
    return await notificationService.getNotificationStats();
  }

  /**
   * Cache notifications for sharing between components
   */
  setCache(notifications: Notification[], total: number): void {
    this.notificationCache = {
      notifications: [...notifications],
      total,
      lastFetch: Date.now()
    };
    console.log('💾 [NotificationManager] Cached', notifications.length, 'notifications');
  }

  /**
   * Get cached notifications
   */
  getCache(): { notifications: Notification[]; total: number; lastFetch: number } | null {
    // Cache valid for 5 minutes
    const CACHE_TTL = 5 * 60 * 1000;
    if (Date.now() - this.notificationCache.lastFetch > CACHE_TTL) {
      console.log('⏰ [NotificationManager] Cache expired');
      return null;
    }
    console.log('📋 [NotificationManager] Using cache with', this.notificationCache.notifications.length, 'notifications');
    return { ...this.notificationCache };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.notificationCache = {
      notifications: [],
      total: 0,
      lastFetch: 0
    };
    console.log('🗑️ [NotificationManager] Cache cleared');
  }

  /**
   * Cleanup subscription and callbacks
   */
  cleanup(): void {
    console.log('🔔 [NotificationManager] Cleaning up...');
    
    // Unsubscribe from notifications
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    // Disconnect WebSocket
    notificationService.disconnect();
    
    this.callbacks.clear();
    this.pendingNotifications = [];
    this.clearCache();
    this.isInitialized = false;
    this.isInitializing = false;
    this.currentUserId = '';
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

export const notificationManager = NotificationManager.getInstance();
