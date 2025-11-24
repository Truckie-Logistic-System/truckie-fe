import React from 'react';
import { Badge, message } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useChatContext } from '@/context/ChatContext';
import { useChatRoom } from '@/hooks/useChatRoom';

interface ChatButtonProps {
    onOpen?: () => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onOpen }) => {
    const {
        toggleChat,
        unreadCount,
        setUIChatMessages,
        initChat,
        connectionStatus
    } = useChatContext();

    const userId = sessionStorage.getItem('userId');
    const { fetchChatMessages } = useChatRoom();

    const handleChatClick = async () => {
        if (!userId) {
            message.error("Bạn chưa đăng nhập!");
            return;
        }

        try {
            message.loading({ content: 'Đang kiểm tra phòng hỗ trợ...', key: 'chat-loading' });

            // Fetch chat messages
            const result = await fetchChatMessages(userId);

            if (result.success) {
                message.success({ content: 'Đã tải tin nhắn hỗ trợ!', key: 'chat-loading' });
                await initChat(userId);
            } else {
                message.error({ content: result.message || 'Không thể tải tin nhắn', key: 'chat-loading' });
            }

            // Notify parent to close other chat
            onOpen?.();

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
        <div className="fixed bottom-4 right-4" style={{ zIndex: 998 }}>
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