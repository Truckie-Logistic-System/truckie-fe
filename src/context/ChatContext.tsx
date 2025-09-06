import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { MOCK_CONVERSATIONS } from '@/models/Chat';
import type { ChatConversation, ChatMessage } from '@/models/Chat';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

interface ChatContextType {
    conversations: ChatConversation[];
    activeConversation: ChatConversation | null;
    unreadCount: number;
    isOpen: boolean;
    isMinimized: boolean;
    setActiveConversation: (conversation: ChatConversation | null) => void;
    sendMessage: (content: string, conversationId?: string) => void;
    markAsRead: (conversationId: string) => void;
    toggleChat: () => void;
    minimizeChat: () => void;
    maximizeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
    isStaff?: boolean;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, isStaff = false }) => {
    const [conversations, setConversations] = useState<ChatConversation[]>(MOCK_CONVERSATIONS);
    const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
    const [isOpen, setIsOpen] = useState(false); // Mặc định không mở chat window
    const [isMinimized, setIsMinimized] = useState(false);
    const { user } = useAuth();

    // Nếu là customer/guest, chỉ hiển thị cuộc hội thoại của họ
    useEffect(() => {
        if (!isStaff && user?.id) {
            // Lọc cuộc hội thoại của customer hiện tại
            const userConversation = conversations.find(conv => conv.customerId === user.id);
            if (userConversation) {
                setActiveConversation(userConversation);
            }
        } else if (!isStaff) {
            // Nếu là guest, tạo cuộc hội thoại mới khi họ mở chat
            setActiveConversation(null);
        }
    }, [isStaff, user, conversations]);

    // Calculate total unread messages
    const unreadCount = conversations.reduce((count, conv) => {
        // Nếu là staff, đếm tất cả các tin nhắn chưa đọc
        // Nếu là customer/guest, chỉ đếm tin nhắn chưa đọc trong cuộc hội thoại của họ
        if (isStaff) {
            return count + conv.unreadCount;
        } else if (user?.id && conv.customerId === user.id) {
            return count + conv.unreadCount;
        } else if (!user && !conv.customerId) {
            return count + conv.unreadCount;
        }
        return count;
    }, 0);

    // Simulate receiving a new message every 30 seconds for demo
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (isStaff) {
            const simulateNewMessage = () => {
                const randomIndex = Math.floor(Math.random() * conversations.length);
                const conversation = { ...conversations[randomIndex] };

                if (conversation.status !== 'closed') {
                    const newMessage: ChatMessage = {
                        id: uuidv4(),
                        senderId: conversation.customerId || 'anonymous',
                        senderName: conversation.customerName,
                        senderType: conversation.customerId ? 'customer' : 'anonymous',
                        content: `Tin nhắn mới từ ${conversation.customerName} lúc ${new Date().toLocaleTimeString()}`,
                        timestamp: new Date().toISOString(),
                        isRead: false,
                    };

                    conversation.messages = [...conversation.messages, newMessage];
                    conversation.lastMessage = newMessage.content;
                    conversation.lastMessageTime = newMessage.timestamp;
                    conversation.unreadCount += 1;

                    const updatedConversations = [...conversations];
                    updatedConversations[randomIndex] = conversation;

                    setConversations(updatedConversations);

                    // Update active conversation if it's the one that received a new message
                    if (activeConversation?.id === conversation.id) {
                        setActiveConversation(conversation);
                    }
                }

                timeoutId = setTimeout(simulateNewMessage, 30000);
            };

            timeoutId = setTimeout(simulateNewMessage, 30000);
        } else if (!isStaff && activeConversation && activeConversation.status !== 'closed') {
            // Simulate staff response for customer/guest
            const simulateStaffResponse = () => {
                const staffResponses = [
                    'Xin chào, tôi có thể giúp gì cho bạn?',
                    'Cảm ơn bạn đã liên hệ với chúng tôi.',
                    'Vui lòng đợi một chút, tôi đang kiểm tra thông tin.',
                    'Chúng tôi sẽ xử lý yêu cầu của bạn sớm nhất có thể.'
                ];

                const randomResponse = staffResponses[Math.floor(Math.random() * staffResponses.length)];

                const newMessage: ChatMessage = {
                    id: uuidv4(),
                    senderId: 'staff-auto',
                    senderName: 'Nhân viên hỗ trợ',
                    senderType: 'staff',
                    content: randomResponse,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                };

                const updatedConversation = {
                    ...activeConversation,
                    lastMessage: randomResponse,
                    lastMessageTime: newMessage.timestamp,
                    messages: [...activeConversation.messages, newMessage],
                    unreadCount: activeConversation.unreadCount + 1
                };

                const updatedConversations = conversations.map(c =>
                    c.id === updatedConversation.id ? updatedConversation : c
                );

                setConversations(updatedConversations);
                setActiveConversation(updatedConversation);

                timeoutId = setTimeout(simulateStaffResponse, Math.random() * 20000 + 10000); // 10-30s
            };

            timeoutId = setTimeout(simulateStaffResponse, Math.random() * 5000 + 5000); // 5-10s
        }

        return () => {
            clearTimeout(timeoutId);
        };
    }, [conversations, activeConversation, isStaff]);

    const toggleChat = () => {
        // Khi mở chat, luôn mở với kích thước lớn (không thu nhỏ)
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    const minimizeChat = () => {
        setIsMinimized(true);
    };

    const maximizeChat = () => {
        setIsMinimized(false);
    };

    const sendMessage = (content: string, conversationId?: string) => {
        if (!content.trim()) return;

        let targetConversation: ChatConversation | undefined;
        let isNewConversation = false;

        if (conversationId) {
            targetConversation = conversations.find(c => c.id === conversationId);
        } else if (activeConversation) {
            targetConversation = activeConversation;
        } else {
            // Create a new conversation for anonymous user or customer
            const newConversationId = uuidv4();
            const isCustomer = user && user.role === 'customer';

            targetConversation = {
                id: newConversationId,
                customerId: isCustomer ? user.id : null,
                customerName: isCustomer ? user.username : 'Khách hàng ẩn danh',
                staffId: null,
                staffName: null,
                lastMessage: content,
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                status: 'pending',
                messages: [],
            };

            isNewConversation = true;
        }

        if (!targetConversation) return;

        const newMessage: ChatMessage = {
            id: uuidv4(),
            senderId: user?.id || 'anonymous',
            senderName: user?.username || 'Khách hàng ẩn danh',
            senderType: isStaff ? 'staff' : (user ? 'customer' : 'anonymous'),
            content,
            timestamp: new Date().toISOString(),
            isRead: false,
        };

        const updatedConversation = {
            ...targetConversation,
            lastMessage: content,
            lastMessageTime: newMessage.timestamp,
            messages: [...targetConversation.messages, newMessage],
        };

        let updatedConversations: ChatConversation[];

        if (isNewConversation) {
            updatedConversations = [...conversations, updatedConversation];
        } else {
            updatedConversations = conversations.map(c =>
                c.id === updatedConversation.id ? updatedConversation : c
            );
        }

        setConversations(updatedConversations);
        setActiveConversation(updatedConversation);

        // Đảm bảo chat window mở khi gửi tin nhắn
        if (!isOpen) {
            setIsOpen(true);
            setIsMinimized(false);
        }
    };

    const markAsRead = (conversationId: string) => {
        const updatedConversations = conversations.map(conversation => {
            if (conversation.id === conversationId) {
                const updatedMessages = conversation.messages.map(message => ({
                    ...message,
                    isRead: true,
                }));

                return {
                    ...conversation,
                    unreadCount: 0,
                    messages: updatedMessages,
                };
            }
            return conversation;
        });

        setConversations(updatedConversations);

        const updatedActiveConversation = updatedConversations.find(
            c => c.id === conversationId
        ) || null;

        setActiveConversation(updatedActiveConversation);
    };

    const value = {
        conversations,
        activeConversation,
        unreadCount,
        isOpen,
        isMinimized,
        setActiveConversation,
        sendMessage,
        markAsRead,
        toggleChat,
        minimizeChat,
        maximizeChat,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext; 