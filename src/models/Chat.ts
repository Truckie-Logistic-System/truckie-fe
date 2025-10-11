export interface FirestoreTimestamp {
    seconds: number;
    nanos: number;
}

// Request DTO
export interface MessageRequest {
    roomId: string;      // ID của phòng chat
    senderId: string;    // ID của người gửi
    message: string;     // Nội dung tin nhắn
    type: string;
}

export interface ChatMessageDTO {
    id: string;
    senderId: string;
    content: string;
    createAt: FirestoreTimestamp;
    type: string;
}

// Request DTO for uploading image 
export interface ChatImageRequest {
    file: File;
    senderId: string;
    roomId: string;
}



// Response DTO
export interface ChatPageResponse {
    messages: ChatMessageDTO[];
    lastMessageId: string;
    hasMore: boolean;
}

/**
 * Chat message model
 */
export interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderType: 'customer' | 'staff' | 'anonymous';
    content: string;
    timestamp: string;
    isRead: boolean;
    attachments?: ChatAttachment[];
}

/**
 * Chat conversation model
 */
export interface ChatConversation {
    id: string;
    customerId: string | null; // null for anonymous users
    customerName: string;
    staffId: string | null; // null if not assigned to any staff
    staffName: string | null;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    status: 'active' | 'closed' | 'pending';
    messages: ChatMessage[];
}

/**
 * Chat attachment model
 */
export interface ChatAttachment {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
}

/**
 * Mock data for demo
 */
export const MOCK_CONVERSATIONS: ChatConversation[] = [
    {
        id: '1',
        customerId: '101',
        customerName: 'Nguyễn Văn A',
        staffId: '201',
        staffName: 'Nhân viên CSKH',
        lastMessage: 'Chúng tôi có thể giúp gì cho bạn?',
        lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString(),
        unreadCount: 0,
        status: 'active',
        messages: [
            {
                id: '1001',
                senderId: '101',
                senderName: 'Nguyễn Văn A',
                senderType: 'customer',
                content: 'Xin chào, tôi cần hỗ trợ về đơn hàng',
                timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
                isRead: true
            },
            {
                id: '1002',
                senderId: '201',
                senderName: 'Nhân viên CSKH',
                senderType: 'staff',
                content: 'Chúng tôi có thể giúp gì cho bạn?',
                timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
                isRead: true
            }
        ]
    },
    {
        id: '2',
        customerId: null,
        customerName: 'Khách hàng ẩn danh',
        staffId: null,
        staffName: null,
        lastMessage: 'Tôi muốn biết thêm về dịch vụ vận chuyển',
        lastMessageTime: new Date(Date.now() - 30 * 60000).toISOString(),
        unreadCount: 1,
        status: 'pending',
        messages: [
            {
                id: '2001',
                senderId: 'anonymous',
                senderName: 'Khách hàng ẩn danh',
                senderType: 'anonymous',
                content: 'Tôi muốn biết thêm về dịch vụ vận chuyển',
                timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
                isRead: false
            }
        ]
    },
    {
        id: '3',
        customerId: '103',
        customerName: 'Trần Thị B',
        staffId: '201',
        staffName: 'Nhân viên CSKH',
        lastMessage: 'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi',
        lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
        unreadCount: 0,
        status: 'closed',
        messages: [
            {
                id: '3001',
                senderId: '103',
                senderName: 'Trần Thị B',
                senderType: 'customer',
                content: 'Đơn hàng của tôi đã được giao chưa?',
                timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
                isRead: true
            },
            {
                id: '3002',
                senderId: '201',
                senderName: 'Nhân viên CSKH',
                senderType: 'staff',
                content: 'Đơn hàng của bạn đang được vận chuyển và sẽ được giao trong hôm nay',
                timestamp: new Date(Date.now() - 2.5 * 3600000).toISOString(),
                isRead: true
            },
            {
                id: '3003',
                senderId: '103',
                senderName: 'Trần Thị B',
                senderType: 'customer',
                content: 'Cảm ơn bạn',
                timestamp: new Date(Date.now() - 2.2 * 3600000).toISOString(),
                isRead: true
            },
            {
                id: '3004',
                senderId: '201',
                senderName: 'Nhân viên CSKH',
                senderType: 'staff',
                content: 'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi',
                timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
                isRead: true
            }
        ]
    }
]; 