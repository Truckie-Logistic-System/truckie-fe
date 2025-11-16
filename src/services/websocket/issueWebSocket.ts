import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL, AUTH_ACCESS_TOKEN_KEY } from '@/config/env';

type IssueUpdateCallback = (issue: any) => void;

class IssueWebSocketService {
    private client: Client | null = null;
    private subscribers: Map<string, IssueUpdateCallback[]> = new Map();
    private reconnectAttempts = 0;
    private reconnectDelay = 5000; // 5 giây

    /**
     * Connect to WebSocket server
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.client?.connected) {
                resolve();
                return;
            }

            // Use API_BASE_URL from environment configuration
            const socket = new SockJS(`${API_BASE_URL}/ws`);
            
            // Get JWT token for authentication
            const token = localStorage.getItem(AUTH_ACCESS_TOKEN_KEY);
            
            this.client = new Client({
                webSocketFactory: () => socket as any,
                connectHeaders: {
                    Authorization: token ? `Bearer ${token}` : '',
                },
                debug: (str) => {
                    console.log('[IssueWebSocket] Debug:', str);
                },
                reconnectDelay: this.reconnectDelay,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            this.client.onConnect = () => {
                console.log('✅ [IssueWebSocket] Connected to WebSocket server');
                this.reconnectAttempts = 0;
                this.subscribeToIssueUpdates();
                resolve();
            };

            this.client.onStompError = (frame) => {
                console.error('❌ [IssueWebSocket] STOMP error:', frame);
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
                console.log('📬 [IssueWebSocket] Issue status changed:', issue.id);
                this.notifySubscribers(issue.id, issue);
            } catch (error) {
                console.error('❌ [IssueWebSocket] Error parsing issue update:', error);
            }
        });

        console.log('✅ [IssueWebSocket] Subscribed to issue updates');
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

        console.log(`📡 [IssueWebSocket] Subscribed to issue ${issueId} (${callbacks.length} subscribers)`);

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
                
                console.log(`📡 [IssueWebSocket] Unsubscribed from issue ${issueId}`);
            }
        };
    }

    /**
     * Notify all subscribers of an issue update
     * Supports both specific issue ID subscribers and wildcard subscribers
     */
    private notifySubscribers(issueId: string, issue: any) {
        console.log(`📤 [IssueWebSocket] Checking subscribers for issue ${issueId}`);
        console.log(`📋 [IssueWebSocket] Current subscribers:`, Array.from(this.subscribers.keys()));
        
        let notifiedCount = 0;
        
        // Notify specific issue ID subscribers
        const callbacks = this.subscribers.get(issueId);
        if (callbacks && callbacks.length > 0) {
            console.log(`📤 [IssueWebSocket] Notifying ${callbacks.length} specific subscribers for issue ${issueId}`);
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
                console.log(`📤 [IssueWebSocket] Notifying ${wildcardCallbacks.length} wildcard subscribers with key ${key}`);
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
            console.log(`✅ [IssueWebSocket] Notified ${notifiedCount} total subscribers`);
        }
    }

    /**
     * Handle reconnection logic - unlimited retries
     */
    private handleReconnect() {
        this.reconnectAttempts++;
        console.log(`🔄 [IssueWebSocket] Attempting to reconnect (attempt #${this.reconnectAttempts})...`);
        
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
            console.log('✅ [IssueWebSocket] Disconnected from WebSocket server');
        }
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
