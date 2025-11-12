import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

type IssueUpdateCallback = (issue: any) => void;

class IssueWebSocketService {
    private client: Client | null = null;
    private subscribers: Map<string, IssueUpdateCallback[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;

    /**
     * Connect to WebSocket server
     */
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.client?.connected) {
                resolve();
                return;
            }

            const socket = new SockJS(`${import.meta.env.VITE_API_BASE_URL}/ws`);
            
            this.client = new Client({
                webSocketFactory: () => socket as any,
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
     */
    private notifySubscribers(issueId: string, issue: any) {
        const callbacks = this.subscribers.get(issueId);
        if (callbacks) {
            console.log(`📤 [IssueWebSocket] Notifying ${callbacks.length} subscribers for issue ${issueId}`);
            callbacks.forEach(callback => {
                try {
                    callback(issue);
                } catch (error) {
                    console.error('❌ [IssueWebSocket] Error in subscriber callback:', error);
                }
            });
        }
    }

    /**
     * Handle reconnection logic
     */
    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 [IssueWebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('❌ [IssueWebSocket] Reconnection failed:', error);
                });
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('❌ [IssueWebSocket] Max reconnection attempts reached');
        }
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
