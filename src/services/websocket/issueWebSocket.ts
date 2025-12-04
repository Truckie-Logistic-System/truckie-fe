import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from '@/config/env';

type IssueUpdateCallback = (issue: any) => void;
type UserNotificationCallback = (notification: any) => void;

class IssueWebSocketService {
    private client: Client | null = null;
    private subscribers: Map<string, IssueUpdateCallback[]> = new Map();
    private userNotificationCallbacks: UserNotificationCallback[] = [];
    private reconnectAttempts = 0;
    private reconnectDelay = 5000; // 5 giây
    private userId: string | null = null;
    private isConnecting: boolean = false;
    private pendingSubscriptions: (() => void)[] = [];

    /**
     * Connect to WebSocket server
     * @param userId Optional user ID for subscribing to user-specific notifications
     */
    async connect(userId?: string): Promise<void> {
        // Store userId for user-specific subscriptions
        if (userId) {
            this.userId = userId;
        }
        
        if (this.client?.connected) {
            // If already connected but userId changed, resubscribe
            if (userId && userId !== this.userId) {
                this.userId = userId;
                this.setupUserNotificationSubscription();
            }
            return;
        }

        if (this.isConnecting) {
            console.log('🔄 [IssueWebSocket] Connection already in progress, waiting...');
            return;
        }

        this.isConnecting = true;

        // Get JWT token from authService (in-memory storage for security)
        const authService = await import('../auth/authService').then(module => module.default);
        const token = authService.getAuthToken();

        return new Promise<void>((resolve, reject) => {
            // Use API_BASE_URL from environment configuration
            const socket = new SockJS(`${API_BASE_URL}/vehicle-tracking-browser`);
            
            this.client = new Client({
                webSocketFactory: () => socket as any,
                connectHeaders: {
                    Authorization: token ? `Bearer ${token}` : '',
                },
                debug: (str) => {
                },
                reconnectDelay: this.reconnectDelay,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            this.client.onConnect = () => {
                this.reconnectAttempts = 0;
                this.isConnecting = false;
                console.log('✅ [IssueWebSocket] Connected successfully');
                
                // Execute all pending subscriptions
                this.subscribeToIssueUpdates();
                this.processPendingSubscriptions();
                
                resolve();
            };

            this.client.onStompError = (frame) => {
                console.error('❌ [IssueWebSocket] STOMP error:', frame);
                this.isConnecting = false;
                reject(new Error(frame.headers['message']));
            };

            this.client.onWebSocketClose = () => {
                console.warn('⚠️ [IssueWebSocket] WebSocket connection closed');
                this.handleReconnect();
            };

            this.client.activate();
        });
    }

    /**
     * Process pending subscriptions after connection
     */
    private processPendingSubscriptions() {
        const pending = [...this.pendingSubscriptions];
        this.pendingSubscriptions = [];
        
        pending.forEach(subscription => {
            try {
                subscription();
            } catch (error) {
                console.error('❌ [IssueWebSocket] Error processing pending subscription:', error);
            }
        });
    }

    /**
     * Queue a subscription to be processed when connected
     */
    private queueSubscription(subscription: () => void) {
        this.pendingSubscriptions.push(subscription);
    }

    /**
     * Subscribe to issue status changes
     */
    private subscribeToIssueUpdates() {
        if (!this.client?.connected) {
            console.warn('⚠️ [IssueWebSocket] Cannot subscribe - not connected');
            return;
        }

        // Subscribe to issue status changes (all staff)
        this.client.subscribe('/topic/issues/status-change', (message: IMessage) => {
            try {
                const issue = JSON.parse(message.body);
                this.notifySubscribers(issue.id, issue);
            } catch (error) {
                console.error('❌ [IssueWebSocket] Error parsing issue update:', error);
            }
        });
        // Subscribe to user-specific notifications if userId is set
        this.setupUserNotificationSubscription();
    }

    /**
     * Setup user-specific notification subscription ( internal)
     */
    private setupUserNotificationSubscription() {
        if (!this.client?.connected) {
            console.warn('⚠️ [IssueWebSocket] Cannot subscribe to user notifications - not connected, queuing for later');
            // Queue the subscription for when connection is ready
            if (this.userId) {
                this.queueSubscription(() => {
                    this.setupUserNotificationSubscription();
                });
            }
            return;
        }
        
        if (!this.userId) {
            return;
        }

        // Subscribe to user-specific notifications
        this.client.subscribe(`/topic/user/${this.userId}/notifications`, (message: IMessage) => {
            try {
                const notification = JSON.parse(message.body);
                // Notify all registered callbacks
                this.userNotificationCallbacks.forEach(callback => {
                    try {
                        callback(notification);
                    } catch (error) {
                        console.error('❌ [IssueWebSocket] Error in user notification callback:', error);
                    }
                });
            } catch (error) {
                console.error('❌ [IssueWebSocket] Error parsing user notification:', error);
            }
        });
    }

    /**
     * Subscribe to user-specific notifications
     * @param callback Function to call when notification is received
     * @returns Unsubscribe function
     */
    subscribeToUserNotifications(callback: UserNotificationCallback): () => void {
        this.userNotificationCallbacks.push(callback);
        

        // Return unsubscribe function
        return () => {
            const index = this.userNotificationCallbacks.indexOf(callback);
            if (index > -1) {
                this.userNotificationCallbacks.splice(index, 1);
            }
        };
    }

    /**
     * Subscribe to updates for a specific issue
     * @param issueId Issue ID to subscribe to
     * @param callback Function to call when issue is updated
     * @returns Unsubscribe function
     */
    subscribeToIssue(issueId: string, callback: IssueUpdateCallback): () => void {
        if (!this.subscribers.has(issueId)) {
            this.subscribers.set(issueId, []);
        }
        
        const callbacks = this.subscribers.get(issueId)!;
        callbacks.push(callback);

        

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(issueId);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
                
                if (callbacks.length === 0) {
                    this.subscribers.delete(issueId);
                }
            }
        };
    }

    /**
     * Notify all subscribers of an issue update
     * Supports both specific issue ID subscribers and wildcard subscribers
     */
    private notifySubscribers(issueId: string, issue: any) {
        
        
        let notifiedCount = 0;
        
        // Notify specific issue ID subscribers
        const callbacks = this.subscribers.get(issueId);
        if (callbacks && callbacks.length > 0) {
            callbacks.forEach(callback => {
                try {
                    callback(issue);
                    notifiedCount++;
                } catch (error) {
                    console.error('❌ [IssueWebSocket] Error in subscriber callback:', error);
                }
            });
        }
        
        // Notify ALL wildcard/global subscribers (those with keys starting with '*')
        this.subscribers.forEach((wildcardCallbacks, key) => {
            if (key.startsWith('*') || key.startsWith('order-')) {
                wildcardCallbacks.forEach(callback => {
                    try {
                        callback(issue);
                        notifiedCount++;
                    } catch (error) {
                        console.error('❌ [IssueWebSocket] Error in wildcard subscriber callback:', error);
                    }
                });
            }
        });
        
        // Fallback event if no one was notified
        if (notifiedCount === 0) {
            console.warn(`⚠️ [IssueWebSocket] No subscribers found for issue ${issueId}`);
            const event = new CustomEvent('issue-update-no-subscriber', {
                detail: { issueId, issue }
            });
            window.dispatchEvent(event);
        } else {
        }
    }

    /**
     * Handle reconnection logic - unlimited retries
     */
    private handleReconnect() {
        this.reconnectAttempts++;
        this.isConnecting = false; // Reset connection state
        
        // Exponential backoff with max 30 seconds
        const delay = Math.min(this.reconnectDelay * Math.min(this.reconnectAttempts, 6), 30000);
        
        setTimeout(() => {
            this.connect().catch(error => {
                console.error('❌ [IssueWebSocket] Reconnection failed:', error);
                // Will retry again through onWebSocketClose
            });
        }, delay);
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.subscribers.clear();
        }
        
        // Clear connection state and pending subscriptions
        this.isConnecting = false;
        this.pendingSubscriptions = [];
        this.userId = null;
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected(): boolean {
        return this.client?.connected ?? false;
    }
}

// Export singleton instance
export const issueWebSocket = new IssueWebSocketService();
export default issueWebSocket;
