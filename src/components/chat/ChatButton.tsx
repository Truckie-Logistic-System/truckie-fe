import React from 'react';
import { Badge, message } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';
import roomService from '@/services/room/roomService';
import chatService from '@/services/chat/chatService';
import { mapChatMessageDTOArrayToUI } from '@/utils/chatMapper';

const ChatButton: React.FC = () => {
    const { 
        toggleChat, 
        unreadCount, 
        setUIChatMessages, // New method for UI messages
        initChat,
        connectionStatus 
    } = useChatContext();

    const userId = localStorage.getItem('userId');

    const handleChatClick = async () => {
        if (!userId) {
            message.error("Bạn chưa đăng nhập!");
            return;
        }

        try {
            message.loading({ content: 'Đang kiểm tra phòng hỗ trợ...', key: 'chat-loading' });

            // Check if user has existing support room
            const hasRoom = await roomService.isCustomerHasRoomSupported(userId);

            if (!hasRoom) {
                // Create new support room
                const newRoom = await roomService.createRoom({
                    orderId: undefined,
                    userId: userId, // Fixed: should be userIds array
                });
                
                console.log("✅ Created new support room:", newRoom);
                message.success({ content: 'Đã tạo phòng hỗ trợ mới!', key: 'chat-loading' });
                
                // Initialize chat with new room
                await initChat(userId);
                
            } else {
                // Load existing support room messages
                const chatPage = await chatService.getMessagesSupportedForCustomer(userId, 20);
                
                // Map API data to UI format
                const uiMessages = mapChatMessageDTOArrayToUI(chatPage.messages, userId);
                
                console.log("✅ Loaded support messages:", uiMessages);
                message.success({ content: 'Đã tải tin nhắn hỗ trợ!', key: 'chat-loading' });
                
                // Set UI messages
                setUIChatMessages(uiMessages);
                
                // Also initialize the chat context for WebSocket
                await initChat(userId);
            }

            // Open chat UI
            toggleChat();

        } catch (error) {
            console.error("❌ ChatButton error:", error);
            message.error({ 
                content: 'Không thể mở phòng hỗ trợ! Vui lòng thử lại.', 
                key: 'chat-loading' 
            });
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Badge count={unreadCount} overflowCount={99}>
                <div
                    onClick={handleChatClick}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center 
                        shadow-lg cursor-pointer transition-all duration-200
                        ${connectionStatus === 'connected' 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }
                        ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}
                    `}
                >
                    <MessageOutlined style={{ fontSize: '24px', color: 'white' }} />
                </div>
            </Badge>
            
            {/* Connection indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white">
                <div className={`
                    w-full h-full rounded-full
                    ${connectionStatus === 'connected' ? 'bg-green-400' : ''}
                    ${connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : ''}
                    ${connectionStatus === 'disconnected' ? 'bg-gray-400' : ''}
                    ${connectionStatus === 'error' ? 'bg-red-400' : ''}
                `} />
            </div>
        </div>
    );
};

export default ChatButton;